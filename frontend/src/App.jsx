
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';

// ...existing code...

function Home() {
  return (
    <div style={{textAlign: 'center', marginTop: 40}}>
      <h1>Welcome to the App</h1>
      <div style={{marginTop: 24}}>
        <Link to="/login"><button>Login</button></Link>
        <Link to="/register" style={{marginLeft: 16}}><button>Register</button></Link>
      </div>
    </div>
  );
}


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
      <Routes>
        <Route path="/" element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        } />
        <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
