import React, { useState, useEffect } from 'react';

const tabStyle = {
  display: 'inline-block',
  padding: '10px 20px',
  cursor: 'pointer',
  borderRadius: 6,
  margin: '0 8px'
};

const Stats = () => {
  const [active, setActive] = useState('personal');

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ display: 'inline-block', background: 'transparent', padding: 6, borderRadius: 8 }}>
          <div
            role="tablist"
            aria-label="Stats tabs"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <div
              role="tab"
              aria-selected={active === 'personal'}
              onClick={() => setActive('personal')}
              style={{
                ...tabStyle,
                background: active === 'personal' ? '#2dce24ff' : 'transparent',
                color: active === 'personal' ? '#fff' : '#0f172a',
                fontWeight: active === 'personal' ? 600 : 500
              }}
            >
              Personal
            </div>

            <div
              role="tab"
              aria-selected={active === 'global'}
              onClick={() => setActive('global')}
              style={{
                ...tabStyle,
                background: active === 'global' ? '#2dce24ff' : 'transparent',
                color: active === 'global' ? '#fff' : '#0f172a',
                fontWeight: active === 'global' ? 600 : 500
              }}
            >
              Global
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 6px 18px rgba(15,23,42,0.06)' }}>
        {active === 'personal' ? (
          <section aria-label="Personal stats">
            <h2 style={{ marginTop: 0 }}>Your Personal Stats</h2>
            <p>Show user-specific metrics here: contributions, applied projects, matches, etc.</p>
            <PersonalContribs />
          </section>
        ) : (
          <section aria-label="Global stats">
            <h2 style={{ marginTop: 0 }}>Global Stats</h2>
            <p>Show platform-wide metrics: total volunteers, active projects, success rates, etc.</p>
            {/* Placeholder for global stats */}
          </section>
        )}
      </div>
    </div>
  );
};

export default Stats;

function PersonalContribs() {
  const [counts, setCounts] = useState({});
  const [since, setSince] = useState(null);
  const [yearMonth, setYearMonth] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
  });

  // when month changes, load that month's range

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        // compute start/end for yearMonth
        const [y, m] = yearMonth.split('-').map((v) => parseInt(v, 10));
        const start = new Date(Date.UTC(y, m - 1, 1));
        const end = new Date(Date.UTC(y, m, 0)); // last day of month
        const startIso = start.toISOString().slice(0, 10);
        const endIso = end.toISOString().slice(0, 10);
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/stats/contributions?start=${startIso}&end=${endIso}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        if (!res.ok) throw new Error('Failed to load contributions');
        const j = await res.json();
        if (!mounted) return;
        setCounts(j.counts || {});
        setSince(j.since || null);
      } catch (e) {
        // ignore for now
      }
    })();
    return () => { mounted = false; };
  }, [yearMonth]);

  // build array of dates for the selected month laid out in calendar weeks
  const [ySel, mSel] = yearMonth.split('-').map((v) => parseInt(v, 10));
  const monthStart = new Date(ySel, mSel - 1, 1);
  const monthEnd = new Date(ySel, mSel, 0);

  // find first day to show: start of week (Sunday) containing monthStart
  const startCalendar = new Date(monthStart);
  startCalendar.setDate(monthStart.getDate() - monthStart.getDay());

  const dateArray = [];
  for (let d = new Date(startCalendar); d <= monthEnd || d.getDay() !== 0; d.setDate(d.getDate() + 1)) {
    dateArray.push(new Date(d));
  }

  const maxCount = Math.max(0, ...Object.values(counts));
  const getColor = (c) => {
    if (!c) return '#ebedf0';
    const t = Math.min(1, c / Math.max(1, maxCount));
    // interpolate between light green and dark green
    const r1 = 237, g1 = 237, b1 = 240; // #ebedf0
    const r2 = 16, g2 = 185, b2 = 129; // teal green
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  };

  const prevMonth = () => {
    const [y, m] = yearMonth.split('-').map((v) => parseInt(v, 10));
    const d = new Date(y, m - 2, 1);
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const [y, m] = yearMonth.split('-').map((v) => parseInt(v, 10));
    const d = new Date(y, m, 1);
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={prevMonth} style={{ padding: '6px 10px' }}>◀</button>
          <strong>{new Date(ySel, mSel - 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</strong>
          <button onClick={nextMonth} style={{ padding: '6px 10px' }}>▶</button>
        </div>
        <div>
          <label htmlFor="monthSelect" style={{ marginRight: 8 }}>
            Jump to month:
          </label>
          <input
            id="monthSelect"
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)', gap: 10, justifyContent: 'start' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} style={{ fontSize: 13, color: '#374151', textAlign: 'center' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)', gap: 10, marginTop: 12 }}>
        {dateArray.map((d) => {
          const iso = d.toISOString().slice(0, 10);
          const c = counts[iso] || 0;
          const isInMonth = d.getMonth() === (mSel - 1);
          return (
            <div
              key={iso}
              title={`${iso}: ${c} contribution${c !== 1 ? 's' : ''}`}
              style={{
                width: 40,
                height: 40,
                background: isInMonth ? getColor(c) : '#f8fafc',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isInMonth ? (c ? '#00332f' : '#475569') : '#cbd5e1',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              {isInMonth && c > 0 ? c : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
