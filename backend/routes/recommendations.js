const express = require('express');
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
const User = require('../models/User');
const { createEmbedding, cosine } = require('../lib/llm');
const pdf = require('pdf-parse');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Helper to require auth and return user
async function getUserFromHeader(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ userId: decoded.userId });
    return user;
  } catch (e) {
    return null;
  }
}

// POST /api/recommendations
// Body: { topK: number (optional, default 10) }
// Returns: array of recommended projects with scores and explanation by LLM
router.post('/recommendations', async (req, res) => {
  try {
    const user = await getUserFromHeader(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const topK = parseInt(req.body.topK || 10, 10);

    // Build a textual profile: skills + resume text (if present) + github repo READMEs (if available)
    let profileTextParts = [];
    if (Array.isArray(user.skills) && user.skills.length) profileTextParts.push('Skills: ' + user.skills.join(', '));
    if (user.resume && user.resume.data) {
      try {
        const data = await pdf(user.resume.data);
        profileTextParts.push(`Resume: ${data.text}`);
      } catch (e) {
        // ignore resume parsing errors
      }
    }

    // If user has GitHub token, attempt to fetch top repos' README content (best-effort)
    const githubToken = user.github && user.github.accessToken;
    if (githubToken) {
      try {
        const fetchFn = (typeof globalThis.fetch === 'function') ? globalThis.fetch.bind(globalThis) : require('node-fetch');
        const reposRes = await fetchFn('https://api.github.com/user/repos?per_page=5&sort=updated', { headers: { Authorization: `token ${githubToken}`, 'User-Agent': 'hophacks-app' } });
        const repos = await reposRes.json();
        if (Array.isArray(repos)) {
          for (const r of repos) {
            try {
              const readmeRes = await fetchFn(`https://raw.githubusercontent.com/${r.full_name}/master/README.md`);
              if (readmeRes && readmeRes.ok) {
                const txt = await readmeRes.text();
                profileTextParts.push(`Repo ${r.full_name} README: ${txt.slice(0, 2000)}`);
              }
            } catch (e) {
              // ignore per-repo failures
            }
          }
        }
      } catch (e) {
        // best-effort; ignore
      }
    }

    const profileText = profileTextParts.join('\n\n').slice(0, 30000);
    const profileEmbedding = await createEmbedding(profileText);
    if (!profileEmbedding) return res.status(500).json({ error: 'Failed to create embedding for profile' });

    // Find candidate projects with embeddings cached; compute similarity
    const projects = await Project.find({ embedding: { $exists: true, $ne: null } }).limit(1000).lean();
    const scored = [];
    for (const p of projects) {
      if (!p.embedding) continue;
      const score = cosine(profileEmbedding, p.embedding);
      scored.push({ project: p, score });
    }
    scored.sort((a, b) => b.score - a.score);
    const candidates = scored.slice(0, Math.max(topK * 4, 40)); // take more for rerank

    // Prepare prompt for reranking: include brief profile and candidate descriptions
    const model = process.env.GEMINI_MODEL || process.env.OPENAI_RERANK_MODEL || 'models/text-bison-001';
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'LLM API key not configured' });

    // Build a compact re-rank prompt
    let prompt = `You are an assistant that ranks and explains projects for a volunteer based on their profile.\nUser profile:\n${profileText}\n\nCandidates:\n`;
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      prompt += `\n[${i}] ${c.project.name} - ${ (c.project.description || '').slice(0, 400) }\n`;
    }
    prompt += `\nTask: Rank the candidates in order of suitability (1 = best). For the top ${topK}, output JSON array with fields: index, projectId, score (0-1), explanation (1-2 sentences). Only output valid JSON.`;

    // Call Gemini or OpenAI completion endpoint
    let llmResponseText = '';
    try {
      if (process.env.EMBEDDING_PROVIDER === 'openai' || process.env.OPENAI_API_KEY) {
        // call OpenAI completion (text-davinci-like) via v1/completions or chat completions
        const fetchFn = (typeof globalThis.fetch === 'function') ? globalThis.fetch.bind(globalThis) : require('node-fetch');
        const resp = await fetchFn('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: process.env.OPENAI_RERANK_MODEL || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 600 })
        });
        const j = await resp.json();
        llmResponseText = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      } else {
        // GeminI Re-rank via REST (simple text completion)
        const fetchFn = (typeof globalThis.fetch === 'function') ? globalThis.fetch.bind(globalThis) : require('node-fetch');
        const endpoint = `https://gemini.googleapis.com/v1/models/${model}:predict`;
        const resp = await fetchFn(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ instances: [{ content: prompt }], parameters: { maxOutputTokens: 600 } })
        });
        const j = await resp.json();
        if (j && j.predictions && j.predictions.length) llmResponseText = j.predictions[0].content && j.predictions[0].content[0] && j.predictions[0].content[0].text;
      }
    } catch (e) {
      console.error('LLM call failed', e && e.message);
      return res.status(500).json({ error: 'LLM call failed', details: e && e.message });
    }

    // Try to parse the JSON out of the response
    let parsed = null;
    try {
      const jsonStart = llmResponseText.indexOf('[');
      const jsonText = llmResponseText.slice(jsonStart);
      parsed = JSON.parse(jsonText);
    } catch (e) {
      // log raw LLM output for debugging
      console.error('Failed to parse LLM output as JSON. Raw LLM output follows:\n', llmResponseText);
      console.error('JSON parse error:', e && e.message);
      // fallback: return candidates with computed similarity scores
      const simple = candidates.slice(0, topK).map(c => ({ projectId: c.project._id, name: c.project.name, similarity: c.score }));
      return res.json({ recommendations: simple, rawLLM: llmResponseText });
    }

    // Map parsed rankings back to projects
    const results = parsed.map(item => {
      const proj = candidates[item.index] && candidates[item.index].project;
      return {
        projectId: proj ? proj._id : null,
        name: proj ? proj.name : null,
        score: item.score || (candidates[item.index] && candidates[item.index].score) || 0,
        explanation: item.explanation || ''
      };
    }).slice(0, topK);

    return res.json({ recommendations: results, rawLLM: llmResponseText });
  } catch (err) {
    // log full stack for debugging
    console.error('Recommendations error', err && err.stack ? err.stack : err && err.message);
    res.status(500).json({ error: 'Recommendations failed', details: err && err.message });
  }
});

module.exports = router;
