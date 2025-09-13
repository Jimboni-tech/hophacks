import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const Home = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({ projects: null, orgs: null });
    const [isWide, setIsWide] = useState(typeof window !== 'undefined' ? window.innerWidth > 800 : true);

    const fetchProjects = async (q = '') => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${API_URL}/projects`, { params: { q } });
            const data = res.data.data || [];
            setProjects(data);
            // If API returns total (pagination), use it; otherwise fallback to length
            const total = res.data.total ?? data.length;
            setStats(s => ({ ...s, projects: total }));
        } catch (err) {
            setError('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
        // fetch companies count for stats
        axios.get(`${API_URL}/companies`).then(res => {
            const orgs = (res.data && res.data.data) ? res.data.data.length : null;
            setStats(s => ({ ...s, orgs }));
        }).catch(() => {});

        const onResize = () => setIsWide(window.innerWidth > 800);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProjects(search);
    };

    return (
        // This outer div is now only for background and minimum height.
        <div style={{ minHeight: '100vh', padding: '24px 16px', background: 'var(--surface)' }}>
            {/* Stats card: fixed at top-right on wide screens */}
            {isWide && (
                <div style={{ position: 'fixed', top: 96, right: 32, zIndex: 60 }}>
                            <div style={{ minWidth: 200, padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', color: 'var(--text)' }} aria-hidden>
                                <div style={{ fontSize: 16, color: 'var(--accent)', marginBottom: 8, fontWeight: 700 }}>Overview</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <div style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>Projects</div>
                                    <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 16 }}>{stats.projects ?? '—'}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>Organizations</div>
                                    <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 16 }}>{stats.orgs ?? '—'}</div>
                                </div>
                            </div>
                </div>
            )}
            {/* This is the main content container. 
                'margin: 0 auto' is the key to centering it horizontally. */}
            <div style={{
                maxWidth: 760,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
            }}>
                <h1 style={{ fontSize: 28, color: 'var(--text)', textAlign: 'center' }}>Find Projects</h1>

                {/* This form will be full-width relative to the 760px container */}
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <input
                        aria-label="Search projects"
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by title, skill, or org"
                        style={{ flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 15 }}
                    />
                    <button type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>Search</button>
                </form>

                {loading ? (
                    <div style={{ color: 'var(--muted)' }}>Loading projects...</div>
                ) : error ? (
                    <div style={{ color: 'red' }}>{error}</div>
                ) : projects.length === 0 ? (
                    <div style={{ color: 'var(--muted)' }}>No projects found. Try a different search.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(2, 1fr)' : '1fr', gap: 16, width: '100%', justifyItems: 'center' }}>
                        {projects.map(p => (
                            <SimpleProjectCard key={p._id} project={p} isWide={isWide} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


// This component is correct from the previous fix.
function SimpleProjectCard({ project, isWide }) {
    // portrait/tall card
    const cardHeight = 260;
    return (
        <Link
            to={`/projects/${project._id}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%', maxWidth: 360 }}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: cardHeight,
                padding: 16,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                width: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ width: '100%', height: 96, borderRadius: 8, overflow: 'hidden', background: 'var(--accent-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={project.company?.logo || '/vite.svg'} alt={project.company?.name || ''} style={{ maxHeight: '86px', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{project.company?.name || ''} — {project.description}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>{project.duration || ''}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>View</button>
                        <button style={{ background: 'transparent', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Save</button>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default Home;