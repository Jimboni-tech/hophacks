
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password });
            localStorage.setItem('token', res.data.token);
            // Fetch user profile
            const profileRes = await axios.get(`${API_URL}/user/profile`, {
                headers: { Authorization: `Bearer ${res.data.token}` }
            });
            localStorage.setItem('user', JSON.stringify(profileRes.data));
            window.dispatchEvent(new Event('userChanged'));
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--surface)' }}>
            <div style={{ width: '100%', maxWidth: 420, padding: 28, borderRadius: 12, background: 'white', border: '1px solid var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                <h2 style={{ margin: 0, marginBottom: 12, color: 'var(--text)', fontSize: 22 }}>Welcome back</h2>
                <p style={{ marginTop: 0, marginBottom: 18, color: 'var(--muted)' }}>Sign in to continue to Hophacks</p>

                <form onSubmit={handleSubmit}>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 12 }}
                        aria-label="Email"
                    />

                    <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 12 }}
                        aria-label="Password"
                    />

                    {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: loading ? 'default' : 'pointer' }}>
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                        <button type="button" onClick={() => navigate('/register')} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;


