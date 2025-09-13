import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const Register = () => {
    console.log('VITE_API_URL:', API_URL);
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
            } else {
                setError(response.data.error || 'Registration failed');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
    <div style={{maxWidth: 400, margin: '40px auto', padding: 20, background: '#fff', color: '#000', border: '2px solid #000', zIndex: 9999, position: 'relative'}}>
            <div style={{marginBottom: 16, fontWeight: 'bold', color: 'red'}}>Register Page Rendered</div>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Full Name:</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                    />
                </div>
                <div style={{marginTop: 10}}>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div style={{marginTop: 10}}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <div style={{color: 'red', marginTop: 8}}>{error}</div>}
                {success && <div style={{color: 'green', marginTop: 8}}>{success}</div>}
                <button type="submit" style={{marginTop: 16}}>Register</button>
            </form>
        </div>
    );
};

export default Register;
