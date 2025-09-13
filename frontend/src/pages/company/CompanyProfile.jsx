import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const CompanyProfile = () => {
  const [company, setCompany] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/company/me`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        setCompany(res.data.data);
      } catch (err) {
        console.error('Failed to load company profile', err);
        setError(err.response?.data?.error || 'Failed to load company');
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('company');
    window.dispatchEvent(new Event('userChanged'));
    navigate('/');
  };

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h3 style={{ color: 'var(--text)' }}>Organization</h3>
        <div style={{ color: 'red' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Organization Profile</h2>
      {!company ? (
        <div style={{ color: 'var(--muted)' }}>Loading...</div>
      ) : (
        <div style={{ maxWidth: 720, background: 'var(--surface)', border: '1px solid var(--border)', padding: 18, borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0 }}>{company.name || '(no name)'}</h3>
              <p style={{ marginTop: 6, color: 'var(--muted)' }}>{company.description || ''}</p>
              <p style={{ marginTop: 6 }}><strong>Email:</strong> {company.email}</p>
              {company.slug && <p style={{ marginTop: 6 }}><strong>Slug:</strong> {company.slug}</p>}
              {company.website && <p style={{ marginTop: 6 }}><strong>Website:</strong> <a href={company.website} target="_blank" rel="noreferrer">{company.website}</a></p>}
            </div>
            <div>
              <button onClick={handleLogout} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Logout</button>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 8 }}>Details</h4>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>{JSON.stringify(company, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProfile;
