import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import CaseDetailPage from '../pages/CaseDetailPage';
import ProfilePage from '../pages/ProfilePage';
import AddCaseModal from '../components/AddCaseModal';

import TableDemoPage from '../pages/TableDemoPage';

// We'll create a simple routing structure for now
function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/case/:id" element={<CaseDetailPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/table" element={<TableDemoPage />} />
      {/* We can also add a route for a 404 page if needed */}
      <Route path="*" element={<Navigate replace to="/login" />} />
    </Routes>
  );
}

export default AppRouter;