import React, { useState } from 'react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;
import { useNavigate } from 'react-router-dom';

export default function Recommendations() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [cooldown, setCooldown] = useState(false);
  const navigate = useNavigate();

  async function fetchRecs() {
    setLoading(true);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 60000);
    try {
      const token = localStorage.getItem('token');
      const rawBase = API_URL || '';
      const base = rawBase.replace(/\/$/, ''); // remove trailing slash
      // handle cases where VITE_API_URL already includes '/api'
      const endpoint = base.endsWith('/api') ? `${base}/recommendations` : `${base}/api/recommendations`;
      const res = await axios.post(`${endpoint}`, { topK: 10 }, { headers: { Authorization: `Bearer ${token}` } });
      setItems(res.data.recommendations || []);
    } catch (e) {
      console.error('Failed to fetch recommendations', e);
      let msg = 'Recommendations failed';
      if (e.response) {
        // server returned a non-JSON error or HTML
        try {
          msg = e.response.data && (e.response.data.error || JSON.stringify(e.response.data));
        } catch (_) {
          msg = e.response.data || e.response.statusText || String(e);
        }
      } else {
        msg = e.message;
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Project Recommendations</h2>
      <p>We use embeddings to find candidate projects and an LLM to explain why they match.</p>
      <div style={{ marginBottom: 12 }}>
        <button onClick={fetchRecs} style={{ background: '#16a34a', color: '#fff', padding: '8px 12px', borderRadius: 6 }} disabled={loading || cooldown}>{loading ? 'Loading…' : 'Suggest Projects'}</button>
        <button onClick={() => navigate('/profile')} style={{ marginLeft: 12 }}>Back to Profile</button>
      </div>
      <div>
        {items.length === 0 && <div>No recommendations yet. Click "Suggest Projects".</div>}
        <ul>
          {items.map((r) => (
            <li key={r.projectId} style={{ marginBottom: 12 }}>
              <strong>{r.name}</strong> — score: {Number(r.score).toFixed(3)}
              <div style={{ color: '#555' }}>{r.explanation}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
