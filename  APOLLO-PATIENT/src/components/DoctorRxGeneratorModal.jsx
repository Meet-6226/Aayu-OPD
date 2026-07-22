import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  CheckCircle2,
  X,
  Sparkles,
  Plus,
  Send,
  Pill,
  AlertTriangle,
  Calendar,
  FileText,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

export default function DoctorRxGeneratorModal({ isOpen, onClose, onPrescriptionGenerated }) {
  const [selectedPatient, setSelectedPatient] = useState('Priya Sharma (ABHA: 91-8273-9182-10)');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState(['Mild Essential Hypertension', 'Vitamin D3 Deficiency']);
  
  // Available pre-saved medicine templates
  const [medicines, setMedicines] = useState([
    {
      id: 1,
      name: 'Telmisartan 40mg',
      type: 'Tablet',
      morning: true,
      afternoon: false,
      night: false,
      afterFood: true,
      duration: '30 Days',
      checked: true
    },
    {
      id: 2,
      name: 'Metformin 500mg',
      type: 'Tablet',
      morning: false,
      afternoon: false,
      night: true,
      afterFood: true,
      duration: '30 Days',
      checked: true
    },
    {
      id: 3,
      name: 'Vitamin D3 (60,000 IU)',
      type: 'Sachet',
      morning: true,
      afternoon: false,
      night: false,
      afterFood: false,
      duration: '4 Weeks',
      checked: true
    },
    {
      id: 4,
      name: 'Pantoprazole 40mg (Pan-40)',
      type: 'Capsule',
      morning: true,
      afternoon: false,
      night: false,
      afterFood: false,
      duration: '15 Days',
      checked: false
    },
    {
      id: 5,
      name: 'Paracetamol 650mg (Dolo)',
      type: 'Tablet',
      morning: false,
      afternoon: false,
      night: false,
      afterFood: true,
      duration: 'As Needed (SOS)',
      checked: false
    }
  ]);

  // Pre-saved dietary precautions
  const [precautions, setPrecautions] = useState([
    { id: 1, label: 'Low salt diet (Under 5g daily)', checked: true },
    { id: 2, label: 'Avoid deep-fried & junk food', checked: true },
    { id: 3, label: 'Avoid tea/caffeine 2 hours near meds', checked: true },
    { id: 4, label: 'Hydration: Drink min 3.5L water daily', checked: true },
    { id: 5, label: 'Daily 30 mins morning brisk walk', checked: true }
  ]);

  const [followUpDays, setFollowUpDays] = useState('14');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);

  const toggleDiagnosis = (diag) => {
    if (selectedDiagnoses.includes(diag)) {
      setSelectedDiagnoses(selectedDiagnoses.filter(d => d !== diag));
    } else {
      setSelectedDiagnoses([...selectedDiagnoses, diag]);
    }
  };

  const toggleMedicine = (id) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, checked: !m.checked } : m));
  };

  const toggleMedTiming = (id, timing) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, [timing]: !m[timing] } : m));
  };

  const togglePrecaution = (id) => {
    setPrecautions(precautions.map(p => p.id === id ? { ...p, checked: !p.checked } : p));
  };

  const handleGenerateAndDispatch = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setDispatchedSuccess(true);
      if (onPrescriptionGenerated) {
        onPrescriptionGenerated({
          date: new Date().toISOString().split('T')[0],
          diagnoses: selectedDiagnoses,
          medicines: medicines.filter(m => m.checked),
          precautions: precautions.filter(p => p.checked),
          followUpDays
        });
      }
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white border border-gray-200 rounded-3xl p-6 max-w-2xl w-full text-gray-900 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-900 text-white flex items-center justify-center font-bold shrink-0">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-teal">
                    Apollo OPD Doctor Studio
                  </span>
                  <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-semibold">
                    1-Click Smart Prescriber
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-display">
                  Generate & Dispatch Patient Rx
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!dispatchedSuccess ? (
            <div className="mt-5 space-y-5 text-xs text-gray-800">
              
              {/* 1. Patient Selector */}
              <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Active OPD Patient</span>
                  <p className="font-bold text-teal-900 text-sm">{selectedPatient}</p>
                </div>
                <span className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-semibold">
                  OPD Room 302
                </span>
              </div>

              {/* 2. Diagnosis Quick Checkboxes */}
              <div className="space-y-2">
                <label className="font-bold text-gray-900 uppercase text-[11px] tracking-wider block">
                  1. Select Diagnosis (1-Click)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Mild Essential Hypertension',
                    'Vitamin D3 Deficiency',
                    'Type 2 Diabetes Mellitus',
                    'Seasonal Allergic Rhinitis',
                    'Acute Gastritis'
                  ].map((diag) => {
                    const isSelected = selectedDiagnoses.includes(diag);
                    return (
                      <button
                        key={diag}
                        type="button"
                        onClick={() => toggleDiagnosis(diag)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-primary-teal text-white border-primary-teal shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {diag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Medicines Checklist Matrix */}
              <div className="space-y-2">
                <label className="font-bold text-gray-900 uppercase text-[11px] tracking-wider block">
                  2. Select Prescribed Medicines & Timings
                </label>
                
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                  {medicines.map((med) => (
                    <div key={med.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50">
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={med.checked}
                          onChange={() => toggleMedicine(med.id)}
                          className="w-4 h-4 rounded text-primary-teal focus:ring-primary-teal"
                        />
                        <div>
                          <p className={`font-bold ${med.checked ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                            {med.name}
                          </p>
                          <p className="text-[11px] text-gray-400">{med.type} · {med.duration}</p>
                        </div>
                      </div>

                      {med.checked && (
                        <div className="flex items-center gap-2 text-[11px] bg-gray-50 p-1.5 rounded-xl border border-gray-200 shrink-0">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={med.morning}
                              onChange={() => toggleMedTiming(med.id, 'morning')}
                              className="w-3.5 h-3.5 text-blue-600 rounded"
                            />
                            <span>Morning ☀️</span>
                          </label>

                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={med.afternoon}
                              onChange={() => toggleMedTiming(med.id, 'afternoon')}
                              className="w-3.5 h-3.5 text-amber-600 rounded"
                            />
                            <span>Afternoon 🌤️</span>
                          </label>

                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={med.night}
                              onChange={() => toggleMedTiming(med.id, 'night')}
                              className="w-3.5 h-3.5 text-indigo-600 rounded"
                            />
                            <span>Night 🌙</span>
                          </label>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Dietary Precautions Checkboxes */}
              <div className="space-y-2">
                <label className="font-bold text-gray-900 uppercase text-[11px] tracking-wider block">
                  3. Select Dietary Advice & Things to Avoid
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-3">
                  {precautions.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => togglePrecaution(item.id)}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className={item.checked ? 'font-semibold text-gray-900' : 'text-gray-400'}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 5. Follow-up Selector */}
              <div className="flex items-center justify-between bg-teal-50/50 border border-teal-100 rounded-2xl p-3">
                <span className="font-bold text-gray-800">Next Follow-up Appointment:</span>
                <select
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-primary-teal focus:outline-none"
                >
                  <option value="7">In 7 Days (1 Week)</option>
                  <option value="14">In 14 Days (2 Weeks)</option>
                  <option value="30">In 30 Days (1 Month)</option>
                </select>
              </div>

              {/* Action Button */}
              <button
                onClick={handleGenerateAndDispatch}
                disabled={isGenerating}
                className="w-full py-3.5 bg-gradient-to-r from-teal-800 to-slate-900 hover:from-teal-900 hover:to-slate-950 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <Sparkles className="h-5 w-5 animate-spin text-teal-300" />
                ) : (
                  <>
                    <Send className="h-4 w-4 text-teal-300" />
                    <span>AI Auto-Generate & Dispatch Rx to Patient</span>
                  </>
                )}
              </button>

            </div>
          ) : (
            /* Success State */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Rx Dispatched Successfully!</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Digital Prescription generated in 1 second and pushed live to <strong>Priya Sharma's</strong> patient portal under <strong>"My Reports"</strong>.
                </p>
              </div>

              <div className="bg-[#25D366]/10 border border-[#25D366]/30 text-slate-800 rounded-2xl p-4 text-xs max-w-md mx-auto flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-[#25D366] shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-slate-900">WhatsApp Notification Dispatched</p>
                  <p className="text-[11px] text-gray-600">Sent to +91 98765 43210 with PDF download link.</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setDispatchedSuccess(false);
                  onClose();
                }}
                className="px-6 py-2.5 bg-primary-teal text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-colors"
              >
                Done & View Patient Portal
              </button>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
