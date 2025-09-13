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
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
  <button onClick={() => navigate(-1)}>← Back</button>
      <h2>{project.name}</h2>
      {project.imageUrl && (
        <div style={{ width: '100%', height: 220, overflow: 'hidden', borderRadius: 8, margin: '12px 0' }}>
          <img src={project.imageUrl} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
  {project.summary && <p style={{ fontWeight: 600 }}>{project.summary}</p>}
  <p>{project.description}</p>
      <div><strong>Estimated Time:</strong> {project.estimatedMinutes ? `${Math.floor(project.estimatedMinutes/60)}h ${project.estimatedMinutes%60}m` : project.estimatedTime}</div>
      {project.volunteerHours ? (<div><strong>Volunteer Hours:</strong> {project.volunteerHours}</div>) : null}
      <div><strong>Required Skills:</strong> {project.requiredSkills?.join(', ')}</div>
      {project.company && (
        <div style={{ margin: '12px 0', fontStyle: 'italic' }}>
          <strong>Company:</strong> {project.company.name}
          {project.company.website && (
            <>
              {' '}| <a href={project.company.website} target="_blank" rel="noopener noreferrer">{project.company.website}</a>
            </>
          )}
        </div>
      )}
      {project.githubUrl && (() => {
        try {
          // prefer explicit persisted currentProjects list
          const curStr = localStorage.getItem('currentProjects');
          if (curStr) {
            const arr = JSON.parse(curStr || '[]');
            if (Array.isArray(arr) && arr.some(i => String(i._id) === String(project._id))) {
              return (<div><strong>Repository:</strong> <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">{project.githubUrl}</a></div>);
            }
          }
          // fallback: check user profile stored in localStorage
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user && Array.isArray(user.currentProjects) && user.currentProjects.some(c => String(c.projectId || c._id || c) === String(project._id))) {
              return (<div><strong>Repository:</strong> <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">{project.githubUrl}</a></div>);
            }
          }
        } catch (e) {
          // ignore parse errors and hide repo by default
        }
        return null;
      })()}
      <div style={{ marginTop: 24 }}>
        <strong>Interested Users:</strong> {project.interestedUsers?.length || 0}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
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
        }} style={{ padding: '8px 12px' }}>Save for later</button>

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
        }} style={{ padding: '8px 12px', background: '#2b8aef', color: '#fff', border: 'none', borderRadius: 4 }}>Apply</button>
      </div>
    </div>
  );
};

export default ProjectInformation;
