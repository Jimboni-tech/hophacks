
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import About from './pages/About';
import Leaderboard from './pages/Leaderboard';
import Recent from './pages/Recent';
import Profile from './pages/Profile';
import ProjectInformation from './pages/ProjectInformation';

// ...existing code...



function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/register" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ paddingTop: 60 }}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/recent" element={<Recent />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/projects/:id" element={<ProjectInformation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
