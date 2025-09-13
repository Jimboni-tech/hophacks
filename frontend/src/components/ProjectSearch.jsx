import { useEffect, useMemo, useState } from "react";

// Small debounce hook
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const ProjectSearch = () => {
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState("newest");

  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    let ignore = false;
    async function fetchProjects() {
      setLoading(true);
      setError("");
      try {
        const q = debouncedQuery?.trim();
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        params.set("page", String(page));
        params.set("limit", String(10));
        params.set("sort", sort);
        const url = `/api/projects?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        const data = body?.data ?? [];
        if (!ignore) {
          setProjects(Array.isArray(data) ? data : []);
          setTotal(body?.total ?? 0);
          setTotalPages(body?.totalPages ?? 1);
        }
      } catch (e) {
        if (!ignore) setError("Failed to load projects");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchProjects();
    return () => {
      ignore = true;
    };
  }, [debouncedQuery, page, sort]);

  const results = useMemo(() => projects, [projects]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Find a Project</h1>

      <input
        type="text"
        placeholder="Search by name, description, or skill..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 border rounded-lg mb-4"
      />

      <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
        <div>
          {total > 0 ? `${total} project${total === 1 ? '' : 's'} found` : 'No results'}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-gray-700">Sort:</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="border rounded p-1"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
            <option value="relevance" disabled={!query.trim()}>Relevance</option>
          </select>
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <ul className="space-y-3">
        {!loading && !error && results.length > 0 ? (
          results.map((p) => (
            <li key={p._id} className="p-4 border rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold">{p.name}</h2>
              {p.company?.name && (
                <p className="text-sm text-gray-600">Organization: {p.company.name}</p>
              )}
              {p.requiredSkills?.length ? (
                <p className="text-xs text-gray-500">Skills: {p.requiredSkills.join(", ")}</p>
              ) : null}
              {p.estimatedTime && (
                <p className="text-xs text-gray-500">Est. Time: {p.estimatedMinutes ? `${Math.floor(p.estimatedMinutes/60)}h ${p.estimatedMinutes%60}m` : p.estimatedTime}{p.volunteerHours ? ` • ${p.volunteerHours} volunteer hours` : ''}</p>
              )}
              {p.description && (
                <p className="text-sm mt-2 text-gray-700">{p.description}</p>
              )}
              <div className="mt-2" style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 96, height: 80, overflow: 'hidden', borderRadius: 8, background: 'var(--accent-200)' }}>
                  <img src={p.imageUrl || p.company?.logo || '/vite.svg'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt={p.name} />
                </div>
                <div style={{ flex: 1 }}>
                  {p.githubUrl && (() => {
                    try {
                      const curStr = localStorage.getItem('currentProjects');
                      if (curStr) {
                        const arr = JSON.parse(curStr || '[]');
                        if (Array.isArray(arr) && arr.some(i => String(i._id) === String(p._id))) {
                          return (
                            <div className="flex gap-3 mt-2 text-sm">
                              <a className="text-blue-600 underline" href={p.githubUrl} target="_blank" rel="noreferrer">Repository</a>
                            </div>
                          );
                        }
                      }
                      const userStr = localStorage.getItem('user');
                      if (userStr) {
                        const user = JSON.parse(userStr);
                        if (user && Array.isArray(user.currentProjects) && user.currentProjects.some(c => String(c.projectId || c._id || c) === String(p._id))) {
                          return (
                            <div className="flex gap-3 mt-2 text-sm">
                              <a className="text-blue-600 underline" href={p.githubUrl} target="_blank" rel="noreferrer">Repository</a>
                            </div>
                          );
                        }
                      }
                    } catch (e) {
                      // ignore parse errors
                    }
                    return null;
                  })()}
                </div>
              </div>
              {p.githubUrl && (() => {
                try {
                  const curStr = localStorage.getItem('currentProjects');
                  if (curStr) {
                    const arr = JSON.parse(curStr || '[]');
                    if (Array.isArray(arr) && arr.some(i => String(i._id) === String(p._id))) {
                      return (
                        <div className="flex gap-3 mt-2 text-sm">
                          <a className="text-blue-600 underline" href={p.githubUrl} target="_blank" rel="noreferrer">Repository</a>
                        </div>
                      );
                    }
                  }
                  const userStr = localStorage.getItem('user');
                  if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user && Array.isArray(user.currentProjects) && user.currentProjects.some(c => String(c.projectId || c._id || c) === String(p._id))) {
                      return (
                        <div className="flex gap-3 mt-2 text-sm">
                          <a className="text-blue-600 underline" href={p.githubUrl} target="_blank" rel="noreferrer">Repository</a>
                        </div>
                      );
                    }
                  }
                } catch (e) {
                  // ignore parse errors
                }
                return null;
              })()}
              <SubmissionForm projectId={p._id} />
            </li>
          ))
        ) : (!loading && !error && (
          <p className="text-gray-500">No projects found.</p>
        ))}
      </ul>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

function SubmissionForm({ projectId }) {
  const [userId, setUserId] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState({ sending: false, success: "", error: "" });

  async function onSubmit(e) {
    e.preventDefault();
    setState({ sending: true, success: "", error: "" });
    try {
      const res = await fetch(`/api/projects/${projectId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, submissionUrl, notes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      setState({ sending: false, success: 'Submitted! Pending review.', error: '' });
      setSubmissionUrl("");
      setNotes("");
    } catch (err) {
      setState({ sending: false, success: '', error: err.message || 'Failed to submit' });
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 border-t pt-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          className="border rounded p-2"
          placeholder="Your userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <input
          className="border rounded p-2"
          placeholder="Submission URL (e.g., drive link)"
          value={submissionUrl}
          onChange={(e) => setSubmissionUrl(e.target.value)}
          required
        />
        <input
          className="border rounded p-2"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
          type="submit"
          disabled={state.sending}
        >
          {state.sending ? 'Submitting...' : 'Work on Task'}
        </button>
        {state.success && <span className="text-green-700 text-sm">{state.success}</span>}
        {state.error && <span className="text-red-600 text-sm">{state.error}</span>}
      </div>
    </form>
  );
}

export function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!ignore) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) setError('Failed to load leaderboard');
      }
    })();
    return () => { ignore = true; };
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-3">Top Contributors</h2>
      {error && <p className="text-red-600">{error}</p>}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.userId} className="flex justify-between border p-2 rounded">
            <span className="font-mono">{r.userId}</span>
            <span className="text-sm text-gray-700">{r.approvedCount} approved</span>
          </li>
        ))}
        {rows.length === 0 && !error && <p className="text-gray-500">No approved submissions yet.</p>}
      </ul>
    </div>
  );
}

export default ProjectSearch;
