import React from 'react';
import { useNavigate } from 'react-router-dom';

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    return {};
  }
};

const Profile = () => {
  const user = getUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (!confirm('Log out?')) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{maxWidth: 600, margin: '80px auto', padding: 24}}>
      <h2>Profile</h2>
      <div><strong>Full Name:</strong> {user.fullName || 'N/A'}</div>
      <div><strong>Email:</strong> {user.email || 'N/A'}</div>
      <div style={{marginTop: 20}}>
        <button onClick={handleLogout} style={{background: '#c53030', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none'}}>Log out</button>
      </div>
    </div>
  );
};

export default Profile;
