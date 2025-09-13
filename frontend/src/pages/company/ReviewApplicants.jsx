import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

function makeApiUrl(path) {
  // path should start with '/'
  const base = (API_URL || '').replace(/\/$/, '');
  if (!base) return `/api${path}`;
  // if base already ends with /api, avoid adding another /api
  if (base.endsWith('/api')) return `${base}${path}`;
  return `${base}/api${path}`;
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

const ReviewApplicants = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
  const token = localStorage.getItem('token');
  const url = makeApiUrl('/company/submissions');
  const res = await window.fetch(url, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        // try to parse JSON safely
        let json;
        try {
          json = res && typeof res.json === 'function' ? await res.json() : null;
        } catch (e) {
          json = null;
        }
        if (!res || !res.ok) throw new Error((json && json.error) || `Request failed with status ${res ? res.status : 'no response'}`);
        setItems((json && json.data) || []);
      } catch (err) {
        setError(err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openProfile = async (userId) => {
    try {
      setProfileError('');
      setProfileLoading(true);
      const token = localStorage.getItem('token');
      const url = makeApiUrl(`/company/applicant/${encodeURIComponent(userId)}`);
      const res = await axios.get(url, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      setProfile(res.data.data || null);
      setShowProfile(true);
    } catch (err) {
      setProfileError(err.response?.data?.error || err.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const downloadResume = async () => {
    try {
      if (!profile?.userId) return;
      const token = localStorage.getItem('token');
      const url = makeApiUrl(`/company/applicant/${encodeURIComponent(profile.userId)}/resume`);
      const res = await axios.get(url, { headers: { Authorization: token ? `Bearer ${token}` : '' }, responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cd = res.headers['content-disposition'] || '';
      let filename = 'resume.pdf';
      const m = cd.match(/filename\*?=(?:UTF-8''?)?"?([^";\n]+)/i);
      if (m && m[1]) filename = decodeURIComponent(m[1]);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setProfileError(err.response?.data?.error || err.message || 'Failed to download resume');
    }
  };

  const acceptApplicant = async (submissionId) => {
    try {
      const token = localStorage.getItem('token');
      const url = makeApiUrl(`/submissions/${submissionId}`);
      await axios.patch(url, { action: 'approve', reviewer: 'company' }, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      // remove the item from list so status isn't shown here
      setItems(items.filter(i => i.id !== submissionId));
    } catch (err) {
      console.error('Failed to approve', err);
      setError(err.response?.data?.error || err.message || 'Failed to approve');
    }
  };

  const rejectApplicant = async (submissionId) => {
    try {
      const token = localStorage.getItem('token');
      const url = makeApiUrl(`/submissions/${submissionId}`);
      await axios.patch(url, { action: 'reject', reviewer: 'company', rejectReason: 'Not a fit' }, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      // remove from current list so company does not see status
      setItems(items.filter(i => i.id !== submissionId));
    } catch (err) {
      console.error('Failed to reject', err);
      setError(err.response?.data?.error || err.message || 'Failed to reject');
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '80px auto' }}>
      <h2>Review Applicants</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && items.length === 0 && <div>No recent applications.</div>}
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {items.map(item => (
          <div key={item.id} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 700 }}>{item.userFullName} <span style={{ fontWeight: 500, color: 'var(--muted)' }}>applied to</span> <span style={{ color: 'var(--accent)' }}>{item.projectName}</span></div>
              <div>
                <button onClick={() => openProfile(item.userId)} style={{ marginRight: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'white' }}>View profile</button>
                <button onClick={() => acceptApplicant(item.id)} style={{ marginRight: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid #10b981', background: '#ecfdf5', color: '#065f46' }}>Accept</button>
                <button onClick={() => rejectApplicant(item.id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ef4444', background: '#fff1f2', color: '#9b2c2c' }}>Reject</button>
              </div>
            </div>
            <div style={{ color: 'var(--muted)', marginTop: 6 }}>{timeAgo(item.createdAt)}</div>
            <div style={{ marginTop: 8 }}>{item.notes}</div>
          </div>
        ))}
      </div>

      {showProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowProfile(false)}>
          <div style={{ width: 720, maxWidth: '95%', background: 'var(--surface)', borderRadius: 10, padding: 18 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{profile?.fullName || 'Applicant'}</h3>
              <div>
                <button onClick={() => setShowProfile(false)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'white' }}>Close</button>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div><strong>Email:</strong> {profile?.email || '—'}</div>
              <div style={{ marginTop: 8 }}><strong>Skills:</strong> {profile?.skills?.length ? profile.skills.join(', ') : '—'}</div>
              <div style={{ marginTop: 8 }}>
                <strong>GitHub:</strong> {profile?.github?.login ? <a href={profile.github.profileUrl} target="_blank" rel="noreferrer">{profile.github.login}</a> : '—'}
              </div>
              <div style={{ marginTop: 12 }}>
                {profile?.hasResume ? (
                  <button onClick={downloadResume} style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none' }}>Download resume</button>
                ) : (
                  <div style={{ color: 'var(--muted)' }}>No resume uploaded</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewApplicants;
