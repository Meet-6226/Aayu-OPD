import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
        <Loader2 className="h-10 w-10 text-primary-teal animate-spin" />
        <p className="text-xs text-text-light mt-3 font-medium">Checking authentication state...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
