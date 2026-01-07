// App.js - Main routing file for Chef Helper
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import About from './components/About';
import ChefLogin from './components/ChefLogin';
import ChefRegister from './components/ChefRegister';
import ChefForgotPassword from './components/ChefForgotPassword';
import ChefResetPassword from './components/ChefResetPassword';
import ChefDashboard from './components/ChefDashboard';

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<ChefLogin />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<ChefRegister />} />
        <Route path="/forgot-password" element={<ChefForgotPassword />} />
        <Route path="/reset-password/:token" element={<ChefResetPassword />} />

        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <ChefDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;