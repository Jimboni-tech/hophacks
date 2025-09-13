import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function CurrentProject() {
  const { id } = useParams();
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
      } catch (e) {
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) return <div style={{ maxWidth: 700, margin: '40px auto' }}>Loading...</div>;
  if (error) return <div style={{ color: 'red', maxWidth: 700, margin: '40px auto' }}>{error}</div>;
  if (!project) return <div style={{ maxWidth: 700, margin: '40px auto' }}>Project not found.</div>;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <Link to="/recent">← Back</Link>
      <h2 style={{ marginTop: 12 }}>{project.name}</h2>
      <p>{project.description}</p>
      {project.company && (
        <div style={{ marginTop: 8, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
          <strong>Company:</strong> {project.company.name}
          {project.company.website ? (
            <div><a href={project.company.website} target="_blank" rel="noopener noreferrer">{project.company.website}</a></div>
          ) : null}
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <strong>Repository:</strong>
        {project.githubUrl ? (
          <div style={{ marginTop: 8 }}>
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>{project.githubUrl}</a>
            <div style={{ marginTop: 12 }}>
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                <button style={{ padding: '10px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6 }}>Open Repository</button>
              </a>
            </div>
          </div>
        ) : (
          <div style={{ color: '#6b7280' }}>No repository link provided.</div>
        )}
      </div>
      {project.githubUrl && (
        <section style={{ marginTop: 20, padding: 16, borderRadius: 8, background: '#ffffff', boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
          <h3 style={{ marginTop: 0 }}>How to contribute (fork & PR)</h3>
          <p style={{ marginTop: 6 }}>Follow these steps to fork the repository, make your changes, and open a Pull Request. These instructions are auto-generated from the repository link.</p>
          <ol style={{ marginTop: 10 }}>
            <li>Open the repository: <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">{project.githubUrl}</a></li>
            <li>Click the <strong>Fork</strong> button in the top-right to create a copy under your GitHub account.</li>
            <li>Clone your fork locally:
              <pre style={{ background: '#f3f4f6', padding: 8, borderRadius: 6, marginTop: 6 }}>{`git clone ${toCloneUrl(project.githubUrl)}`}</pre>
            </li>
            <li>Create a branch for your work:
              <pre style={{ background: '#f3f4f6', padding: 8, borderRadius: 6, marginTop: 6 }}>{`git checkout -b feat/your-change`}</pre>
            </li>
            <li>Make changes, commit, and push your branch:
              <pre style={{ background: '#f3f4f6', padding: 8, borderRadius: 6, marginTop: 6 }}>{`git add .\ngit commit -m "Describe your change"\ngit push origin feat/your-change`}</pre>
            </li>
            <li>Open a Pull Request from your fork/branch to the original repository and mention the project in the PR description.</li>
          </ol>
          <div style={{ marginTop: 8, color: '#6b7280' }}>If you need help mapping the repository to this project, check that the repository URL matches the project's repository above.</div>
        </section>
      )}
    </div>
  );
}

function toCloneUrl(githubUrl) {
  try {
    // normalize common github URL forms to git clone url
    // examples: https://github.com/owner/repo or git@github.com:owner/repo.git
    if (githubUrl.startsWith('git@') || githubUrl.endsWith('.git')) return githubUrl;
    const url = new URL(githubUrl);
    const parts = url.pathname.replace(/^\//, '').replace(/\.git$/, '');
    return `git@${url.hostname}:${parts}.git`;
  } catch (e) {
    return githubUrl;
  }
}
