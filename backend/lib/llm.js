const fetch = (typeof globalThis.fetch === 'function') ? globalThis.fetch.bind(globalThis) : (() => { try { return require('node-fetch'); } catch (e) { return null; } })();

const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || 'gemini';

async function createEmbedding(text) {
  if (!fetch) throw new Error('Server missing fetch; install node-fetch or use Node 18+');
  if (EMBEDDING_PROVIDER === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    const url = 'https://api.openai.com/v1/embeddings';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ input: text, model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small' })
    });
    const j = await res.json();
    return j.data && j.data[0] && j.data[0].embedding;
  }

  // default: Gemini embeddings via REST
  const rawModel = process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001';
  // normalize model name: allow either 'models/...' or plain 'embed-text-...'
  const model = rawModel.startsWith('models/') ? rawModel.replace(/^models\//, '') : rawModel;

  // If user configured a regional project/region, call the Vertex regional predict endpoint
  const project = process.env.GEMINI_PROJECT || process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  const region = process.env.GEMINI_REGION || process.env.GCP_REGION || process.env.GOOGLE_CLOUD_REGION || 'us-central1';

  // Build endpoint. If project is provided, use regional Vertex API path; otherwise try global gemini.googleapis.com
  let endpoint = '';
  if (project) {
    endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}/models/${model}:predict`;
  } else {
    // global endpoint (may not expose regional models)
    endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`;
  }

  // Decide auth: prefer GOOGLE_APPLICATION_CREDENTIALS (service account) -> oauth token; else if GEMINI_API_KEY looks like API key use ?key=; else if GEMINI_API_KEY present use Bearer
  const apiKey = process.env.GEMINI_API_KEY || '';
  const headers = { 'Content-Type': 'application/json' };

  let finalEndpoint = endpoint;
  if (apiKey) {
    // If apiKey looks like an API key (starts with AI orAIza), use ?key=... for Google APIs
    if (/^(AIza|AIza)/.test(apiKey) || apiKey.length > 20) {
      finalEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`;
    } else {
      // fall back to bearer (some tokens may be direct OAuth tokens)
      headers.Authorization = `Bearer ${apiKey}`;
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // obtain access token via google-auth-library
    try {
      // lazy require
      const { GoogleAuth } = require('google-auth-library');
      const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
      const client = await auth.getClient();
      const tok = await client.getAccessToken();
      const accessToken = typeof tok === 'string' ? tok : (tok && tok.token);
      if (!accessToken) throw new Error('Failed to obtain access token from service account');
      headers.Authorization = `Bearer ${accessToken}`;
    } catch (e) {
      throw new Error('google-auth-library error: ' + (e && e.message));
    }
  }

  // Build body depending on endpoint type
  let body = null;
  if (project) {
    // regional Vertex predict expects instances
    body = JSON.stringify({ instances: [{ content: text }], parameters: {} });
  } else {
    body = JSON.stringify({ model: `models/${model}`, content: { parts: [{ text }] } });
  }

  const resp = await fetch(finalEndpoint, {
    method: 'POST',
    headers,
    body
  });

  // If the response is not OK or not JSON, surface the body for easier debugging
  const contentType = resp.headers.get('content-type') || '';
  if (!resp.ok) {
    const bodyText = await resp.text();
    throw new Error(`Embedding request failed: ${resp.status} ${resp.statusText} - ${bodyText.slice(0, 2000)}`);
  }
  if (!contentType.includes('application/json')) {
    const bodyText = await resp.text();
    throw new Error(`Embedding endpoint did not return JSON (content-type=${contentType}). Body: ${bodyText.slice(0,2000)}`);
  }
  const parsed = await resp.json();
  // GEMINI returns embeddings under .embedding or .embeddings depending on API or under predictions[].
  if (parsed && parsed.embedding) return parsed.embedding.values;
  if (parsed && parsed.embeddings && parsed.embeddings.length) return parsed.embeddings[0].values;
  if (parsed && parsed.predictions && parsed.predictions.length && parsed.predictions[0].embedding) return parsed.predictions[0].embedding.values;
  // Some Vertex models return nested content
  if (parsed && parsed.predictions && parsed.predictions.length && parsed.predictions[0].content) {
    // try to pick embedding inside content
    const c = parsed.predictions[0].content;
    if (Array.isArray(c) && c.length && c[0].textVector) return c[0].textVector;
  }
  return null;
}

// Simple cosine similarity
function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return -1;
  let dot = 0; let na = 0; let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return -1;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

module.exports = { createEmbedding, cosine };
