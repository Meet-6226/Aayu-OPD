import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  Calendar,
  Download,
  Activity,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import MedicalPrescriptionCard from '../components/MedicalPrescriptionCard';
import { useAuth } from '../hooks/useAuth';
import { useAppointments } from '../hooks/useAppointments';

export default function MyReports() {
  const { user } = useAuth();
  const { upcoming, past, fetchAppointments } = useAppointments();
  const [activeTab, setActiveTab] = useState('prescriptions');

  useEffect(() => {
    if (user?.uid) {
      const unsub = fetchAppointments(user.uid);
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [user, fetchAppointments]);

  const latestApptWithPrescription = [...upcoming, ...past]
    .filter(appt => appt?.prescription)
    .sort((a, b) => (b.appointmentDate || '').localeCompare(a.appointmentDate || ''))[0];

  const labReports = [
    {
      id: 'LAB-2026-001',
      title: 'Complete Blood Count (CBC)',
      date: '2026-07-15',
      doctor: 'Dr. Kavita Reddy',
      status: 'Normal',
      statusColor: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
    },
    {
      id: 'LAB-2026-002',
      title: 'Lipid Profile & Cholesterol',
      date: '2026-06-28',
      doctor: 'Dr. Arvind Mehta',
      status: 'Borderline High',
      statusColor: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
    },
    {
      id: 'LAB-2026-003',
      title: 'HbA1c & Fasting Blood Sugar',
      date: '2026-06-10',
      doctor: 'Dr. Arvind Mehta',
      status: 'Normal (5.6%)',
      statusColor: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F7F8] font-sans text-[#374151]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">Health Records & Reports</h1>
            <p className="text-sm text-[#6B7280] mt-1">Access your doctor prescriptions, treatment care plans, and verified ABHA lab diagnostics.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1E7F6A] bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1.5 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" />
              ABHA Connected
            </span>
            <span className="text-[11px] text-[#9CA3AF] font-mono">91-8273-9182-10</span>
          </div>
        </div>

        {/* Tab switcher - Layered Surface */}
        <div className="bg-[#FAFBFB] border border-[#E5E7EB] rounded-[10px] p-1 flex gap-1 w-fit select-none">
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-4 py-2 text-xs font-semibold rounded-[8px] transition-all duration-150 flex items-center gap-2 ${
              activeTab === 'prescriptions'
                ? 'bg-white border border-[#E5E7EB] text-[#1E7F6A] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Doctor Prescriptions</span>
          </button>
          
          <button
            onClick={() => setActiveTab('lab_reports')}
            className={`px-4 py-2 text-xs font-semibold rounded-[8px] transition-all duration-150 flex items-center gap-2 ${
              activeTab === 'lab_reports'
                ? 'bg-white border border-[#E5E7EB] text-[#1E7F6A] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Lab Diagnostic Reports ({labReports.length})</span>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'prescriptions' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#374151]">
                Latest Consultation Prescription Care Plan
              </h2>
              <span className="text-xs text-[#6B7280]">
                {latestApptWithPrescription 
                  ? `Uploaded on: ${latestApptWithPrescription.prescription.date}` 
                  : "Last visit: 22 July 2026"}
              </span>
            </div>

            {/* MedicalPrescriptionCard component */}
            <MedicalPrescriptionCard appointment={latestApptWithPrescription} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#374151]">
                Verified Lab Test Results
              </h2>
              <span className="text-xs text-[#1E7F6A] font-semibold bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                3 Records Synced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {labReports.map((lab) => (
                <div key={lab.id} className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 hover:border-[#D1D5DB] hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-150 space-y-4 flex flex-col justify-between text-left">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-[10px] bg-[#ECFDF5] text-[#1E7F6A] border border-[#A7F3D0] flex items-center justify-center shrink-0">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${lab.statusColor}`}>
                        {lab.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-[#111827] text-sm leading-snug">{lab.title}</h4>
                      <p className="text-xs text-[#6B7280] mt-1">Prescribed by {lab.doctor} · {lab.date}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-xs mt-auto">
                    <span className="font-mono text-[#9CA3AF] text-[10px]">{lab.id}</span>
                    <button className="text-[#1E7F6A] hover:text-[#165B52] font-semibold flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
