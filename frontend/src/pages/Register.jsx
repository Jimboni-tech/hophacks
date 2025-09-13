import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const userId = uuidv4();
            const payload = {
                userId,
                email,
                password,
                fullName,
                skills: []
            };
            const response = await axios.post(`${API_URL}/register`, payload);
            if (response.data && response.data.token) {
                setSuccess('Registration successful!');
                setEmail('');
                setPassword('');
                setFullName('');
                window.dispatchEvent(new Event('userChanged'));
            } else {
                setError(response.data.error || 'Registration failed');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 420, background: 'var(--surface)', border: '1px solid var(--border)', padding: 28, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                <h2 style={{ margin: 0, marginBottom: 14, color: 'var(--text)', fontSize: 22, textAlign: 'center' }}>Create an Account</h2>
                <p style={{ marginTop: 0, marginBottom: 18, color: 'var(--muted)', textAlign: 'center' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label style={{ fontSize: 13, color: 'var(--muted)' }}>Full Name</label>
                    <input
                        aria-label="Full name"
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 15 }}
                    />

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
                    {success && <div style={{ color: 'green', fontSize: 14 }}>{success}</div>}

                    <button type="submit" style={{ marginTop: 6, background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Create account</button>
                </form>

            </div>
        </div>
    );
};

export default Register;
