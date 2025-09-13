import { useEffect, useMemo, useState } from 'react';

export default function AdminReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [projectId, setProjectId] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('status', 'pending');
      params.set('page', String(page));
      params.set('limit', String(10));
      if (projectId.trim()) params.set('projectId', projectId.trim());
      const res = await fetch(`/api/submissions?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setRows(body?.data ?? []);
      setTotal(body?.total ?? 0);
      setTotalPages(body?.totalPages ?? 1);
    } catch (e) {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const hasRows = useMemo(() => rows.length > 0, [rows]);

  async function review(id, action) {
    try {
      const body = { action, reviewer: 'admin' };
      if (action === 'reject') body.rejectReason = 'Not a valid submission';
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Refresh current page after action
      await load();
    } catch (e) {
      alert('Failed to update submission');
    }
  }

  function onFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Review Queue</h1>

      <form onSubmit={onFilterSubmit} className="flex gap-2 mb-4">
        <input
          className="border rounded p-2 flex-1"
          placeholder="Filter by Project ID (optional)"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        />
        <button className="px-3 py-2 bg-gray-800 text-white rounded" type="submit">
          Apply Filters
        </button>
        <button
          className="px-3 py-2 border rounded"
          type="button"
          onClick={() => { setProjectId(''); setPage(1); load(); }}
        >
          Reset
        </button>
      </form>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="text-sm text-gray-600 mb-2">{total} pending submission{total === 1 ? '' : 's'}</div>
          <ul className="space-y-3">
            {hasRows ? rows.map((s) => (
              <li key={s._id} className="p-4 border rounded-lg shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-semibold">{s.project?.name || 'Project'}</div>
                    <div className="text-sm text-gray-700">User: <span className="font-mono">{s.userId}</span></div>
                    {s.notes && <div className="text-sm text-gray-700">Notes: {s.notes}</div>}
                    <a className="text-blue-600 underline break-all" href={s.submissionUrl} target="_blank" rel="noreferrer">{s.submissionUrl}</a>
                    <div className="text-xs text-gray-500 mt-1">Submitted at {new Date(s.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => review(s._id, 'approve')}>Approve</button>
                    <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => review(s._id, 'reject')}>Reject</button>
                  </div>
                </div>
              </li>
            )) : (
              <p className="text-gray-500">No pending submissions.</p>
            )}
          </ul>

          {totalPages > 1 && (
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
        </>
      )}
    </div>
  );
}
