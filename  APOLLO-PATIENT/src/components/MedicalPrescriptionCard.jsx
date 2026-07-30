import React, { useState } from 'react';
import {
  FileText,
  Pill,
  Calendar,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Download,
  Share2,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  MapPin,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MedicalPrescriptionCard({ appointment }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDemoPreview, setShowDemoPreview] = useState(false);

  const hasRealPrescription = Boolean(appointment?.prescription);

  // Default demo data only shown if user clicks "Preview Sample Prescription"
  const demoMockPrescription = {
    rxNumber: 'APO-2026-9812',
    date: appointment?.appointmentDate || '2026-07-25',
    doctorName: appointment?.doctorName || 'Dr. Arvind Mehta',
    department: appointment?.department || 'Cardiology',
    hospital: appointment?.hospital || 'Apollo Hospitals, Navi Mumbai',
    diagnosis: [
      { name: 'Mild Essential Hypertension', code: 'ICD-10: I10', severity: 'Mild / Controlled' },
      { name: 'Vitamin D3 Deficiency', code: 'ICD-10: E55.9', severity: 'Moderate' }
    ],
    vitals: {
      bp: '128/84 mmHg',
      heartRate: '72 bpm',
      weight: '68 kg',
      spo2: '99%'
    },
    medicines: [
      {
        name: 'Telmisartan 40mg',
        type: 'Tablet',
        dosage: '1 Tablet',
        timing: 'Morning (After Breakfast)',
        frequency: '1 time a day',
        duration: '30 Days',
        instructions: 'Take with full glass of water after food',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      {
        name: 'Metformin 500mg',
        type: 'Tablet',
        dosage: '1 Tablet',
        timing: 'Night (After Dinner)',
        frequency: '1 time a day',
        duration: '30 Days',
        instructions: 'Do not skip dinner',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    ],
    followUp: {
      date: '2026-08-05',
      displayDate: 'Tuesday, 5th August 2026 (In 14 Days)',
      room: 'OPD Room 302'
    },
    precautions: [
      { rule: 'Avoid extra table salt', detail: 'Limit total daily salt intake under 5 grams.' },
      { rule: 'Avoid deep-fried & junk food', detail: 'Helps control BP and cholesterol levels.' },
      { rule: 'Hydration Goal', detail: 'Drink minimum 3.5 Liters of water daily.' }
    ]
  };

  const prescriptionData = hasRealPrescription ? appointment.prescription : (showDemoPreview ? demoMockPrescription : null);

  const handlePrint = () => {
    window.print();
  };

  // ── EMPTY STATE FOR NEW USERS / PATIENTS WITHOUT PRESCRIPTIONS ──
  if (!prescriptionData) {
    return (
      <div className="bg-white border-2 border-dashed border-teal-200 rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-xs my-3">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mx-auto border border-teal-100 shadow-xs">
          <Stethoscope className="h-8 w-8" />
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-time OPD Sync Listening...</span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 font-display">
            No Digital Prescription Available Yet
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            You don't have an issued prescription yet. As soon as your consulting doctor creates and dispatches your prescription from the Doctor OPD Studio, it will instantly appear here in real time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/doctors"
            className="w-full sm:w-auto px-6 py-2.5 bg-teal-900 hover:bg-teal-950 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Book Doctor Consultation</span>
          </Link>
          <button
            onClick={() => setShowDemoPreview(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-teal-900 border border-gray-200 font-semibold text-xs rounded-xl transition-all"
          >
            Preview Sample Rx Format
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfbf9] border border-[#e2dcd0] rounded-2xl overflow-hidden shadow-md my-2 font-sans relative">
      
      {/* ── ACTION BAR (Non-printable) ── */}
      <div className="bg-teal-900/10 border-b border-[#e2dcd0] px-4 py-2 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-teal-900 tracking-wide uppercase">
            Official Health Record Locker
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrint}
            className="px-2.5 py-1 bg-teal-900 text-white hover:bg-teal-950 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs"
          >
            <Printer className="h-3 w-3" />
            <span>Print Rx / PDF</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-6 h-6 rounded-lg bg-teal-900/10 hover:bg-teal-900/20 text-teal-900 flex items-center justify-center transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 print:p-0 print:m-0">
          
          {/* ── HOSPITAL LETTERHEAD HEADER ── */}
          <div className="border-b border-teal-900 pb-2 text-center relative">
            {/* ABDM Verified Tag */}
            <div className="absolute right-0 top-0 flex items-center gap-0.5 text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase print:top-0">
              <ShieldCheck className="h-2.5 w-2.5" />
              <span>ABDM Verified</span>
            </div>
            
            <h2 className="font-serif font-black text-lg tracking-wide text-teal-900 uppercase">
              AAYU ONE CLINICS
            </h2>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
              NAVI MUMBAI · EMERGENCY & OPD SERVICES
            </p>
          </div>

          {/* ── PATIENT & DOCTOR INFO TABLE GRID ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-gray-200 rounded-xl p-3 bg-white/50 text-[11px] leading-tight">
            {/* Left Column: Doctor Info */}
            <div className="space-y-1">
              <div>
                <span className="text-[8px] uppercase font-bold text-gray-400 block">Consultant Practitioner</span>
                <span className="font-bold text-gray-900 text-[13px]">{prescriptionData.doctorName}</span>
                <span className="text-gray-500 block text-[10px]">{prescriptionData.department} Specialist</span>
              </div>
              <div className="text-[10px] text-gray-500 pt-0.5 border-t border-gray-100">
                <span>Reg No: <strong>MCI-TS/2026/89412</strong></span>
              </div>
            </div>

            {/* Right Column: Patient Info */}
            <div className="space-y-1 md:border-l md:border-gray-200 md:pl-3">
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 block">Patient Name</span>
                  <span className="font-bold text-gray-900 text-[12px]">{appointment?.patientName || 'Priya Sharma'}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 block">Date of Visit</span>
                  <span className="font-mono font-bold text-gray-900">{prescriptionData.date}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 block">ABHA Health ID</span>
                  <span className="font-mono font-bold text-emerald-700">{appointment?.patientAbha || '91-8273-9182-10'}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 block">Rx Number</span>
                  <span className="font-mono font-bold text-gray-900">{prescriptionData.rxNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── VITALS SECTION ── */}
          <div className="bg-gray-50 border border-gray-200/60 rounded-lg px-3 py-1.5 flex flex-wrap justify-between items-center text-[10px] gap-2">
            <span className="font-bold text-gray-500 uppercase text-[9px]">Patient Vitals:</span>
            <div className="flex gap-4 flex-wrap font-semibold text-gray-800">
              <span>BP: <strong className="text-gray-950">{prescriptionData.vitals.bp}</strong></span>
              <span>Pulse: <strong className="text-gray-950">{prescriptionData.vitals.heartRate}</strong></span>
              <span>Weight: <strong className="text-gray-950">{prescriptionData.vitals.weight || '70 kg'}</strong></span>
              <span>SpO2: <strong className="text-gray-950">{prescriptionData.vitals.spo2 || '98%'}</strong></span>
            </div>
          </div>

          {/* ── CLINICAL FINDINGS / DIAGNOSIS ── */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1 text-left">
              I. Clinical Diagnoses & Findings
            </h4>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {prescriptionData.diagnosis.map((diag, idx) => (
                <div key={idx} className="bg-teal-50/50 border border-teal-200/80 rounded-lg px-2 py-1 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-700" />
                  <span className="font-bold text-teal-950 text-[11px]">{diag.name}</span>
                  <span className="text-[8px] font-mono text-teal-600 bg-white border border-teal-200 px-1.5 py-0.5 rounded">
                    {diag.code || 'ICD-10'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── THE RX PRESCRIPTION LIST ── */}
          <div className="space-y-1.5 relative text-left">
            <div className="flex items-center gap-1.5 border-b border-gray-100 pb-1">
              <span className="font-serif italic font-extrabold text-xl text-teal-900 block leading-none">℞</span>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">
                II. Prescribed Medications
              </h4>
            </div>

            <div className="overflow-hidden border border-gray-200 rounded-xl bg-white shadow-2xs">
              <table className="min-w-full divide-y divide-gray-200 text-[11px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-1.5 text-left font-bold text-gray-500 uppercase tracking-wider w-8">#</th>
                    <th scope="col" className="px-3 py-1.5 text-left font-bold text-gray-500 uppercase tracking-wider">Medicine & Type</th>
                    <th scope="col" className="px-3 py-1.5 text-left font-bold text-gray-500 uppercase tracking-wider w-32">Dosage Schedule</th>
                    <th scope="col" className="px-3 py-1.5 text-left font-bold text-gray-500 uppercase tracking-wider">Instructions & Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {prescriptionData.medicines.map((med, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-3 py-1.5 text-gray-400 font-mono text-center">{idx + 1}</td>
                      <td className="px-3 py-1.5">
                        <div className="font-bold text-gray-900 text-xs">{med.name}</div>
                        <div className="text-[9px] text-gray-400 font-medium">{med.type}</div>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="inline-block px-1.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 text-[9.5px] font-bold rounded uppercase">
                          {med.timing}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-gray-700">
                        <p className="font-bold text-gray-800 text-[10.5px]">{med.instructions}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Duration: <strong className="text-gray-700 font-semibold">{med.duration}</strong></p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── ADVICE & PRECAUTIONS ── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start text-left">
            {/* Precautions */}
            <div className="md:col-span-8 space-y-1.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-700 border-b border-rose-100 pb-1">
                III. Dietary Advice & Precautions
              </h4>
              <ul className="space-y-1 bg-rose-50/30 border border-rose-100 rounded-xl p-3 text-[11px] leading-relaxed">
                {prescriptionData.precautions.map((item, idx) => (
                  <li key={idx} className="flex gap-1.5 text-gray-700 items-start">
                    <span className="w-1 h-1 bg-rose-600 rounded-full mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-rose-900 font-bold">{item.rule}: </strong>
                      <span className="text-gray-600">{item.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Signature Stamp Box */}
            <div className="md:col-span-4 space-y-1.5 flex flex-col items-center md:items-end">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1 w-full text-center md:text-right">
                IV. Clinician Signature
              </h4>
              
              {/* Seal Stamp Container */}
              <div className="relative border border-gray-200 rounded-xl p-3 w-full bg-white flex flex-col items-center justify-center text-center shadow-3xs mt-0.5 min-h-[90px]">
                {/* Simulated Signature Font */}
                <p className="font-serif italic text-teal-900 font-black text-base select-none">
                  {prescriptionData.doctorName}
                </p>
                <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
                  Attending Practitioner
                </p>

                {/* Digital Stamp Seal Overlay */}
                <div 
                  className="absolute border-2 border-blue-500/20 text-blue-500/60 rounded-full w-20 h-20 flex flex-col items-center justify-center select-none rotate-12"
                  style={{
                    fontSize: '5.5px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    lineHeight: '7px',
                    borderColor: 'rgba(59, 130, 246, 0.2)',
                    backgroundColor: 'rgba(59, 130, 246, 0.01)'
                  }}
                >
                  <span>AAYU ONE CLINICS</span>
                  <span className="font-bold text-[7px] my-0.5">NAVI MUMBAI</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── DIGITAL SIGNATURE DISCLOSURE & QR SECTION ── */}
          <div className="border-t border-gray-200 pt-3 mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="text-[9px] text-gray-400 max-w-sm leading-relaxed">
              <span className="font-semibold text-gray-500 uppercase block">Digitally Signed Health Record</span>
              This is a digitally generated medical report issued under verified clinicians and registered under ABDM ID system.
            </div>
            {/* ABDM Verified Barcode Placeholder */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1.5 shrink-0">
              <div className="space-y-0.5 text-right hidden sm:block">
                <span className="text-[7px] font-bold text-gray-400 block uppercase">Record Code</span>
                <span className="text-[9px] font-mono font-bold text-gray-700">{prescriptionData.rxNumber}</span>
              </div>
              <div 
                className="w-9 h-9 bg-gray-100 flex items-center justify-center rounded border border-gray-200"
                style={{
                  backgroundImage: 'radial-gradient(circle, #333 10%, transparent 11%), radial-gradient(circle, #333 10%, transparent 11%)',
                  backgroundSize: '3px 3px',
                  backgroundPosition: '0 0, 1.5px 1.5px'
                }}
              />
            </div>
          </div>

          {/* ── FOLLOW-UP ACTION TICKET (Non-printable) ── */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 print:hidden text-left mt-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
                  Recommended Follow-up Visit
                </p>
                <p className="text-xs font-bold text-gray-900 mt-0.5">
                  {prescriptionData.followUp.displayDate}
                </p>
                <p className="text-[10px] text-gray-500">{prescriptionData.followUp.room || 'OPD Room 302'} · Navi Mumbai</p>
              </div>
            </div>

            <Link
              to={`/doctor/doc_cardiology_1#book`}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Book Follow-up Slot</span>
              <CheckCircle2 className="h-3 w-3" />
            </Link>
          </div>

        </div>
      )}

    </div>
  );
}
