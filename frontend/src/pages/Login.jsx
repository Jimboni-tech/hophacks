
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
                const res = await axios.post(`${API_URL}/login`, { email, password });
                localStorage.setItem('token', res.data.token);
                // Fetch user profile
                const profileRes = await axios.get(`${API_URL}/user/profile`, {
                    headers: { Authorization: `Bearer ${res.data.token}` }
                });
                localStorage.setItem('user', JSON.stringify(profileRes.data));
                // notify other components that user changed
                window.dispatchEvent(new Event('userChanged'));
                navigate('/home');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 420, background: 'var(--surface)', border: '1px solid var(--border)', padding: 28, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                <h2 style={{ margin: 0, marginBottom: 14, color: 'var(--text)', fontSize: 22, textAlign: 'center' }}>Log In</h2>
                <p style={{ marginTop: 0, marginBottom: 18, color: 'var(--muted)', textAlign: 'center' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign up</Link>
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label style={{ fontSize: 13, color: 'var(--muted)' }}>Email</label>
                    <input
                        aria-label="Email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 15 }}
                    />

                    

                    <label style={{ fontSize: 13, color: 'var(--muted)' }}>Password</label>
                    <input
                        aria-label="Password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 15 }}
                    />

                    {error && <div style={{ color: 'red', fontSize: 14 }}>{error}</div>}

                    <button type="submit" style={{ marginTop: 6, background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Sign in</button>
                </form>

            </div>
        </div>
    );
};

export default Login;


