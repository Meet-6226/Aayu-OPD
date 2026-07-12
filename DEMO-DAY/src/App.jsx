import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StaffLayout from './layouts/StaffLayout';

// Staff Pages
import StaffLogin from './pages/staff/StaffLogin';
import MorningBriefing from './pages/staff/MorningBriefing';
import Appointments from './pages/staff/Appointments';
import PatientDetail from './pages/staff/PatientDetail';
import SlotRecovery from './pages/staff/SlotRecovery';
import DoctorView from './pages/staff/DoctorView';
import AdminDashboard from './pages/staff/AdminDashboard';
import ReminderLog from './pages/staff/ReminderLog';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* ROOT LANDING PAGE */}
        <Route path="/" element={<Navigate to="/staff/login" replace />} />

        {/* STAFF ROUTES */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route
          path="/staff/dashboard"
          element={
            <StaffLayout>
              <MorningBriefing />
            </StaffLayout>
          }
        />
        <Route
          path="/staff/appointments"
          element={
            <StaffLayout>
              <Appointments />
            </StaffLayout>
          }
        />
        <Route
          path="/staff/patient/:id"
          element={
            <StaffLayout>
              <PatientDetail />
            </StaffLayout>
          }
        />
        <Route
          path="/staff/slot-recovery"
          element={
            <StaffLayout>
              <SlotRecovery />
            </StaffLayout>
          }
        />
        <Route
          path="/staff/doctor-view"
          element={
            <StaffLayout>
              <DoctorView />
            </StaffLayout>
          }
        />
        <Route
          path="/staff/admin"
          element={
            <StaffLayout>
              <AdminDashboard />
            </StaffLayout>
          }
        />
        <Route
          path="/staff/reminders"
          element={
            <StaffLayout>
              <ReminderLog />
            </StaffLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/staff/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
