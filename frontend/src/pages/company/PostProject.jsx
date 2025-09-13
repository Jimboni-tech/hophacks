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
    <div style={{ maxWidth: 720, margin: '80px auto', padding: 24 }}>
      <h2>Post a New Project</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Project Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Short, descriptive name" />
        </label>

        <label>
          Short Summary (1-2 sentences)
          <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="A one or two sentence summary shown on the home page" />
        </label>

        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project, goals, and deliverables" rows={6} />
        </label>

        <label>
          Required Skills (comma separated)
          <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, Python, data analysis" />
        </label>

        <label>
          Approximate Minutes
          <input value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} placeholder="Total minutes (e.g. 90)" />
        </label>

        <label>
          Image URL
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://.../image.jpg" />
        </label>

        <label>
          Repository URL
          <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/owner/repo" />
        </label>

        {error && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}

        <div>
          <button type="submit" disabled={loading}>{loading ? 'Posting...' : 'Post Project'}</button>
        </div>
      </form>
    </div>
  );
};

export default PostProject;


