import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

function makeApiUrl(path) {
  const base = (API_URL || '').replace(/\/$/, '');
  if (!base) return `/api${path}`;
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
  // Fix: openProfile to support both application and completion request
  async function openProfile(entry) {
    setProfile(null);
    setProfileLoading(true);
    setProfileError('');
    try {
      const token = localStorage.getItem('token');
      if (!entry.userId) {
        setProfile({ fullName: entry.userFullName || 'Applicant' });
        setShowProfile(true);
        return;
      }
      const url = makeApiUrl(`/company/applicant/${entry.userId}`);
      const res = await fetch(url, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Failed to fetch applicant profile');
      const json = await res.json();
      setProfile(json.data || { fullName: entry.userFullName || 'Applicant' });
      setShowProfile(true);
    } catch (err) {
      setProfileError(err.message || 'Failed to load profile');
      setProfile({ fullName: entry.userFullName || 'Applicant' });
      setShowProfile(true);
    } finally {
      setProfileLoading(false);
    }
  }
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
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
        // Fetch regular applications
        const url = makeApiUrl('/company/submissions');
        const res = await window.fetch(url, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        let json;
        try {
          json = res && typeof res.json === 'function' ? await res.json() : null;
        } catch (e) {
          json = null;
        }
        if (!res || !res.ok) throw new Error((json && json.error) || `Request failed with status ${res ? res.status : 'no response'}`);
        setItems((json && json.data) || []);
        // Fetch completion notifications
  const notifRes = await window.fetch(makeApiUrl('/company/completed-notifications'), { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        let notifJson;
        try {
          notifJson = notifRes && typeof notifRes.json === 'function' ? await notifRes.json() : null;
        } catch (e) {
          notifJson = null;
        }
        if (!notifRes || !notifRes.ok) throw new Error((notifJson && notifJson.error) || `Request failed with status ${notifRes ? notifRes.status : 'no response'}`);
  setNotifications((notifJson && notifJson.data) || []);
      } catch (err) {
        setError(err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const acceptCompletion = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const url = makeApiUrl(`/company/completed-notifications/${notificationId}`);
      await axios.patch(url, { action: 'approve', reviewer: 'company' }, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to approve completion');
    }
  };

  const rejectCompletion = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const url = makeApiUrl(`/company/completed-notifications/${notificationId}`);
      await axios.patch(url, { action: 'reject', reviewer: 'company', rejectReason: 'Not a fit' }, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to reject completion');
    }
  };
  // helper to download resume for a profile entry
  const downloadResume = async () => {
    try {
      const token = localStorage.getItem('token');
      const uid = profile?.userId || profile?.user?.userId;
      if (!profile || !uid) return alert('No applicant selected');
      const url = makeApiUrl(`/company/applicant/${uid}/resume`);
      const res = await fetch(url, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) return alert('No resume available');
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error('Failed to download resume', err);
      alert('Failed to download resume');
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
      <h2>Review Notifications</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && items.length === 0 && notifications.length === 0 && <div>No recent applications or completion requests.</div>}
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          {[
            ...items.map(item => ({
              type: 'application',
              id: item.id,
              userFullName: item.user?.fullName || item.userFullName || item.userId || 'Unknown User',
              userId: item.user?.userId || item.userId,
              projectName: item.projectName || item.project?.name,
              projectId: item.projectId || (item.project && item.project._id),
              createdAt: item.createdAt,
              notes: item.notes,
              rejectReason: item.rejectReason
            })),
            ...notifications.map(n => {
              const user = n.user || n.userInfo || {};
              const project = n.project || n.projectInfo || {};
              return ({
                type: 'completion',
                id: n.id,
                userFullName: user.fullName || 'Unknown User',
                userId: n.userId,
                projectName: project.name || project.name,
                projectId: project.id || project._id || n.project,
                createdAt: n.requestedAt,
                notes: '',
                rejectReason: n.rejectReason
              });
            })
          ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(entry => (
          <div key={entry.id} style={{
            padding: 12,
            border: entry.type === 'completion' ? '2px solid #f59e42' : '1px solid var(--border)',
            borderRadius: 8,
            background: entry.type === 'completion' ? '#fff7ed' : 'white',
            marginBottom: 10,
            boxShadow: entry.type === 'completion' ? '0 2px 8px #f59e4222' : '0 1px 4px #0001'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 700 }}>
                {entry.type === 'completion' ? (
                  <>
                    <span style={{ color: 'var(--accent)' }}>{entry.userFullName}</span> <span style={{ fontWeight: 500, color: 'var(--muted)' }}>requested completion for</span> <span>{entry.projectName}</span>
                  </>
                ) : (
                  <>
                    {entry.userFullName} <span style={{ fontWeight: 500, color: 'var(--muted)' }}>applied to</span> <span style={{ color: 'var(--accent)' }}>{entry.projectName}</span>
                  </>
                )}
                {entry.type !== 'completion' && (
                  <div style={{ marginTop: 8, fontWeight: 400, fontSize: 15 }}>
                    <div><strong>Note:</strong> {entry.notes || '—'}</div>
                  </div>
                )}
              </div>
              <div>
                <button onClick={() => openProfile(entry)} style={{ marginRight: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'white' }}>View profile</button>
                {entry.type === 'completion' && (
                  <Link to={`/projects/${entry.projectId}`} style={{ marginRight: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid #f59e42', background: '#fff7ed', color: '#b45309', textDecoration: 'none' }}>View project</Link>
                )}
                {entry.type === 'application' ? (
                  <>
                    <button onClick={() => acceptApplicant(entry.id)} style={{ marginRight: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid #10b981', background: '#ecfdf5', color: '#065f46' }}>Accept</button>
                    <button onClick={() => rejectApplicant(entry.id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ef4444', background: '#fff1f2', color: '#9b2c2c' }}>Reject</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => acceptCompletion(entry.id)} style={{ marginRight: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid #10b981', background: '#ecfdf5', color: '#065f46' }}>Accept</button>
                    <button onClick={() => rejectCompletion(entry.id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ef4444', background: '#fff1f2', color: '#9b2c2c' }}>Reject</button>
                  </>
                )}
              </div>
            </div>
            <div style={{ color: 'var(--muted)', marginTop: 6 }}>{timeAgo(entry.createdAt)}</div>
            {entry.type !== 'completion' && entry.notes && <div style={{ marginTop: 8 }}>{entry.notes}</div>}
            {entry.rejectReason && <div style={{ marginTop: 8, color: '#b91c1c' }}>Rejected: {entry.rejectReason}</div>}
          </div>
        ))}
      </div>

      {showProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowProfile(false)}>
          <div style={{ width: 720, maxWidth: '95%', background: 'var(--surface)', borderRadius: 10, padding: 18 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{profile?.fullName || profile?.userFullName || 'Applicant'}</h3>
              <div>
                <button onClick={() => setShowProfile(false)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'white' }}>Close</button>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div><strong>Email:</strong> {profile?.email || profile?.userEmail || profile?.user?.email || '—'}</div>
              <div style={{ marginTop: 8 }}><strong>Skills:</strong> {(profile?.skills && profile.skills.length) ? profile.skills.join(', ') : ((profile?.userSkills && profile.userSkills.length) ? profile.userSkills.join(', ') : ((profile?.user && profile.user.skills && profile.user.skills.length) ? profile.user.skills.join(', ') : '—'))}</div>
              <div style={{ marginTop: 8 }}>
                <strong>GitHub:</strong> {((profile?.github && profile.github.login) ? <a href={profile.github.profileUrl} target="_blank" rel="noreferrer">{profile.github.login}</a> : ((profile?.userGithub && profile.userGithub.login) ? <a href={profile.userGithub.profileUrl} target="_blank" rel="noreferrer">{profile.userGithub.login}</a> : ((profile?.user && profile.user.github && profile.user.github.login) ? <a href={profile.user.github.profileUrl} target="_blank" rel="noreferrer">{profile.user.github.login}</a> : '—')))}
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
