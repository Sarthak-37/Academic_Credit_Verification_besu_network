import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar'; // NEW IMPORT
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Navbar /> {/* NEW NAVBAR PLACEMENT */}
      
      <Routes>
        <Route path="/" element={<Verify />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;