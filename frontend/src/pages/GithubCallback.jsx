import React, { useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

const GithubCallback = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const token = localStorage.getItem('token');
    if (!code) {
      // nothing to do
      return;
    }
    // forward to backend callback endpoint so server can exchange code securely
    const backendBase = API_URL.replace(/\/api\/?$/i, '') || window.location.origin;
    const forwardUrl = `${backendBase}/api/auth/github/callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ''}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
    // navigate the browser to backend to finish the OAuth flow
    window.location.href = forwardUrl;
  }, []);

  return (
    <div style={{ padding: 24, marginTop: 80 }}>Connecting GitHub… If you are not redirected, please <a href="#" onClick={() => window.location.reload()}>reload</a>.</div>
  );
};

export default GithubCallback;
