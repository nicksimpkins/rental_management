import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUserType } from './utils/auth';
import LoginPage from './views/Auth/LoginPage';
import LandlordDashboard from './views/Landlord';
import TenantDashboard from './views/Tenant';
import MaintenanceDashboard from './views/Maintenance';

const ProtectedRoute = ({ children, allowedUserTypes }) => {
  const isAuth = isAuthenticated();
  const userType = getUserType();

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (allowedUserTypes && !allowedUserTypes.includes(userType)) {
    switch (userType) {
      case 'Tenant':
        return <Navigate to="/tenant" replace />;
      case 'Landlord':
        return <Navigate to="/landlord" replace />;
      case 'MaintenancePerson':
        return <Navigate to="/maintenance" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route 
          path="/landlord" 
          element={
            <ProtectedRoute allowedUserTypes={['Landlord']}>
              <LandlordDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tenant" 
          element={
            <ProtectedRoute allowedUserTypes={['Tenant']}>
              <TenantDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/maintenance" 
          element={
            <ProtectedRoute allowedUserTypes={['MaintenancePerson']}>
              <MaintenanceDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Root Route */}
        <Route 
          path="/" 
          element={
            isAuthenticated() ? (
              <Navigate to={`/${getUserType()?.toLowerCase() || 'login'}`} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Catch all undefined routes */}
        <Route 
          path="*" 
          element={<Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;