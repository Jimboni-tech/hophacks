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
                <p className="text-xs text-gray-500">Est. Time: {p.estimatedTime}</p>
              )}
              {p.description && (
                <p className="text-sm mt-2 text-gray-700">{p.description}</p>
              )}
              <button className="mt-3 px-3 py-1 bg-blue-600 text-white rounded-lg">
                Apply
              </button>
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

export default ProjectSearch;
