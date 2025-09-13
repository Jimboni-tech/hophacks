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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((c) => (
            <Link
              to={`/organizations/${c._id}`}
              key={c._id}
              style={{
                display: 'flex',
                gap: 28,
                alignItems: 'center',
                padding: '28px 24px',
                borderRadius: 16,
                textDecoration: 'none',
                color: 'inherit',
                border: '2px solid var(--border)',
                background: 'var(--surface)',
                boxShadow: '0 10px 32px rgba(0,0,0,0.07)'
              }}
            >
              <div style={{ width: 128, height: 128, borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg,var(--accent-100),var(--accent-200))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={c.imageUrl || c.logo || '/vite.svg'} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center' }}>
                  <div style={{ overflow: 'hidden', minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 28, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</h3>
                    {c.summary && <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 18, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.summary}</div>}
                    {/* Only show summary in list view. Description is shown on detail page. */}
                  </div>
                  <div style={{ textAlign: 'right', color: 'var(--muted)', fontSize: 16, whiteSpace: 'nowrap' }}>
                    <div>{(typeof c.projectCount === 'number' ? c.projectCount : (c.projects?.length ?? 0))} projects</div>
                    {c.website ? <div style={{ marginTop: 8 }}><a href={c.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 16 }}>Website</a></div> : null}
                  </div>
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
