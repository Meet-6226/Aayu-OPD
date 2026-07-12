import React, { useState } from 'react';
import { seedDatabase } from '../firebase/seedData';
import { Database, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function SeedDb() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [logCounts, setLogCounts] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSeed = async () => {
    setLoading(true);
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const res = await seedDatabase();
      if (res.success) {
        setStatus('success');
        setLogCounts(res.logs);
      } else {
        setStatus('error');
        setErrorMessage('Seeding returned false status.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Seeding failed. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col justify-center items-center py-12 px-6 font-sans">
      <div className="w-full max-w-[480px] bg-white border border-[#e5e7eb] rounded-2xl p-8 hover:shadow-sm transition-all duration-200">
        
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-light-teal flex items-center justify-center text-primary-teal shrink-0 mb-4">
            <Database className="h-6 w-6" />
          </div>
          
          <h1 className="font-display font-bold text-2xl text-text-dark">
            Seed Firestore Database
          </h1>
          
          <p className="text-xs text-text-light mt-1.5 leading-relaxed max-w-[340px]">
            Populates collections for doctors, availability slots, appointments, notifications, waitlists, and patient profiles.
          </p>
        </div>

        {/* State Displays */}
        <div className="mt-8 space-y-4">
          
          {status === 'success' && logCounts && (
            <div className="bg-mint-green border border-green-200/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-xs text-primary-teal font-semibold">
                <CheckCircle className="h-4 w-4" />
                <span>Seeding Completed Successfully!</span>
              </div>
              
              <div className="border-t border-primary-teal/10 pt-2.5 space-y-1.5 text-xs text-[#374151]">
                <div className="flex justify-between">
                  <span>Doctors seeded:</span>
                  <span className="font-bold">{logCounts.doctors || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time slots generated:</span>
                  <span className="font-bold">{logCounts.doctor_slots || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Patients seeded:</span>
                  <span className="font-bold">{logCounts.patients || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Appointments seeded:</span>
                  <span className="font-bold">{logCounts.appointments || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Notifications seeded:</span>
                  <span className="font-bold">{logCounts.notifications || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waitlist items seeded:</span>
                  <span className="font-bold">{logCounts.waitlist || 0}</span>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-2.5 text-xs text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error Seeding Database</p>
                <p className="mt-1 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Trigger Button */}
          <button
            onClick={handleSeed}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-medium text-xs text-center flex items-center justify-center space-x-2 transition-all duration-200 ${
              loading
                ? 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                : 'bg-primary-teal text-white hover:bg-primary-dark cursor-pointer'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Writing data to firestore...</span>
              </>
            ) : (
              <span>Begin Seeding</span>
            )}
          </button>

          <a
            href="/home"
            className="block text-center text-xs font-semibold text-primary-teal hover:underline pt-2"
          >
            Go to Patient Dashboard &rarr;
          </a>

        </div>

      </div>
    </div>
  );
}
