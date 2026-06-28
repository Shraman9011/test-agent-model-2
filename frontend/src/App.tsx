import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PostLoginRedirect } from './components/PostLoginRedirect';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Root redirect handles routing after login based on role */}
          <Route path="/" element={<PostLoginRedirect />} />
          
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Authenticated Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            {/* Employee routes */}
            <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
              <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
            </Route>

            {/* Manager routes */}
            <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
              <Route path="/dashboard/manager" element={<ManagerDashboard />} />
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={['HR_ADMIN']} />}>
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
