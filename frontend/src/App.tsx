import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { Navbar } from './components/Navbar.js';

import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { Dashboard } from './pages/Dashboard.js';
import { Onboarding } from './pages/Onboarding.js';
import { Accounts } from './pages/Accounts.js';
import { AccountLedger } from './pages/AccountLedger.js';

import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { AdminUsers } from './pages/admin/AdminUsers.js';
import { AdminOnboarding } from './pages/admin/AdminOnboarding.js';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs.js';
import { AdminAccounts } from './pages/admin/AdminAccounts.js';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:id/ledger" element={<AccountLedger />} />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/onboarding" element={<AdminOnboarding />} />
            <Route path="/admin/audit" element={<AdminAuditLogs />} />
            <Route path="/admin/accounts" element={<AdminAccounts />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<AppLayout />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

