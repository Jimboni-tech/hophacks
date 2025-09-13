import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const OrganizationDetail = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/companies/${id}`);
        if (!res.ok) throw new Error('Failed to load company');
        const json = await res.json();
        setCompany(json.company);
      } catch (err) {
        setError(err.message || 'Error');
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) return <div style={{ padding: 24, marginTop: 80 }}>Loading organization…</div>;
  if (error) return <div style={{ padding: 24, marginTop: 80, color: 'red' }}>{error}</div>;
  if (!company) return <div style={{ padding: 24, marginTop: 80 }}>Organization not found.</div>;

  return (
    <div style={{ maxWidth: 900, margin: '80px auto', padding: 24 }}>
      <h2>{company.name}</h2>
      {company.description && <p style={{ color: 'var(--muted)' }}>{company.description}</p>}

      <h3 style={{ marginTop: 24 }}>Projects</h3>
      {company.projects && company.projects.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {company.projects.map((p) => (
            <li key={p._id} style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
              <Link to={`/projects/${p._id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontSize: 16 }}>{p.name}</Link>
              {p.description && <div style={{ color: 'var(--muted)', marginTop: 6 }}>{p.description}</div>}
            </li>
          ))}
        </ul>
      ) : (
        <p>No projects listed for this organization.</p>
      )}
    </div>
  );
};

export default OrganizationDetail;
