import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [skillsInput, setSkillsInput] = useState('');
  const [skills, setSkills] = useState([]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');

  const [resumeName, setResumeName] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const res = await axios.get(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data);
        setSkills(res.data.skills || []);
        setResumeName(res.data.resume?.filename || (res.data.resume ? 'Uploaded' : null));
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    if (!confirm('Log out?')) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userChanged'));
    navigate('/');
  };

  const addSkill = () => {
    const s = skillsInput.trim();
    if (!s) return setSkillsInput('');
    if (skills.includes(s)) return setSkillsInput('');
    const newSkills = [...skills, s];
    setSkills(newSkills);
    setSkillsInput('');
    // persist immediately
    (async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/user/profile/skills`, { skills: newSkills }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to update skills');
      }
    })();
  };

  const removeSkill = (s) => {
    const newSkills = skills.filter(x => x !== s);
    setSkills(newSkills);
    // persist immediately
    (async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/user/profile/skills`, { skills: newSkills }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to update skills');
      }
    })();
  };

  // upload resume immediately when selected
  const uploadResume = async (file) => {
    if (!file) return;
    try {
      const token = localStorage.getItem('token');
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const r = await axios.post(`${API_URL}/user/profile/resume`, { filename: file.name, contentType: file.type, base64 }, { headers: { Authorization: `Bearer ${token}` } });
      setResumeName(r.data.filename || file.name);
      setResumeFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload resume');
    }
  };

  const changePassword = async () => {
    try {
      setPwMessage('');
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/user/change-password`, { currentPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      setPwMessage('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwMessage(err.response?.data?.error || 'Failed to change password');
    }
  };

  const downloadResume = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/user/profile/resume`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // try to get filename from Content-Disposition header
      const cd = res.headers['content-disposition'] || '';
      let filename = resumeName || 'resume.pdf';
      const match = cd.match(/filename\*?=(?:UTF-8'')?"?([^;"\n]+)"?/i);
      if (match && match[1]) filename = decodeURIComponent(match[1]);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || 'No resume available');
    }
  };

  const openResumeInline = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/user/profile/resume`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      // Note: cannot set filename when opening inline; download preserves filename via Content-Disposition
    } catch (err) {
      setError(err.response?.data?.error || 'No resume available');
    }
  };

  if (loading) return <div style={{ padding: 24, marginTop: 80 }}>Loading profile…</div>;
  if (error) return <div style={{ padding: 24, marginTop: 80, color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: '80px auto', padding: 24 }}>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: '0 0 220px', padding: 18, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{user.fullName}</div>
          <div style={{ color: 'var(--muted)', marginTop: 8 }}>{user.email}</div>
          <div style={{ marginTop: 16 }}>
            <button onClick={handleLogout} style={{ background: '#fff5f5', color: '#9b2c2c', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(155,44,44,0.12)' }}>Log out</button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <section style={{ padding: 18, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <h3 style={{ marginTop: 0 }}>Skills</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="Add a skill" style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)' }} />
              <button onClick={addSkill} style={{ padding: '6px 8px', borderRadius: 6, background: '#16a34a', color: '#fff', border: 'none' }}>Add</button>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {skills.map(s => (
                <div key={s} style={{ padding: '4px 6px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13, display: 'inline-flex', alignItems: 'center' }}>
                  <span style={{ marginRight: 6 }}>{s}</span>
                  <button onClick={() => removeSkill(s)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginTop: 16, padding: 18, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <h3 style={{ marginTop: 0 }}>Resume</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div>{resumeName || 'No resume uploaded'}</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {resumeName && <button onClick={openResumeInline} style={{ padding: '6px 10px', borderRadius: 6, background: '#16a34a', color: '#fff', border: 'none' }}>Open</button>}
                {resumeName && <button onClick={downloadResume} style={{ padding: '6px 10px', borderRadius: 6, background: '#16a34a', color: '#fff', border: 'none' }}>Download</button>}
                <label style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: '#16a34a', color: '#fff' }}>
                  Upload
                  <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => uploadResume(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
          </section>

          <section style={{ marginTop: 16, padding: 18, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <h3 style={{ marginTop: 0 }}>Change Password</h3>
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              <input type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
              <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={changePassword} style={{ padding: '8px 12px', borderRadius: 6, background: '#16a34a', color: '#fff', border: 'none' }}>Change password</button>
                <div style={{ color: 'var(--muted)' }}>{pwMessage}</div>
              </div>
            </div>
          </section>
          <section style={{ marginTop: 16, padding: 18, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <h3 style={{ marginTop: 0 }}>GitHub</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {user.github?.login ? (
                <>
                  <img src={user.github.avatarUrl} alt="GitHub avatar" style={{ width: 48, height: 48, borderRadius: 6 }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <a href={user.github.profileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{user.github.login}</a>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>Connected</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, color: 'var(--muted)' }}>Not connected</div>
                  <button onClick={() => {
                    const token = localStorage.getItem('token');
                    const url = `${API_URL.replace('/api','')}/api/auth/github${token ? `?token=${encodeURIComponent(token)}&returnTo=/profile` : '?returnTo=/profile'}`;
                    window.open(url, '_blank');
                  }} style={{ padding: '8px 12px', borderRadius: 6, background: '#24292e', color: '#fff', border: 'none' }}>Connect GitHub</button>
                </>
              )}
              <div style={{ marginLeft: 'auto' }}>
                <button onClick={() => window.location.href = '/recommendations'} style={{ padding: '8px 12px', borderRadius: 6, background: '#16a34a', color: '#fff', border: 'none' }}>Suggest Projects</button>
              </div>
            </div>
          </section>
          
        </div>
      </div>
    </div>
  );
};

export default Profile;
