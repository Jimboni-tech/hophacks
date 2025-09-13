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

  return (
    <div style={{ maxWidth: 900, margin: '80px auto', padding: 24 }}>
      <h2>Organizations</h2>
      {loading && <p>Loading organizations…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {companies.map((c) => (
            <li key={c._id} style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
              <Link to={`/organizations/${c._id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontSize: 18 }}>
                {c.name}
              </Link>
              {c.description && <div style={{ color: 'var(--muted)', marginTop: 6 }}>{c.description}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Organizations;
