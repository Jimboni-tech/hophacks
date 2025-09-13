import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [skillsInput, setSkillsInput] = useState('');
  const [skills, setSkills] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSkill = () => {
    const s = skillsInput.trim();
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s]);
    setSkillsInput('');
  };

  const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s));

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    setResumeFile(f || null);
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      // update skills
      await axios.post(`${API_URL}/user/profile/skills`, { skills }, { headers: { Authorization: `Bearer ${token}` } });

      // upload resume as base64
      if (resumeFile) {
        const base64 = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result.split(',')[1]);
          reader.onerror = rej;
          reader.readAsDataURL(resumeFile);
        });
        const r = await axios.post(`${API_URL}/user/profile/resume`, { filename: resumeFile.name, contentType: resumeFile.type, base64 }, { headers: { Authorization: `Bearer ${token}` } });
        // show filename returned by server
        setResumeName(r.data.filename || resumeFile.name);
        setResumeFile(null);
      }

  // navigate to home page after successful profile setup
  navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '80px auto' }}>
      <h2>Finish setting up your profile</h2>
      <p style={{ color: 'var(--muted)' }}>Add skills you are familiar with and upload a resume to help organizations evaluate your experience. </p>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>Skills</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="Add a skill" style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14 }} />
          <button type="button" onClick={addSkill} style={{ padding: '6px 8px', borderRadius: 6, fontSize: 14, background: '#16a34a', color: '#fff', border: 'none' }}>Add</button>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {skills.map(s => (
            <div key={s} style={{ padding: '4px 6px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13, display: 'inline-flex', alignItems: 'center' }}>
              <span style={{ marginRight: 6 }}>{s}</span>
              <button onClick={() => removeSkill(s)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>Resume (PDF preferred)</label>
        <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFileChange} />
  {resumeFile && <div style={{ marginTop: 8 }}>{resumeFile.name} — {(resumeFile.size / 1024).toFixed(0)} KB</div>}
  {resumeName && <div style={{ marginTop: 8, color: 'var(--muted)' }}>Uploaded: {resumeName}</div>}
      </div>

      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}

      <div style={{ marginTop: 20 }}>
        <button onClick={handleSave} disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none' }}>{loading ? 'Saving…' : 'Save profile'}</button>
      </div>
      <div style={{ marginTop: 16 }}>
        <p style={{ color: 'var(--muted)', marginBottom: 8 }}>Connect your GitHub account to show contributions and enable quick repo linking.</p>
        <button type="button" onClick={() => {
          const token = localStorage.getItem('token');
          const url = `${API_URL.replace('/api','')}/api/auth/github${token ? `?token=${encodeURIComponent(token)}&returnTo=/setup-profile` : '?returnTo=/setup-profile'}`;
          window.open(url, '_blank');
        }} style={{ padding: '8px 12px', borderRadius: 8, background: '#24292e', color: '#fff', border: 'none' }}>Connect GitHub</button>
      </div>
    </div>
  );
};

export default ProfileSetup;
