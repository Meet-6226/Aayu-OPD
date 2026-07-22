import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Layout
import PatientLayout from './components/PatientLayout';

// Auth Guard & Context
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import PatientLogin from './pages/PatientLogin';
import PatientHome from './pages/PatientHome';
import BrowseDoctors from './pages/BrowseDoctors';
import DoctorProfile from './pages/DoctorProfile';
import BookingConfirmation from './pages/BookingConfirmation';
import MyAppointments from './pages/MyAppointments';
import AppointmentDetail from './pages/AppointmentDetail';
import PatientProfile from './pages/PatientProfile';
import PatientNotifications from './pages/PatientNotifications';
import MyReports from './pages/MyReports';
import SeedDb from './pages/SeedDb';

// Page Transition Wrapper
function AnimatedPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Router content component to allow useLocation hook usage for AnimatePresence
function AnimatedAppRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* No Layout Wrapper Routes */}
        <Route path="/" element={<AnimatedPage><LandingPage /></AnimatedPage>} />
        <Route path="/login" element={<AnimatedPage><PatientLogin /></AnimatedPage>} />
        <Route path="/seed" element={<AnimatedPage><SeedDb /></AnimatedPage>} />

        {/* Patient Layout Wrapper Routes */}
        <Route element={<ProtectedRoute><PatientLayout /></ProtectedRoute>}>
          <Route path="/home" element={<AnimatedPage><PatientHome /></AnimatedPage>} />

          <Route path="/doctors" element={<AnimatedPage><BrowseDoctors /></AnimatedPage>} />
          <Route path="/doctor/:id" element={<AnimatedPage><DoctorProfile /></AnimatedPage>} />
          <Route path="/booking/confirm" element={<AnimatedPage><BookingConfirmation /></AnimatedPage>} />
          <Route path="/appointments" element={<AnimatedPage><MyAppointments /></AnimatedPage>} />
          <Route path="/appointment/:id" element={<AnimatedPage><AppointmentDetail /></AnimatedPage>} />
          <Route path="/profile" element={<AnimatedPage><PatientProfile /></AnimatedPage>} />
          <Route path="/reports" element={<AnimatedPage><MyReports /></AnimatedPage>} />
          <Route path="/notifications" element={<AnimatedPage><PatientNotifications /></AnimatedPage>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', color: '#991b1b', background: '#fef2f2', border: '1px solid #fee2e2', margin: '20px', borderRadius: '12px', fontFamily: 'sans-serif' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>⚠️ Client-Side Render Crash</h2>
          <p style={{ fontSize: '14px', margin: '0 0 20px 0' }}>An uncaught error occurred in the React component tree:</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #f3f4f6', fontSize: '12px', overflowX: 'auto', color: '#374151' }}>
            {this.state.error?.toString()}
            {"\n\nStack Trace:\n"}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <AnimatedAppRoutes />
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}
