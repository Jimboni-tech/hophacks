import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PostProject = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Project name is required');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({
          name,
          description,
          requiredSkills: skills.split(',').map(s => s.trim()).filter(Boolean),
          estimatedTime
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
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project, goals, and deliverables" rows={6} />
        </label>

        <label>
          Required Skills (comma separated)
          <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, Python, data analysis" />
        </label>

        <label>
          Estimated Time
          <input value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} placeholder="e.g. 2 weeks, 40 hours" />
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
