import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const Recent = () => {
  const [saved, setSaved] = useState([]);
  const [applied, setApplied] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setSaved([]);
          setApplied([]);
          setLoading(false);
          return;
        }
        const profileRes = await axios.get(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        const user = profileRes.data;

        const fetchProject = async (id) => {
          try {
            const res = await axios.get(`${API_URL}/projects/${id}`);
            return res.data;
          } catch (e) {
            return null;
          }
        };

        const savedProjects = await Promise.all((user.interestedProjects || []).map(fetchProject));
        const appliedProjects = await Promise.all((user.appliedProjects || []).map(fetchProject));

        setSaved(savedProjects.filter(Boolean));
        setApplied(appliedProjects.filter(Boolean));
      } catch (err) {
        setError('Failed to load recent lists');
      } finally {
        setLoading(false);
      }
    };
    fetchLists();
  }, []);

  if (loading) return <div style={{maxWidth: 600, margin: '80px auto', padding: 24}}>Loading...</div>;

  return (
    <div style={{maxWidth: 800, margin: '40px auto', padding: 24}}>
      <h2>Recent</h2>
      {error && <div style={{color: 'red'}}>{error}</div>}

      <section style={{marginTop: 20}}>
        <h3>Saved For Later</h3>
        {saved.length === 0 ? (
          <div>No saved projects.</div>
        ) : (
          <ul style={{listStyle: 'none', padding: 0}}>
            {saved.map(p => (
              <li key={p._id} style={{marginBottom: 12}}>
                <Link to={`/projects/${p._id}`}>{p.name}</Link>
                <div style={{fontSize: 13, color: '#666'}}>{p.description?.slice(0, 120)}{p.description && p.description.length > 120 ? '…' : ''}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{marginTop: 30}}>
        <h3>Applied</h3>
        {applied.length === 0 ? (
          <div>No applied projects.</div>
        ) : (
          <ul style={{listStyle: 'none', padding: 0}}>
            {applied.map(p => (
              <li key={p._id} style={{marginBottom: 12}}>
                <Link to={`/projects/${p._id}`}>{p.name}</Link>
                <div style={{fontSize: 13, color: '#666'}}>{p.description?.slice(0, 120)}{p.description && p.description.length > 120 ? '…' : ''}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Recent;
