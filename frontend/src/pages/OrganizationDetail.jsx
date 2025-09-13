import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    <div style={{ maxWidth: 900, margin: '60px auto', padding: 0 }}>
      <div style={{ padding: '0 36px 0 36px', marginBottom: 18 }}>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
      </div>
      {/* Header section with logo/image and name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, background: 'var(--surface)', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.06)', padding: '32px 36px', border: '1px solid var(--border)', marginBottom: 32 }}>
        <div style={{ width: 110, height: 110, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg,var(--accent-100),var(--accent-200))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src={company.imageUrl || company.logo || '/vite.svg'} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>{company.name}</h2>
          {company.summary && <div style={{ marginTop: 10, fontSize: 17, color: 'var(--muted)', fontWeight: 500 }}>{company.summary}</div>}
        </div>
      </div>

      {/* Description card */}
      {company.description && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '22px 28px', marginBottom: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: 0, marginBottom: 10, fontSize: 20, color: 'var(--accent)', fontWeight: 700 }}>About {company.name}</h3>
          <div style={{ color: 'var(--text)', fontSize: 16, lineHeight: 1.7 }}>{company.description}</div>
        </div>
      )}

      {/* Info bar: stats, website, etc. */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 36, flexWrap: 'wrap', paddingLeft: 8 }}>
        <div style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600 }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 18 }}>{projectsMeta.total ?? projects.length}</span> projects
        </div>
        {company.website && (
          <div style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600 }}>
            <a href={company.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>Visit Website</a>
          </div>
        )}
        {company.credentials && (
          <div style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600 }}>Credentials: <span style={{ color: 'var(--text)', fontWeight: 500 }}>{company.credentials}</span></div>
        )}
      </div>

      {/* Projects grid section */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
        <h3 style={{ margin: 0, marginBottom: 18, fontSize: 22, color: 'var(--accent)', fontWeight: 700 }}>Projects</h3>
        {projects && projects.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 22 }}>
            {projects.map((p) => (
              <div key={p._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <Link to={`/projects/${p._id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 18, fontWeight: 700 }}>{p.name}</Link>
                {p.description && <div style={{ color: 'var(--muted)', marginTop: 8, fontSize: 15 }}>{p.description}</div>}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: 16 }}>No projects listed for this organization.</p>
        )}
      </div>
    </div>
  );
};

export default OrganizationDetail;
