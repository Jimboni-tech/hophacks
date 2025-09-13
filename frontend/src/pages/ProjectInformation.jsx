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
      {project.datasetUrl && (
        <div><strong>Dataset:</strong> <a href={project.datasetUrl} target="_blank" rel="noopener noreferrer">{project.datasetUrl}</a></div>
      )}
      {project.uiUrl && (
        <div><strong>UI:</strong> <a href={project.uiUrl} target="_blank" rel="noopener noreferrer">{project.uiUrl}</a></div>
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
          if (!token) return alert('Please login to apply');
          try {
            // call backend apply endpoint
            await axios.post(`${API_URL}/user/apply/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
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
            if (project.uiUrl) window.open(project.uiUrl, '_blank', 'noopener');
            else alert('Applied — no external apply link available');
          } catch (e) {
            alert('Failed to apply');
          }
        }} style={{ padding: '8px 12px', background: '#2b8aef', color: '#fff', border: 'none', borderRadius: 4 }}>Apply</button>
      </div>
    </div>
  );
};

export default ProjectInformation;
