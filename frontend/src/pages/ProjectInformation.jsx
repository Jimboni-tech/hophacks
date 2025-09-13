import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ProjectInformation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_URL}/projects/${id}`, { headers });
        setProject(res.data);
        // no automatic marking on load — explicit actions only
      } catch (err) {
        setError('Failed to fetch project information');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!project) return <div>Project not found.</div>;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 0 }}>
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: 18 }}>← Back</button>
        {/* Project header and image */}
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{project.name}</h2>
        {project.imageUrl && (
          <div style={{ width: '100%', height: 220, overflow: 'hidden', borderRadius: 10, margin: '16px 0', boxShadow: '0 4px 18px rgba(0,0,0,0.07)' }}>
            <img src={project.imageUrl} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Summary/info section */}
        {project.summary && <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--muted)', marginBottom: 10 }}>{project.summary}</div>}

        {/* Description card */}
        {project.description && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 22px', marginBottom: 22, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18, color: 'var(--accent)', fontWeight: 700 }}>Project Description</h3>
            <div style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.7 }}>{project.description}</div>
          </div>
        )}

        {/* Key info section */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 18, alignItems: 'center' }}>
          <div style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600 }}>
            <strong>Estimated Time:</strong> {project.estimatedMinutes ? `${Math.floor(project.estimatedMinutes/60)}h ${project.estimatedMinutes%60}m` : project.estimatedTime}
          </div>
          {project.volunteerHours ? (
            <div style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600 }}><strong>Volunteer Hours:</strong> {project.volunteerHours}</div>
          ) : null}
          <div style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600 }}><strong>Required Skills:</strong> {project.requiredSkills?.join(', ')}</div>
        </div>

        {/* Company info */}
        {project.company && (
          <div style={{ margin: '12px 0', fontStyle: 'italic', fontSize: 15 }}>
            <strong>Company:</strong> {project.company.name}
            {project.company.website && (
              <>
                {' '}| <a href={project.company.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{project.company.website}</a>
              </>
            )}
          </div>
        )}

        {/* Repository link (if allowed) */}
        {project.githubUrl && (() => {
          try {
            // prefer explicit persisted currentProjects list
            const curStr = localStorage.getItem('currentProjects');
            if (curStr) {
              const arr = JSON.parse(curStr || '[]');
              if (Array.isArray(arr) && arr.some(i => String(i._id) === String(project._id))) {
                return (<div style={{ marginBottom: 10 }}><strong>Repository:</strong> <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{project.githubUrl}</a></div>);
              }
            }
            // fallback: check user profile stored in localStorage
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              if (user && Array.isArray(user.currentProjects) && user.currentProjects.some(c => String(c.projectId || c._id || c) === String(project._id))) {
                return (<div style={{ marginBottom: 10 }}><strong>Repository:</strong> <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{project.githubUrl}</a></div>);
              }
            }
          } catch (e) {
            // ignore parse errors and hide repo by default
          }
          return null;
        })()}

        {/* Interested users */}
        <div style={{ marginTop: 18, fontSize: 15, color: 'var(--muted)' }}>
          <strong>Interested Users:</strong> {project.interestedUsers?.length || 0}
        </div>

        {/* Action buttons */}
        <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
          <button onClick={async () => {
            const token = localStorage.getItem('token');
            if (!token) return alert('Please login to save this project');
            try {
              await axios.post(`${API_URL}/user/interested/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
              // refresh project
              const res = await axios.get(`${API_URL}/projects/${id}`);
              setProject(res.data);
              // refresh profile and store
              try {
                const profileRes = await axios.get(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
                localStorage.setItem('user', JSON.stringify(profileRes.data));
                window.dispatchEvent(new Event('userChanged'));
              } catch (e) {
                // ignore profile refresh errors
              }
              alert('Saved for later');
            } catch (e) {
              alert('Failed to save project');
            }
          }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--accent)', fontWeight: 600 }}>Save for later</button>

          <button onClick={async () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (!token || !userStr) return alert('Please log in as a user to apply');
            try {
              const user = JSON.parse(userStr);
              const userId = user.userId || user.userId;
              // prompt for submission URL and notes (quick UX)
              const defaultUrl = project.githubUrl || '';
              const submissionUrl = window.prompt('Submission URL (link to resume / repo / gist):', defaultUrl);
              if (!submissionUrl) return alert('Submission cancelled');
              const notes = window.prompt('Optional message / notes for the company:', '');
              // post submission
              await axios.post(`${API_URL}/projects/${id}/submissions`, { userId, submissionUrl, notes });
              // refresh project interested count
              const res = await axios.get(`${API_URL}/projects/${id}`);
              setProject(res.data);
              // refresh profile and store (to update appliedProjects etc.)
              try {
                const profileRes = await axios.get(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
                localStorage.setItem('user', JSON.stringify(profileRes.data));
                window.dispatchEvent(new Event('userChanged'));
              } catch (e) {
                // ignore profile refresh errors
              }
              alert('Application submitted — the company will be notified.');
            } catch (e) {
              // show server error message when available
              const msg = e?.response?.data?.error || e.message || 'Failed to submit application';
              alert(msg);
            }
          }} style={{ padding: '8px 12px', background: '#2b8aef', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>Apply</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectInformation;
