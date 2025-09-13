import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterCompany from './pages/RegisterCompany';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Navbar from './components/Navbar';
import Organizations from './pages/Organizations';
import Stats from './pages/Stats';
import Recent from './pages/Recent';
import Profile from './pages/Profile';
import ProjectInformation from './pages/ProjectInformation';
import OrganizationDetail from './pages/OrganizationDetail';
import ProfileSetup from './pages/ProfileSetup';
import GithubCallback from './pages/GithubCallback';
import ProtectedRoute from './components/ProtectedRoute';
import Recommendations from './pages/Recommendations';
import PostProject from './pages/company/PostProject';
import CompanyLogin from './pages/company/CompanyLogin';
import ManageProjects from './pages/company/ManageProjects';
import ReviewApplicants from './pages/company/ReviewApplicants';
import CompanyProfile from './pages/company/CompanyProfile';
import CurrentProject from './pages/CurrentProject';
import Confirm from './pages/Confirm';

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
          <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
          <Route path="/recent" element={<ProtectedRoute><Recent /></ProtectedRoute>} />
          <Route path="/current/:id" element={<ProtectedRoute><CurrentProject /></ProtectedRoute>} />
          <Route path="/confirm/:id" element={<Confirm />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/setup-profile" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/auth/github/callback" element={<GithubCallback />} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectInformation /></ProtectedRoute>} />

          <Route path="/company/projects/new" element={<ProtectedRoute requireCompany><PostProject /></ProtectedRoute>} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-company" element={<RegisterCompany />} />
          <Route path="/company/login" element={<CompanyLogin />} />
          <Route path="/company/projects" element={<ProtectedRoute requireCompany><ManageProjects /></ProtectedRoute>} />
          <Route path="/company/applicants" element={<ProtectedRoute requireCompany><ReviewApplicants /></ProtectedRoute>} />
          <Route path="/company/profile" element={<ProtectedRoute requireCompany><CompanyProfile /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
