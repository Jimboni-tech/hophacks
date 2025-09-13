import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PostProject = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  
  const [repoUrl, setRepoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Project name is required');
    if (!summary || summary.trim().length < 10) return setError('Please provide a short one or two sentence summary (10+ characters)');
  if (!repoUrl || !repoUrl.includes('github.com')) return setError('A valid GitHub repository URL is required');
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) return setError('A valid image URL is required');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({
          name,
          description,
          summary,
          requiredSkills: skills.split(',').map(s => s.trim()).filter(Boolean),
          estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
          githubUrl: repoUrl,
          imageUrl: imageUrl
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create project');
      // navigate to company projects list
      navigate('/company/projects');
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: 32, background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, marginBottom: 18 }}>Post a New Project</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <label style={{ fontWeight: 600, fontSize: 15 }}>Project Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Short, descriptive name" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 16, marginTop: 6 }} />
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: 15 }}>Short Summary (1-2 sentences)</label>
          <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="A one or two sentence summary shown on the home page" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 16, marginTop: 6 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600, fontSize: 15 }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project, goals, and deliverables" rows={5} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 16, marginTop: 6, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, fontSize: 15 }}>Required Skills (comma separated)</label>
            <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, Python, data analysis" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 16, marginTop: 6 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, fontSize: 15 }}>Approximate Minutes</label>
            <input value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} placeholder="Total minutes (e.g. 90)" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 16, marginTop: 6 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, fontSize: 15 }}>Image URL</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://.../image.jpg" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 16, marginTop: 6 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, fontSize: 15 }}>Repository URL</label>
            <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/owner/repo" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 16, marginTop: 6 }} />
          </div>
        </div>

        {error && <div style={{ color: '#dc2626', background: '#fef2f2', borderRadius: 8, padding: '10px 14px', fontWeight: 600, fontSize: 15 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ marginTop: 10, background: '#16a34a', color: '#fff', border: 'none', padding: '12px 0', borderRadius: 10, fontWeight: 700, fontSize: 18, boxShadow: '0 2px 8px rgba(22,163,74,0.08)', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>{loading ? 'Posting...' : 'Post Project'}</button>
      </form>
    </div>
  );
};

export default PostProject;


