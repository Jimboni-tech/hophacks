import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <main style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text)', background: 'var(--bg)' }}>
      {/* Sticky Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '100%',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>Commit 4 Good</div>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Volunteer Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Link to="/login" style={{ textDecoration: 'none', color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Log In
              </Link>
              <Link to="/register" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', padding: '8px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Sign Up
              </Link>
            </div>
            
            {/* Divider */}
            <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>

            {/* Company Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Link to="/company/login" style={{ textDecoration: 'none', color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Organization Login
              </Link>
              <Link to="/register-company" style={{ background: 'var(--accent)', color: '#fff', padding: '8px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Post a Task
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '64px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', alignItems: 'center' }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, maxWidth: 750 }}>
            Commit Code, Create Impact <br />One Project at a Time.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 680, lineHeight: 1.6 }}>
            Connect with organizations for short but impactful GitHub projects. Build your developer portfolio with verified contributions while helping great causes move their ideas forward.
          </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Link to="/home" style={{ background: 'var(--accent)', color: '#fff', padding: '12px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
              Find a Project
            </Link>
            <Link to="/register-company" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', padding: '12px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
              Post a Task
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works & Features */}
      <section style={{ padding: '0 20px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={{ padding: '20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <h3 style={{ marginTop: 0, fontSize: 16 }}>How It Works</h3>
            <ol style={{ paddingLeft: 20, margin: 0, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Organizations post short, well-defined GitHub-based tasks.</li>
              <li>Volunteers browse, apply, and complete work via a fork & pull request.</li>
              <li>Organizations verify the PR, automatically tracking the volunteer's impact.</li>
            </ol>
          </div>

          <div style={{ padding: '20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <h3 style={{ marginTop: 0, fontSize: 16 }}>Verifiable Impact</h3>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              All completed tasks are verified by the organization, building an auditable record of your contributions, volunteer hours, and skills—perfect for your resume.
            </p>
          </div>

          <div style={{ padding: '20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <h3 style={{ marginTop: 0, fontSize: 16 }}>Developer-Focused UX</h3>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Get clear instructions and context for every task. Secure, server-enforced repo visibility ensures you only see what you need, when you need it.
            </p>
          </div>
        </div>
      </section>
      
      {/* Dual Audience Benefits Section */}
      <section style={{ padding: '48px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>For Volunteers</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              Stop searching for your first open-source contribution. Find curated, bite-sized tasks that match your skills. Gain real-world experience, track your progress with a personal stats page and contribution heatmap, and make a tangible difference.
            </p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Build a portfolio of verified work.</li>
                <li>Contribute to meaningful projects in minutes, not days.</li>
                <li>Receive clear, actionable instructions for every task.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ marginTop: 0 }}>For Organizations</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              Scale your volunteer program without the administrative overhead. Post an unlimited number of small tasks, review applicants, and verify contributions with a simple, secure workflow. Stop tracking progress in spreadsheets and start shipping code.
            </p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Lower the barrier for new contributors.</li>
                <li>Automate verification with email notifications and token links.</li>
                <li>Manage applicants and protect repository visibility with ease.</li>
            </ul>
          </div>
        </div>
      </section>
      

      {/* Footer */}
      <footer style={{ padding: '32px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Commit 4 Good</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>
            Connecting developers with impactful work • © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;