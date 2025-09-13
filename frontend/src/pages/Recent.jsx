import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const Recent = () => {
  const [saved, setSaved] = useState([]);
  const [applied, setApplied] = useState([]);
  const [current, setCurrent] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true);
      setError('');
      try {
        // load persisted current/completed lists from localStorage and normalize ids
        let cur = [];
        let comp = [];
        try {
          cur = (JSON.parse(localStorage.getItem('currentProjects') || '[]') || []).map(it => ({ ...it, _id: String(it._id) }));
          comp = (JSON.parse(localStorage.getItem('completedProjects') || '[]') || []).map(it => ({ ...it, _id: String(it._id) }));
        } catch (e) {
          cur = [];
          comp = [];
        }
        const token = localStorage.getItem('token');
        // listen for profile refresh events (dispatched after confirmations)
        const onUserRefreshed = () => { fetchLists(); };
        window.addEventListener('hophacks:user-refreshed', onUserRefreshed);
        if (!token) {
          setSaved([]);
          setApplied([]);
          setCurrent(cur);
          setCompleted(comp);
          setLoading(false);
          return;
        }
        // Fetch saved projects (interested) and applied submissions (with status)
        const profileRes = await axios.get(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        const user = profileRes.data;

        // fetch saved projects by id
        const fetchProject = async (id) => {
          try {
            const res = await axios.get(`${API_URL}/projects/${id}`);
            return res.data;
          } catch (e) {
            return null;
          }
        };

        const savedProjects = await Promise.all((user.interestedProjects || []).map(fetchProject));
        setSaved(savedProjects.filter(Boolean));

        // prefer server-side currentProjects if available (keeps devices in sync)
        if (Array.isArray(user.currentProjects) && user.currentProjects.length > 0) {
          cur = user.currentProjects.map(c => ({ _id: String(c.projectId), submissionId: c.submissionId || null, movedAt: c.movedAt, completionRequested: c.completionRequested || false, completionRequestedAt: c.completionRequestedAt || null }));
        }
        // prefer server-side completedProjects if available so Recent shows canonical completed items
        if (Array.isArray(user.completedProjects) && user.completedProjects.length > 0) {
          // completedProjects on the server is an array of project ObjectIds; normalize to string ids
          comp = user.completedProjects.map(p => ({ _id: String(p) }));
        }

        // fetch user submissions which include status and project details
        const subsRes = await axios.get(`${API_URL}/user/submissions`, { headers: { Authorization: `Bearer ${token}` } });
        const submissions = subsRes.data.data || [];
        // map to applied list where each item contains project info and status
        const appliedList = submissions.map(s => ({
          _id: s.projectId,
          name: s.projectName,
          description: s.projectDescription,
          status: s.status,
          submissionId: s.id,
          createdAt: s.createdAt
        }));
        // Enrich persisted current/completed entries with up-to-date project/submission info
        const enrichItems = async (items) => {
          return Promise.all(items.map(async (it) => {
            // if we already have a submissionId or name, keep it, otherwise try to find from submissions
            const matched = submissions.find(s => s.projectId === it._id || String(s.projectId) === String(it._id));
            if (matched) {
              return {
                _id: String(matched.projectId),
                name: matched.projectName,
                description: matched.projectDescription,
                status: matched.status,
                submissionId: matched.id,
                movedAt: it.movedAt || it.movedAt,
                completionRequested: it.completionRequested || false,
                completionRequestedAt: it.completionRequestedAt || null,
              };
            }
            // fallback: fetch project details
            try {
              const proj = await fetchProject(it._id);
              if (proj) return { _id: String(proj._id), name: proj.name, description: proj.description || '', movedAt: it.movedAt, completionRequested: it.completionRequested || false, completionRequestedAt: it.completionRequestedAt || null };
            } catch (e) {
              // ignore
            }
            return it;
          }));
        };

  const currentEnriched = await enrichItems(cur);
        const completedEnriched = await enrichItems(comp);

        // remove applied items that are already in current or completed (by project id)
        const currentIds = currentEnriched.map(p => p._id);
        const completedIds = completedEnriched.map(p => p._id);
        const filtered = appliedList.filter(a => !currentIds.includes(a._id) && !completedIds.includes(a._id));
  setApplied(filtered.filter(Boolean));
  setCurrent(currentEnriched);
  setCompleted(completedEnriched);
  try { localStorage.setItem('currentProjects', JSON.stringify(currentEnriched)); } catch (e) {}
  try { localStorage.setItem('completedProjects', JSON.stringify(completedEnriched)); } catch (e) {}
      } catch (err) {
        setError('Failed to load recent lists');
      } finally {
        setLoading(false);
      }
    };
    fetchLists();
  }, []);

  // persist current/completed when they change
  useEffect(() => {
    try {
      localStorage.setItem('currentProjects', JSON.stringify(current));
      localStorage.setItem('completedProjects', JSON.stringify(completed));
    } catch (e) {}
  }, [current, completed]);

  // move an applied project into current (client-side only)
  const moveToCurrent = (project) => {
    (async () => {
      const token = localStorage.getItem('token');
      if (!token) return alert('Please sign in to move projects to current');
      try {
        const res = await axios.post(`${API_URL}/user/current/${project._id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data && res.data.success) {
          // update local state from returned lists
          const cur = (res.data.currentProjects || []).map(c => ({ ...c, _id: String(c.projectId), submissionId: c.submissionId }));
          const appliedUpdated = (res.data.appliedProjects || []).map(a => String(a));
          // fetch project details for current items to enrich display
          const enriched = await Promise.all(cur.map(async (c) => {
            try {
              const p = await axios.get(`${API_URL}/projects/${c._id}`);
              return { _id: c._id, name: p.data.name, description: p.data.description || '', submissionId: c.submissionId, movedAt: c.movedAt, completionRequested: c.completionRequested };
            } catch (e) {
              return c;
            }
          }));
          setCurrent(enriched);
          try { localStorage.setItem('currentProjects', JSON.stringify(enriched)); } catch (e) {}
          // keep only the items that remain applied on the server
          setApplied(prev => prev.filter(a => appliedUpdated.includes(String(a._id))));
        } else {
          alert('Failed to move project to current');
        }
      } catch (err) {
        console.error('Failed to move to current', err);
        alert('Failed to move project to current');
      }
    })();
  };

  // mark a current project as complete (client-side placeholder)
  const completeProject = async (project) => {
    // call backend to request completion verification
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please sign in to request completion');
        return;
      }
      const res = await axios.post(`${API_URL}/submissions/${project.submissionId}/complete-request`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.success) {
        // mark as requested in the UI but do not remove from current/completed — company will verify later
        const now = new Date().toISOString();
        setCurrent(prev => {
          const next = prev.map(p => p._id === project._id ? { ...p, completionRequested: true, completionRequestedAt: now } : p);
          try { localStorage.setItem('currentProjects', JSON.stringify(next)); } catch (e) {}
          return next;
        });
        setCompleted(prev => {
          const next = prev.map(p => p._id === project._id ? { ...p, completionRequested: true, completionRequestedAt: now } : p);
          try { localStorage.setItem('completedProjects', JSON.stringify(next)); } catch (e) {}
          return next;
        });
      } else {
        alert('Failed to request completion');
      }
    } catch (err) {
      console.error('Completion request failed', err);
      alert('Failed to request completion');
    }
  };

  if (loading) return <div style={{maxWidth: 600, margin: '80px auto', padding: 24}}>Loading...</div>;

  const tabStyle = {
    display: 'inline-block',
    padding: '10px 20px',
    cursor: 'pointer',
    borderRadius: 6,
    margin: '0 8px',
    fontWeight: 600,
    fontSize: 16
  };

  return (
    <div style={{maxWidth: 800, margin: '40px auto', padding: 24}}>
      {error && <div style={{color: 'red'}}>{error}</div>}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ display: 'inline-block', background: 'transparent', padding: 6, borderRadius: 8 }}>
          <div
            role="tablist"
            aria-label="Recent tabs"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <div
              role="tab"
              aria-selected={activeTab === 'current'}
              onClick={() => setActiveTab('current')}
              style={{
                ...tabStyle,
                background: activeTab === 'current' ? '#2dce24ff' : 'transparent',
                color: activeTab === 'current' ? '#fff' : '#0f172a',
              }}
            >
              In Progress
            </div>
            <div
              role="tab"
              aria-selected={activeTab === 'applied'}
              onClick={() => setActiveTab('applied')}
              style={{
                ...tabStyle,
                background: activeTab === 'applied' ? '#2dce24ff' : 'transparent',
                color: activeTab === 'applied' ? '#fff' : '#0f172a',
              }}
            >
              Applied
            </div>
            <div
              role="tab"
              aria-selected={activeTab === 'saved'}
              onClick={() => setActiveTab('saved')}
              style={{
                ...tabStyle,
                background: activeTab === 'saved' ? '#2dce24ff' : 'transparent',
                color: activeTab === 'saved' ? '#fff' : '#0f172a',
              }}
            >
              Saved For Later
            </div>
            <div
              role="tab"
              aria-selected={activeTab === 'completed'}
              onClick={() => setActiveTab('completed')}
              style={{
                ...tabStyle,
                background: activeTab === 'completed' ? '#2dce24ff' : 'transparent',
                color: activeTab === 'completed' ? '#fff' : '#0f172a',
              }}
            >
              Completed
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'current' && (
        <section style={{marginTop: 20}}>
          <h3>In Progress</h3>
          <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginTop: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.04)'}}>
            {current.length === 0 ? (
              <div style={{color: 'var(--muted)'}}>No current projects.</div>
            ) : (
              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                {current.map(p => (
                  <li key={p._id} style={{marginBottom: 18}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f6fff8', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'}}>
                      <div style={{flex: 1, paddingRight: 12}}>
                        <Link to={`/current/${p._id}`} style={{fontWeight: 600, color: 'var(--accent)', textDecoration: 'none'}}>{p.name}</Link>
                        <div style={{fontSize: 13, color: '#666'}}>{(p.description || '').slice(0, 160)}{p.description && p.description.length > 160 ? '…' : ''}</div>
                      </div>
                      <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                        {p.completionRequested ? (
                          <div style={{background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b', padding: '6px 10px', borderRadius: 8, fontWeight: 700}}>Completion requested</div>
                        ) : (
                          <button onClick={() => completeProject(p)} style={{padding: '8px 10px', borderRadius: 6}}>Complete</button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {activeTab === 'applied' && (
        <section style={{marginTop: 20}}>
          <h3>Applied</h3>
          <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginTop: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.04)'}}>
            {applied.length === 0 ? (
              <div style={{color: 'var(--muted)'}}>No applied projects.</div>
            ) : (
              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                {applied.map(p => (
                  <li key={p._id} style={{marginBottom: 18}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f6fff8', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'}}>
                      <div style={{flex: 1, paddingRight: 12}}>
                        <Link to={`/projects/${p._id}`} style={{fontWeight: 600, color: 'var(--accent)', textDecoration: 'none'}}>{p.name}</Link>
                        <div style={{fontSize: 13, color: '#666'}}>{(p.description || '').slice(0, 160)}{p.description && p.description.length > 160 ? '…' : ''}</div>
                      </div>
                      <div style={{marginLeft: 12, minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}><StatusBadge status={p.status} /></div>
                      </div>
                      <div style={{marginLeft: 12}}>
                        {p.status === 'approved' && <button onClick={() => moveToCurrent(p)} style={{padding: '8px 10px', borderRadius: 6}}>Move to In Progress</button>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {activeTab === 'saved' && (
        <section style={{marginTop: 30}}>
          <h3>Saved For Later</h3>
          <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginTop: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.04)'}}>
            {saved.length === 0 ? (
              <div style={{color: 'var(--muted)'}}>No saved projects.</div>
            ) : (
              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                {saved.map(p => (
                  <li key={p._id} style={{marginBottom: 18}}>
                    <div style={{background: '#f6fff8', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'}}>
                      <Link to={`/projects/${p._id}`} style={{fontWeight: 600, color: 'var(--accent)', textDecoration: 'none'}}>{p.name}</Link>
                      <div style={{fontSize: 13, color: '#666'}}>{p.description?.slice(0, 120)}{p.description && p.description.length > 120 ? '…' : ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {activeTab === 'completed' && (
        <section style={{marginTop: 30}}>
          <h3>Completed</h3>
          <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginTop: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.04)'}}>
            {completed.length === 0 ? (
              <div style={{color: 'var(--muted)'}}>No completed projects.</div>
            ) : (
              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                {completed.map(p => (
                  <li key={p._id} style={{marginBottom: 18}}>
                    <div style={{background: '#f6fff8', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'}}>
                      <Link to={`/projects/${p._id}`} style={{fontWeight: 600, color: 'var(--accent)', textDecoration: 'none'}}>{p.name}</Link>
                      <div style={{fontSize: 13, color: '#666'}}>{p.description?.slice(0, 120)}{p.description && p.description.length > 120 ? '…' : ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
};


export default Recent;

function StatusBadge({ status }) {
  const label = status === 'pending' ? 'Application received' : status === 'approved' ? 'Accepted' : 'Denied';
  const bg = status === 'pending' ? '#f3f4f6' : status === 'approved' ? '#ecfdf5' : '#fff1f2';
  const color = status === 'pending' ? '#374151' : status === 'approved' ? '#065f46' : '#9b2c2c';
  const border = status === 'pending' ? '1px solid #d1d5db' : status === 'approved' ? '1px solid #10b981' : '1px solid #ef4444';
  return (
    <div style={{ background: bg, color, border, padding: '8px 12px', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>{label}</div>
  );
}
