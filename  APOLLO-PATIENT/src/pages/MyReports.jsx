import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Calendar,
  Download,
  Activity,
  Search,
  CheckCircle2,
  Filter,
  FileCheck
} from 'lucide-react';
import MedicalPrescriptionCard from '../components/MedicalPrescriptionCard';
import { useAuth } from '../hooks/useAuth';

export default function MyReports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('prescriptions');

  const labReports = [
    {
      id: 'LAB-2026-001',
      title: 'Complete Blood Count (CBC)',
      date: '2026-07-15',
      doctor: 'Dr. Kavita Reddy',
      status: 'Normal',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'LAB-2026-002',
      title: 'Lipid Profile & Cholesterol',
      date: '2026-06-28',
      doctor: 'Dr. Arvind Mehta',
      status: 'Borderline High',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'LAB-2026-003',
      title: 'HbA1c & Fasting Blood Sugar',
      date: '2026-06-10',
      doctor: 'Dr. Arvind Mehta',
      status: 'Normal (5.6%)',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6">
      
      {/* ── PAGE TITLE BANNER ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
              Apollo Health Locker
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded font-mono font-semibold">
              ABHA Verified
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">
            My Reports & Digital Prescriptions
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/80 mt-1 max-w-xl">
            Access your doctor prescriptions, daily medicine dosage schedules, health precautions, and verified ABHA lab diagnostic reports.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-xs space-y-1.5 shrink-0">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>ABHA Health ID Synced</span>
          </div>
          <p className="font-mono text-white font-bold text-sm">91-8273-9182-10</p>
          <p className="text-[11px] text-teal-200/80">Patient: {user?.name || 'Priya Sharma'}</p>
        </div>
      </div>

      {/* ── FILTER TABS ──────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-semibold text-gray-500">
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            activeTab === 'prescriptions'
              ? 'text-primary-teal font-bold border-b-2 border-primary-teal'
              : 'hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Doctor Prescriptions & Care Plan</span>
          <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-mono">
            Active
          </span>
        </button>

        <button
          onClick={() => setActiveTab('lab_reports')}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            activeTab === 'lab_reports'
              ? 'text-primary-teal font-bold border-b-2 border-primary-teal'
              : 'hover:text-gray-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Diagnostic Lab Reports ({labReports.length})</span>
        </button>
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────── */}
      {activeTab === 'prescriptions' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 font-display">
              Latest Doctor OPD Prescription & Medical Report
            </h2>
            <span className="text-xs text-gray-500">Last visit: 22 July 2026</span>
          </div>

          {/* Full Prescription Component */}
          <MedicalPrescriptionCard />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 font-display">
              Verified Diagnostic Lab Reports
            </h2>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              3 Reports Synced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {labReports.map((lab) => (
              <div key={lab.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-primary-teal/40 transition-all space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${lab.statusColor}`}>
                    {lab.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{lab.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{lab.doctor} · {lab.date}</p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-gray-400 text-[11px]">{lab.id}</span>
                  <button className="text-primary-teal font-bold hover:underline flex items-center gap-1">
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
  );
}
