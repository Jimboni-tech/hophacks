import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const OrganizationDetail = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsMeta, setProjectsMeta] = useState({ total: 0 });

  useEffect(() => {
    const fetchCompanyAndProjects = async () => {
      try {
        setLoading(true);
        const base = import.meta.env.VITE_API_URL || '/api';
        const [companyRes, projectsRes] = await Promise.all([
          fetch(`${base}/companies/${id}`),
          fetch(`${base}/companies/${id}/projects?limit=50`),
        ]);

        if (!companyRes.ok) throw new Error('Failed to load company');
        const companyJson = await companyRes.json();
        // backend returns { data: company }
        const companyData = companyJson.data || null;
        setCompany(companyData);

        if (projectsRes && projectsRes.ok) {
          const pj = await projectsRes.json();
          setProjects(pj.data || []);
          setProjectsMeta({ total: pj.total ?? (pj.data ? pj.data.length : 0) });
        }
      } catch (err) {
        setError(err.message || 'Error');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyAndProjects();
  }, [id]);

  if (loading) return <div style={{ padding: 24, marginTop: 80 }}>Loading organization…</div>;
  if (error) return <div style={{ padding: 24, marginTop: 80, color: 'red' }}>{error}</div>;
  if (!company) return <div style={{ padding: 24, marginTop: 80 }}>Organization not found.</div>;

  return (
    <div style={{ maxWidth: 900, margin: '80px auto', padding: 24 }}>
      <h2>{company.name}</h2>
      {company.description && <p style={{ color: 'var(--muted)' }}>{company.description}</p>}

          <h3 style={{ marginTop: 24 }}>Projects <span style={{ color: 'var(--muted)', fontSize: 14 }}>({projectsMeta.total ?? projects.length})</span></h3>
          {projects && projects.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {projects.map((p) => (
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
