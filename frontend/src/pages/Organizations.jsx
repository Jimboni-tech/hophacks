import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Organizations = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/companies`);
        if (!res.ok) throw new Error('Failed to load companies');
        const json = await res.json();
        setCompanies(json.data || []);
      } catch (err) {
        setError(err.message || 'Error');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const [query, setQuery] = useState('');
  const filtered = companies.filter(c => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (c.name || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 16px' }}>
      <div style={{ width: '100%', maxWidth: 1000 }}>
  <h2 style={{ marginTop: 0, textAlign: 'center' }}>Organizations</h2>
        <div style={{ marginBottom: 16 }}>
          <form onSubmit={(e) => { e.preventDefault(); }} style={{ display: 'flex', gap: 8 }}>
            <input
              aria-label="Search organizations"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search organizations by name or description"
              style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
            />
            <button onClick={() => setQuery('')} type="button" style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent' }}>Clear</button>
          </form>
        </div>
      {loading && <p>Loading organizations…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filtered.map((c) => (
            <Link
              to={`/organizations/${c._id}`}
              key={c._id}
              style={{
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                padding: 20,
                borderRadius: 12,
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ width: 140, height: 100, borderRadius: 8, overflow: 'hidden', background: 'var(--accent-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={c.logo || '/vite.svg'} alt={c.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: 20 }}>{c.name}</h3>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{c.location || ''}</div>
                </div>
                {c.description && <p style={{ marginTop: 8, color: 'var(--muted)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{c.description}</p>}
                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{(typeof c.projectCount === 'number' ? c.projectCount : (c.projects?.length ?? 0))} projects</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{c.website ? <a href={c.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Website</a> : null}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Organizations;
