import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ProjectInformation = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`${API_URL}/projects/${id}`);
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
  <Link to="/home">← Back to Home</Link>
      <h2>{project.name}</h2>
      <p>{project.description}</p>
      <div><strong>Estimated Time:</strong> {project.estimatedTime}</div>
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
      {project.githubUrl && (
        <div><strong>Repository:</strong> <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">{project.githubUrl}</a></div>
      )}
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
