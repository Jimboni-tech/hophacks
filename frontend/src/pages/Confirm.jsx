import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function Confirm() {
  const { id } = useParams(); // this is submission id
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const sres = await axios.get(`${API_URL}/submissions/${id}`);
        const sub = sres.data;
        if (!sub) {
          setError('Submission not found');
          setLoading(false);
          return;
        }
        if (!mounted) return;
        setSubmission(sub);
      } catch (e) {
        setError('Failed to load submission');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  async function onConfirm() {
    if (!window.confirm('Confirm that this user completed the project? This cannot be undone.')) return;
    setProcessing(true);
    try {
      // use token from query string if present (public link), otherwise try company auth
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        // public confirm via token
        const res = await axios.post(`${API_URL}/submissions/${id}/confirm`, { token });
      } else {
        const authToken = localStorage.getItem('token');
        if (!authToken) return alert('Please login as a company to confirm');
        const headers = { Authorization: `Bearer ${authToken}` };
        await axios.patch(`${API_URL}/submissions/${id}/verify`, {}, { headers });
      }
      alert('Submission verified and user marked completed.');
      // If a user is logged in, refresh their profile and cached lists so UI reflects the change
      try {
        const authToken = localStorage.getItem('token');
        if (authToken) {
          const profileRes = await axios.get(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${authToken}` } });
          const user = profileRes.data;
          try { localStorage.setItem('user', JSON.stringify(user)); } catch (e) {}
          try {
            const cur = (user.currentProjects || []).map(c => ({ _id: String(c.projectId), submissionId: c.submissionId || null, movedAt: c.movedAt, completionRequested: c.completionRequested || false, completionRequestedAt: c.completionRequestedAt || null }));
            const comp = (user.completedProjects || []).map(p => ({ _id: String(p) }));
            localStorage.setItem('currentProjects', JSON.stringify(cur));
            localStorage.setItem('completedProjects', JSON.stringify(comp));
          } catch (e) {}
          // notify other components to refresh
          try { window.dispatchEvent(new Event('hophacks:user-refreshed')); } catch (e) {}
        }
      } catch (e) {
        // ignore profile refresh failures
      }
      navigate('/company/submissions');
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Failed to verify submission';
      alert(msg);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <div style={{ maxWidth: 800, margin: '40px auto' }}>Loading...</div>;
  if (error) return <div style={{ color: 'red', maxWidth: 800, margin: '40px auto' }}>{error}</div>;
  if (!submission) return <div style={{ maxWidth: 800, margin: '40px auto' }}>Not found</div>;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20, textAlign: 'center' }}>
      <h2>Confirm Submission</h2>
      <p style={{ color: '#374151' }}>Do you confirm that this user has completed the project?</p>
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button onClick={onConfirm} disabled={processing} style={{ padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6 }}>
          {processing ? 'Processing...' : 'Confirm'}
        </button>
        <button onClick={async () => {
          if (!window.confirm('Reject this submission? This will mark it rejected.')) return;
          try {
            const authToken = localStorage.getItem('token');
            if (!authToken) return alert('Please login as a company to reject');
            const headers = { Authorization: `Bearer ${authToken}` };
            const reason = window.prompt('Optional reject reason:', 'Does not meet requirements') || 'Rejected by organization';
            await axios.patch(`${API_URL}/submissions/${id}`, { action: 'reject', rejectReason: reason }, { headers });
            alert('Submission rejected');
            window.location.href = '/company/submissions';
          } catch (e) {
            alert(e?.response?.data?.error || e.message || 'Failed to reject');
          }
        }} style={{ padding: '10px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6 }}>Deny</button>
      </div>
    </div>
  );
}
