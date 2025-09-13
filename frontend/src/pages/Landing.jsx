import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <main style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text)' }}>
      <section style={{ padding: '48px 20px', maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ fontSize: 36, margin: 0 }}>Volunteer tech help for nonprofits — small tasks, big impact</h1>
          <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 760 }}>Connect volunteers (students & newcomers) with short, mentored software and data tasks that help nonprofits build tools, dashboards, and workflows. Learn while contributing to meaningful projects.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Link to="/register" style={{ background: 'var(--accent)', color: '#fff', padding: '10px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>Get Started — Volunteer</Link>
            <Link to="/register-company" style={{ border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 16px', borderRadius: 8, textDecoration: 'none' }}>Post a Project — Nonprofit</Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }} aria-hidden>
          <div style={{ flex: '1 1 320px', padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700 }}>How it works</div>
            <ol style={{ paddingLeft: 18, marginTop: 8 }}>
              <li>Organizations post small scoped tech tasks.</li>
              <li>Volunteers apply and get matched (mentors available).</li>
              <li>Work is reviewed and merged; impact tracked.</li>
            </ol>
          </div>

          <div style={{ flex: '1 1 200px', padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700 }}>Highlights</div>
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              <li>Skill-based matching</li>
              <li>Mentor feedback</li>
              <li>GitHub + AI integrations</li>
            </ul>
          </div>
        </div>

      </section>

      <section style={{ padding: '24px 20px', background: 'linear-gradient(180deg, rgba(0,0,0,0.02), transparent)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, alignItems: 'start' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>For Volunteers</h2>
            <p style={{ color: 'var(--muted)' }}>Build a portfolio by completing short, real-world projects with guidance. Earn badges and GitHub-linked contributions to show to future employers or college applications.</p>

            <h3>For Nonprofits</h3>
            <p style={{ color: 'var(--muted)' }}>Get scoped help on data cleanup, simple dashboards, automations, and small open-source tasks without long-term hiring commitments.</p>
          </div>

          <aside style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700 }}>Integrations</div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700 }}>GitHub</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Connect to show contributions and submit PRs directly.</div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700 }}>Generative AI (Gemini)</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Use AI to scope projects, create onboarding docs, and provide automated feedback.</div>
            </div>
          </aside>
        </div>
      </section>

      <section style={{ padding: '36px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ marginTop: 0 }}>Featured Projects</h2>
          <p style={{ color: 'var(--muted)' }}>A rotating showcase of short tasks that need volunteers — filtered by skill and time commitment.</p>
          <div style={{ marginTop: 12 }}>
            <Link to="/projects" style={{ textDecoration: 'none', color: 'var(--accent)' }}>Browse projects</Link>
          </div>
        </div>
      </section>

      <footer style={{ padding: '32px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>HopHacks</div>
          <div style={{ color: 'var(--muted)' }}>Made for nonprofits & volunteers • © {new Date().getFullYear()}</div>
        </div>
      </footer>
    </main>
  );
};

export default Landing;
