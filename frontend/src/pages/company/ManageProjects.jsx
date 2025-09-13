import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/company/projects', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setProjects(json.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div style={{ padding: 28, maxWidth: 900, margin: '80px auto' }}>
      <h2>Manage Projects</h2>
      <div style={{ margin: '12px 0 20px' }}>
        <button onClick={() => navigate('/company/projects/new')} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Post Project</button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ display: 'grid', gap: 12 }}>
          {projects.length === 0 && <div>No projects yet. Create one to get applicants.</div>}
          {projects.map((p) => (
            <div key={p._id} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: 'var(--muted)', marginTop: 6 }}>{p.description?.slice(0, 240)}</div>
                <div style={{ marginTop: 8, color: 'var(--muted)' }}>Skills: {Array.isArray(p.requiredSkills) ? p.requiredSkills.join(', ') : ''}</div>
                <div style={{ marginTop: 8, color: 'var(--muted)' }}>Estimated: {p.estimatedTime || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => navigate(`/projects/${p._id}`)} style={{ padding: '6px 10px' }}>View</button>
                <button onClick={() => alert('Implement edit/delete later')} style={{ padding: '6px 10px' }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageProjects;
