import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.VITE_API_URL;

const RegisterCompany = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const userId = uuidv4();
      const payload = {
        userId,
        email,
        password,
        fullName: orgName,
        isCompany: true,
        description,
        imageUrl
        ,
        summary
      };
      const response = await axios.post(`${API_URL}/register`, payload);
      if (response.data && response.data.token) {
        const token = response.data.token;
        const user = response.data.user || null;
        localStorage.setItem('token', token);
        if (user) localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('userChanged'));
        setSuccess('Organization account created. You can post projects from your dashboard.');
        setTimeout(() => navigate('/profile'), 1200);
      } else {
        setError(response.data.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', border: '1px solid var(--border)', padding: 28, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: 0, marginBottom: 14, color: 'var(--text)', fontSize: 22, textAlign: 'center' }}>Create an Organization Account</h2>
        <p style={{ marginTop: 0, marginBottom: 18, color: 'var(--muted)', textAlign: 'center' }}>
          Register as a nonprofit or organization to post projects and manage volunteers.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)' }}>Organization Name</label>
          <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} required style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 15 }} />

          <label style={{ fontSize: 13, color: 'var(--muted)' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 15 }} />

          <label style={{ fontSize: 13, color: 'var(--muted)' }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 15 }} />

          <label style={{ fontSize: 13, color: 'var(--muted)' }}>Organization Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description of your organization" rows={3} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 15 }} />

          <label style={{ fontSize: 13, color: 'var(--muted)' }}>Image URL</label>
          <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/logo.png" style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 15 }} />

          <label style={{ fontSize: 13, color: 'var(--muted)' }}>One-line Summary</label>
          <input type="text" value={summary} onChange={e => setSummary(e.target.value)} placeholder="What does your organization do? One line." maxLength={140} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 15 }} />

          {error && <div style={{ color: 'red', fontSize: 14 }}>{error}</div>}
          {success && <div style={{ color: 'green', fontSize: 14 }}>{success}</div>}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="submit" style={{ marginTop: 6, background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Create organization account</button>
            <a href="/company/login" style={{ marginLeft: 8, alignSelf: 'center', color: 'var(--accent)', textDecoration: 'none' }}>Login to your organization</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterCompany;
