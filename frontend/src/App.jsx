import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Navbar from './components/Navbar';
import Organizations from './pages/About';
import Leaderboard from './pages/Leaderboard';
import Recent from './pages/Recent';
import Profile from './pages/Profile';
import ProjectInformation from './pages/ProjectInformation';
import OrganizationDetail from './pages/OrganizationDetail';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ paddingTop: 60 }}>
        <Routes>
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/" element={<Landing />} />
          <Route path="/organizations" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
          <Route path="/organizations/:id" element={<ProtectedRoute><OrganizationDetail /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/recent" element={<ProtectedRoute><Recent /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectInformation /></ProtectedRoute>} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
