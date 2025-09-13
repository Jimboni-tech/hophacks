import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/company/submissions', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setItems(json.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '80px auto' }}>
      <h2>Review Applicants</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && items.length === 0 && <div>No recent applications.</div>}
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {items.map(item => (
          <div key={item.id} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontWeight: 700 }}>{item.userFullName} <span style={{ fontWeight: 500, color: 'var(--muted)' }}>applied to</span> <span style={{ color: 'var(--accent)' }}>{item.projectName}</span></div>
            <div style={{ color: 'var(--muted)', marginTop: 6 }}>{timeAgo(item.createdAt)}</div>
            <div style={{ marginTop: 8 }}>{item.notes}</div>
            <div style={{ marginTop: 8 }}>
              <a href={item.submissionUrl} target="_blank" rel="noreferrer">Open submission</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewApplicants;
