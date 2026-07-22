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

  // Sample data structured for Apollo OPD Digital Prescription
  const prescriptionData = {
    rxNumber: 'APO-2026-9812',
    date: appointment?.appointmentDate || '2026-07-22',
    doctorName: appointment?.doctorName || 'Dr. Arvind Mehta',
    department: appointment?.department || 'Cardiology',
    hospital: appointment?.hospital || 'Apollo Hospital, Jubilee Hills',
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
      },
      {
        name: 'Vitamin D3 (60,000 IU)',
        type: 'Sachet',
        dosage: '1 Sachet in Milk',
        timing: 'Sunday Morning',
        frequency: 'Once a week',
        duration: '4 Weeks',
        instructions: 'Mix thoroughly in warm milk',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
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
      { rule: 'Avoid caffeine near meds', detail: 'Do not drink tea/coffee within 2 hours of taking medication.' },
      { rule: 'Hydration Goal', detail: 'Drink minimum 3.5 Liters of water daily.' },
      { rule: 'Daily Exercise', detail: '30 minutes light morning brisk walk daily.' }
    ]
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm transition-all duration-200 my-6">
      
      {/* ── HEADER BANNER ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-300 shrink-0 border border-white/10">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                  Apollo OPD Digital Prescription
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded font-mono font-semibold">
                  ABDM Verified
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">
                Medical Report & OPD Summary
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-xl text-teal-100 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print / Download PDF</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-teal-200 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Doctor & Patient Quick Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs text-teal-100">
          <div>
            <p className="text-[10px] text-teal-300 uppercase font-medium">Attending Doctor</p>
            <p className="font-bold text-white mt-0.5">{prescriptionData.doctorName}</p>
            <p className="text-[11px] text-teal-200/80">{prescriptionData.department}</p>
          </div>

          <div>
            <p className="text-[10px] text-teal-300 uppercase font-medium">Rx Reference No.</p>
            <p className="font-mono font-bold text-white mt-0.5">{prescriptionData.rxNumber}</p>
            <p className="text-[11px] text-teal-200/80">Date: {prescriptionData.date}</p>
          </div>

          <div>
            <p className="text-[10px] text-teal-300 uppercase font-medium">Recorded Vitals</p>
            <p className="font-bold text-white mt-0.5">BP: {prescriptionData.vitals.bp}</p>
            <p className="text-[11px] text-teal-200/80">Pulse: {prescriptionData.vitals.heartRate}</p>
          </div>

          <div>
            <p className="text-[10px] text-teal-300 uppercase font-medium">Patient ABHA ID</p>
            <p className="font-mono font-bold text-emerald-300 mt-0.5">91-8273-9182-10</p>
            <p className="text-[11px] text-teal-200/80">Priya Sharma</p>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6 text-sm text-gray-800">
          
          {/* ── 1. DIAGNOSIS & CLINICAL OBSERVATIONS ────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Stethoscope className="h-4 w-4 text-primary-teal" />
              <span>Doctor Diagnosis & Clinical Findings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {prescriptionData.diagnosis.map((diag, idx) => (
                <div key={idx} className="bg-teal-50/60 border border-teal-100 rounded-2xl p-3.5 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{diag.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{diag.code}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-teal-700 bg-white px-2.5 py-1 rounded-full border border-teal-200 shadow-2xs">
                    {diag.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 2. MEDICINES DOSAGE SCHEDULE ────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <Pill className="h-4 w-4 text-primary-teal" />
                <span>Prescribed Medicines & Daily Dosage Schedule</span>
              </div>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                3 Medicines Active
              </span>
            </div>

            <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
              {prescriptionData.medicines.map((med, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50/80 transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{med.name}</h4>
                        <p className="text-xs text-gray-500">{med.type} · Duration: <span className="font-semibold text-gray-700">{med.duration}</span></p>
                      </div>
                    </div>

                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${med.badgeColor}`}>
                      {med.timing}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[10.5px]">Dose Quantity:</span>
                      <span className="font-bold text-gray-800">{med.dosage}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10.5px]">Daily Frequency:</span>
                      <span className="font-bold text-gray-800">{med.frequency}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-gray-400 block text-[10.5px]">Doctor Note:</span>
                      <span className="font-medium text-teal-700">{med.instructions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 3. PRECAUTIONS & THINGS TO AVOID ────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600">
              <AlertOctagon className="h-4 w-4" />
              <span>Precautions & Things to Avoid (Doctor's Advice)</span>
            </div>

            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-2.5">
              {prescriptionData.precautions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                  <div>
                    <span className="font-bold text-rose-900">{item.rule}: </span>
                    <span className="text-gray-600">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 4. NEXT FOLLOW-UP VISIT & ACTIONS ────────────────────────── */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Recommended Follow-up Visit
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {prescriptionData.followUp.displayDate}
                </p>
                <p className="text-xs text-gray-500">{prescriptionData.followUp.room} · Dr. Arvind Mehta</p>
              </div>
            </div>

            <Link
              to={`/doctor/doc_cardiology_1#book`}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              <span>Book Follow-up Slot</span>
              <CheckCircle2 className="h-4 w-4" />
            </Link>
          </div>

        </div>
      )}

    </div>
  );
}
