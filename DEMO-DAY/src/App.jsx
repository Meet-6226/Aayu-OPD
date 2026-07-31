import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StaffLayout from './layouts/StaffLayout';

import PageLoader from './components/ui/PageLoader';

// Staff Pages (Lazy Loaded)
const StaffLogin = React.lazy(() => import('./pages/staff/StaffLogin'));
const MorningBriefing = React.lazy(() => import('./pages/staff/MorningBriefing'));
const Appointments = React.lazy(() => import('./pages/staff/Appointments'));
const PatientDetail = React.lazy(() => import('./pages/staff/PatientDetail'));
const SlotRecovery = React.lazy(() => import('./pages/staff/SlotRecovery'));
const DoctorView = React.lazy(() => import('./pages/staff/DoctorView'));
const AdminDashboard = React.lazy(() => import('./pages/staff/AdminDashboard'));
const ReminderLog = React.lazy(() => import('./pages/staff/ReminderLog'));

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <React.Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ROOT LANDING PAGE */}
          <Route path="/" element={<Navigate to="/staff/login" replace />} />

          {/* STAFF ROUTES */}
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route
            path="/staff/dashboard"
            element={
              <StaffLayout>
                <React.Suspense fallback={<PageLoader fullScreen={false} message="Loading morning briefing..." />}>
                  <MorningBriefing />
                </React.Suspense>
              </StaffLayout>
            }
          />
          <Route
            path="/staff/appointments"
            element={
              <StaffLayout>
                <React.Suspense fallback={<PageLoader fullScreen={false} message="Loading appointments roster..." />}>
                  <Appointments />
                </React.Suspense>
              </StaffLayout>
            }
          />
          <Route
            path="/staff/patient/:id"
            element={
              <StaffLayout>
                <React.Suspense fallback={<PageLoader fullScreen={false} message="Loading clinical chart..." />}>
                  <PatientDetail />
                </React.Suspense>
              </StaffLayout>
            }
          />
          <Route
            path="/staff/slot-recovery"
            element={
              <StaffLayout>
                <React.Suspense fallback={<PageLoader fullScreen={false} message="Synchronizing waitlist..." />}>
                  <SlotRecovery />
                </React.Suspense>
              </StaffLayout>
            }
          />
          <Route
            path="/staff/doctor-view"
            element={
              <StaffLayout>
                <React.Suspense fallback={<PageLoader fullScreen={false} message="Loading doctor dashboard..." />}>
                  <DoctorView />
                </React.Suspense>
              </StaffLayout>
            }
          />
          <Route
            path="/staff/admin"
            element={
              <StaffLayout>
                <React.Suspense fallback={<PageLoader fullScreen={false} message="Loading admin intelligence..." />}>
                  <AdminDashboard />
                </React.Suspense>
              </StaffLayout>
            }
          />
          <Route
            path="/staff/reminders"
            element={
              <StaffLayout>
                <React.Suspense fallback={<PageLoader fullScreen={false} message="Loading communication log..." />}>
                  <ReminderLog />
                </React.Suspense>
              </StaffLayout>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/staff/login" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}
