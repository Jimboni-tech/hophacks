import "./App.css";
import ProjectSearch, { Leaderboard } from "./components/ProjectSearch.jsx";
import AdminReview from "./components/AdminReview.jsx";
import { Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <nav className="p-4 border-b mb-4 flex gap-4">
        <Link className="text-blue-700 underline" to="/">Home</Link>
        <Link className="text-blue-700 underline" to="/admin">Admin Review</Link>
      </nav>
      <Routes>
        <Route path="/" element={<>
          <ProjectSearch />
          <Leaderboard />
        </>} />
        <Route path="/admin" element={<AdminReview />} />
      </Routes>
    </div>
  );
}

export default App;
