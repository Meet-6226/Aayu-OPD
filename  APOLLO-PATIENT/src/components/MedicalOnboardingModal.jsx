import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Check,
  Heart, Activity, Pill, AlertCircle,
  Droplets, Brain, Flame, UploadCloud,
  FileText, Trash2, Sparkles, Shield, Info, Camera, ImagePlus, X
} from 'lucide-react';

/* ── Question Bank with AI Purposes ──────────────────────────────────────────── */
const QUESTIONS = [
  {
    id: 'chronic_conditions',
    step: 1,
    icon: Heart,
    type: 'multi-select',
    label: 'Chronic Conditions',
    question: 'Do you have any diagnosed medical conditions?',
    hint: 'Select all that apply to your medical history',
    aiPurpose: 'Enables drug-disease contraindication checks and prepares a pre-consultation summary for your clinician.',
    options: [
      'Type 2 Diabetes', 'Type 1 Diabetes', 'Hypertension (High BP)',
      'Heart Disease', 'Asthma / COPD', 'Thyroid Disorder',
      'Kidney Disease', 'Arthritis', 'None of the above',
      'Other (Please specify)'
    ],
  },
  {
    id: 'current_medications',
    step: 2,
    icon: Pill,
    type: 'textarea',
    label: 'Current Medications',
    question: 'List any medications you take regularly',
    hint: 'Specify name and dosage frequency (e.g. Metformin 500mg, twice daily) — or type "None"',
    aiPurpose: 'Ensures any new prescriptions generated today are cross-checked for potential drug-drug interactions.',
    placeholder: 'Enter medication name, dosage frequency...',
  },
  {
    id: 'allergies',
    step: 3,
    icon: AlertCircle,
    type: 'multi-select',
    label: 'Known Allergies',
    question: 'Do you have any known allergies?',
    hint: 'Select all that apply to prevent contraindicated drug suggestions',
    aiPurpose: 'Alerts the clinician and system to strictly avoid prescribing drugs matching your allergic profiles.',
    options: [
      'Penicillin / Antibiotics', 'Aspirin / NSAIDs',
      'Sulfa Drugs', 'Latex Materials', 'Pollen / Dust Allergies',
      'Shellfish / Seafood', 'Peanuts / Tree Nuts', 'No known allergies',
      'Other (Please specify)'
    ],
  },
  {
    id: 'blood_group',
    step: 4,
    icon: Droplets,
    type: 'single-select',
    label: 'Blood Group',
    question: 'What is your blood group?',
    hint: 'Important baseline information for emergency care coordination',
    aiPurpose: 'Crucial baseline data saved directly to your ABDM Health Card for emergency response and blood bank matching.',
    options: ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−', 'Not sure', 'Other (Please specify)'],
  },
  {
    id: 'current_symptoms',
    step: 5,
    icon: Activity,
    type: 'multi-select',
    label: 'Current Symptoms',
    question: 'Are you experiencing any symptoms today?',
    hint: 'Select all active conditions for current clinical context',
    aiPurpose: 'Enables pre-routing to the correct department and guides the doctor on priority triage before you enter.',
    options: [
      'Fever / Chills', 'Active Cough / Cold', 'Chest Pain / Tightness',
      'Shortness of Breath', 'Fatigue / Weakness', 'Headache / Migraine',
      'Nausea / Vomiting', 'Joint / Muscle Pain', 'No current symptoms',
      'Other (Please specify)'
    ],
  },
  {
    id: 'lifestyle',
    step: 6,
    icon: Flame,
    type: 'single-select',
    label: 'Lifestyle Profile',
    question: 'Which best describes your tobacco or alcohol habits?',
    hint: 'Helps customize metabolism-related health indicators',
    aiPurpose: 'Helps adjust clinical risk scores and guides metabolic health assessments for dosage calibrations.',
    options: [
      'Non-smoker, Non-drinker',
      'Occasional smoker',
      'Regular smoker',
      'Occasional alcohol',
      'Regular alcohol',
      'Both smoke & drink regularly',
      'Other (Please specify)'
    ],
  },
  {
    id: 'family_history',
    step: 7,
    icon: Brain,
    type: 'multi-select',
    label: 'Family History',
    question: 'Any hereditary history of these conditions in your family?',
    hint: 'Immediate family members (parents, siblings, grandparents)',
    aiPurpose: 'Calculates hereditary risk metrics and suggests proactive screening plans for cardiovascular or diabetic concerns.',
    options: [
      'Diabetes', 'Heart Disease', 'Oncology (Cancer)',
      'Hypertension', 'Stroke History', 'Neurological / Mental Health',
      'Kidney Disease', 'No known family history',
      'Other (Please specify)'
    ],
  },
  {
    id: 'medical_reports',
    step: 8,
    icon: UploadCloud,
    type: 'file-upload',
    label: 'Medical Documentation',
    question: 'Attach your latest diagnostic reports or prescriptions',
    hint: 'Upload PDF, images, or docx records for clinical reference.',
    aiPurpose: 'Extracts key biomarkers and past vitals to update your clinical record for the doctor.',
  },
];

const TOTAL = QUESTIONS.length;

/* ── Premium Rounded Option Chip ──────────────── */
function OptionChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-3 text-xs font-semibold border text-left transition-all duration-150 rounded-[8px] w-full sm:w-[48.5%] flex items-center justify-between
        ${selected
          ? 'bg-[#f0fdfa] text-[#0f766e] border-[#ccfbf1] shadow-sm font-bold'
          : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-[#0f766e] hover:bg-[#F8FAFC]'
        }
      `}
    >
      <span>{label}</span>
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
        selected ? 'border-[#0f766e] bg-[#0f766e] text-white' : 'border-[#cbd5e1] bg-transparent'
      }`}>
        {selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
      </div>
    </button>
  );
}

export default function MedicalOnboardingModal({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [customInputs, setCustomInputs] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);
  // medicinePhotos = [{ file, preview, name }]
  const [medicinePhotos, setMedicinePhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const q = QUESTIONS[step];
  const progress = ((step + 1) / TOTAL) * 100;

  const toggleMulti = (id, option) => {
    setAnswers(prev => {
      const current = prev[id] || [];
      const isNone = option.toLowerCase().includes('none') || option.toLowerCase().includes('no known') || option.toLowerCase().includes('no current');
      if (isNone) {
        setCustomInputs(c => ({ ...c, [id]: '' }));
        return { ...prev, [id]: [option] };
      }
      const withoutNone = current.filter(o => !o.toLowerCase().includes('none') && !o.toLowerCase().includes('no known') && !o.toLowerCase().includes('no current'));
      
      let nextAnswers = [];
      if (current.includes(option)) {
        nextAnswers = withoutNone.filter(o => o !== option);
        if (option === 'Other (Please specify)') {
          setCustomInputs(c => ({ ...c, [id]: '' }));
        }
      } else {
        nextAnswers = [...withoutNone, option];
      }
      return { ...prev, [id]: nextAnswers };
    });
  };

  const setSingle = (id, option) => {
    setAnswers(prev => ({ ...prev, [id]: option }));
    if (option !== 'Other (Please specify)') {
      setCustomInputs(c => ({ ...c, [id]: '' }));
    }
  };

  const setText = (id, val) => setAnswers(prev => ({ ...prev, [id]: val }));

  const handleCustomInputChange = (id, val) => {
    setCustomInputs(prev => ({ ...prev, [id]: val }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileObj = {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type || file.name.split('.').pop(),
      uploadedAt: new Date().toISOString()
    };
    setUploadedFile(fileObj);
    setAnswers(prev => ({ ...prev, medical_report: fileObj }));
  };

  const removeFile = () => {
    setUploadedFile(null);
    setAnswers(prev => {
      const updated = { ...prev };
      delete updated.medical_report;
      return updated;
    });
  };

  const MAX_MEDICINE_PHOTOS = 6;

  const handleMedicinePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setMedicinePhotos(prev => {
      const remaining = MAX_MEDICINE_PHOTOS - prev.length;
      const toAdd = files.slice(0, remaining).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name
      }));
      const next = [...prev, ...toAdd];
      setAnswers(ans => ({ ...ans, medicine_photo_names: next.map(p => p.name) }));
      return next;
    });
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeMedicinePhoto = (index) => {
    setMedicinePhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      const next = prev.filter((_, i) => i !== index);
      setAnswers(ans => ({ ...ans, medicine_photo_names: next.map(p => p.name) }));
      return next;
    });
  };

  const isOtherSelected = () => {
    const val = answers[q.id];
    if (!val) return false;
    if (q.type === 'multi-select') {
      return val.includes('Other (Please specify)');
    }
    return val === 'Other (Please specify)';
  };

  const canProceed = () => {
    const val = answers[q.id];
    if (q.type === 'file-upload') return true;
    
    if (isOtherSelected()) {
      const details = customInputs[q.id];
      return details && details.trim().length >= 2;
    }

    if (q.type === 'multi-select') return val && val.length > 0;
    if (q.type === 'single-select') return !!val;
    if (q.type === 'textarea') return val && val.trim().length > 0;
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = () => {
    setSubmitting(true);
    const finalAnswers = { ...answers };
    Object.keys(customInputs).forEach(key => {
      if (customInputs[key] && customInputs[key].trim().length > 0) {
        finalAnswers[`${key}_custom_details`] = customInputs[key].trim();
      }
    });

    const profile = {
      ...finalAnswers,
      completedAt: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem('nidaan_medical_profile', JSON.stringify(profile));
    localStorage.setItem('nidaan_onboarding_done', 'true');
    setTimeout(() => {
      setSubmitting(false);
      window.dispatchEvent(new CustomEvent('nidaan_onboarding_completed', { detail: profile }));
      onComplete(profile);
    }, 800);
  };

  // Compile real-time clinical draft for preview
  const generateLiveDraft = () => {
    const conditions = answers.chronic_conditions || [];
    const meds = answers.current_medications || '';
    const allergies = answers.allergies || [];
    const blood = answers.blood_group || 'Not specified';
    const symptoms = answers.current_symptoms || [];
    const lifestyle = answers.lifestyle || 'Not specified';
    const family = answers.family_history || [];
    
    const conditionsDetails = isOtherSelected() && q.id === 'chronic_conditions' && customInputs.chronic_conditions
      ? [...conditions.filter(c => c !== 'Other (Please specify)'), customInputs.chronic_conditions].join(', ')
      : conditions.join(', ');

    const allergyDetails = isOtherSelected() && q.id === 'allergies' && customInputs.allergies
      ? [...allergies.filter(a => a !== 'Other (Please specify)'), customInputs.allergies].join(', ')
      : allergies.join(', ');

    return {
      conditions: conditionsDetails || 'None reported',
      meds: meds.trim() ? meds : 'None reported',
      allergies: allergyDetails || 'No known allergies',
      blood,
      symptoms: symptoms.join(', ') || 'No active symptoms',
      lifestyle,
      family: family.join(', ') || 'No known family history',
    };
  };

  const draft = generateLiveDraft();
  const Icon = q.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0f172a]/50 backdrop-blur-[3px] text-[#334155]">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 15 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="bg-white w-full max-w-[960px] shadow-elev-3 rounded-[12px] overflow-hidden border border-[#e2e8f0]"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          
          {/* ── LEFT PANEL ────────────────────── */}
          <div className="md:col-span-4 bg-[#0F172A] text-white p-6 flex flex-col justify-between text-left border-r border-[#1E293B] select-none">

            {/* Branding — compact */}
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#0d9488] shrink-0" />
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#94A3B8]">Nidaan One · ABDM</span>
            </div>

            {/* Step progress dots */}
            <div className="flex gap-1.5 mt-5">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i < step + 1 ? 'bg-[#0d9488]' : 'bg-white/15'
                  } ${i === step ? 'w-5' : 'w-2'}`}
                />
              ))}
            </div>

            {/* Live Draft Card */}
            <div className="flex-1 mt-6 bg-white/5 border border-white/10 rounded-[10px] p-4 flex flex-col gap-0.5 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-white/10">
                <FileText className="h-3 w-3 text-[#0d9488]" />
                <span className="text-[9px] font-semibold text-white/70 uppercase tracking-wider">Clinical Draft</span>
              </div>

              {[
                { label: 'Conditions', value: draft.conditions },
                { label: 'Medications', value: draft.meds },
                { label: 'Allergies', value: draft.allergies },
                { label: 'Blood Group', value: draft.blood },
                { label: 'Symptoms', value: draft.symptoms },
                { label: 'Family Hx', value: draft.family },
              ].map(({ label, value }) => (
                <div key={label} className="grid grid-cols-[72px_1fr] gap-1 text-[9.5px] leading-tight py-1 border-b border-white/5 last:border-0">
                  <span className="text-white/40 font-medium truncate">{label}</span>
                  <span className="text-[#CCFBF1] font-mono truncate">{value}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-1.5 mt-4 text-[9px] text-white/30">
              <Shield className="h-3 w-3 shrink-0 text-[#0d9488]/60" />
              <span>End-to-end encrypted · ABDM compliant</span>
            </div>
          </div>

          {/* ── RIGHT PANEL: Interactive Onboarding Questions ──────────────── */}
          <div className="md:col-span-8 flex flex-col justify-between">
            
            {/* Progress Top Bar */}
            <div className="w-full h-1 bg-[#f1f5f9]">
              <motion.div
                className="h-full bg-[#0f766e]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>

            {/* Onboarding Header */}
            <div className="px-8 pt-7 pb-4 text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold text-[#0f766e] tracking-wider uppercase bg-[#F0FDFA] px-2 py-0.5 rounded-[6px] border border-[#CCFBF1]">
                  Clinical Check
                </span>
                <span className="text-xs font-semibold text-[#64748b]">
                  Step {step + 1} of {TOTAL}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-[#e5f9f8] border border-[#97c9c4] flex items-center justify-center text-[#1b504c] shrink-0 rounded-[12px]">
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wide">
                    {q.label}
                  </p>
                  <h2 className="text-lg font-bold text-[#111827] leading-snug tracking-tight">
                    {q.question}
                  </h2>
                  {q.hint && (
                    <p className="text-xs text-[#64748b] font-medium">{q.hint}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Questions Core Body */}
            <div className="px-8 pb-4 flex-grow min-h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {(q.type === 'multi-select' || q.type === 'single-select') && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3.5 pt-2">
                        {q.options.map(opt => (
                          <OptionChip
                            key={opt}
                            label={opt}
                            selected={
                              q.type === 'multi-select'
                                ? (answers[q.id] || []).includes(opt)
                                : answers[q.id] === opt
                            }
                            onClick={() =>
                              q.type === 'multi-select'
                                ? toggleMulti(q.id, opt)
                                : setSingle(q.id, opt)
                            }
                          />
                        ))}
                      </div>

                      {/* Custom input option */}
                      {isOtherSelected() && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="pt-1 text-left"
                        >
                          <label className="block text-[10px] font-bold text-[#0f766e] uppercase tracking-wider mb-1">
                            Please specify details:
                          </label>
                          <input
                            type="text"
                            value={customInputs[q.id] || ''}
                            onChange={e => handleCustomInputChange(q.id, e.target.value)}
                            placeholder="Type custom details here..."
                            className="w-full px-3.5 py-2 text-xs border border-[#cbd5e1] focus:outline-none focus:border-[#0f766e] focus:bg-[#FAFBFB] rounded-[6px] text-[#0f172a] placeholder-[#94a3b8] font-sans"
                            autoFocus
                          />
                        </motion.div>
                      )}
                    </div>
                  )}

                  {q.type === 'textarea' && (
                    <div className="space-y-3">
                      <textarea
                        value={answers[q.id] || ''}
                        onChange={e => setText(q.id, e.target.value)}
                        placeholder={q.placeholder}
                        rows={4}
                        className="w-full mt-2 px-4 py-3 rounded-[8px] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0f766e] focus:bg-[#FAFBFB] resize-none transition-all"
                      />

                      {/* Medicine Photo Upload — multi-select, only for current_medications */}
                      {q.id === 'current_medications' && (
                        <div>
                          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
                            <Camera className="w-3 h-3 text-[#0f766e]" />
                            Medicine Photos
                            {medicinePhotos.length > 0 && (
                              <span className="ml-1 bg-[#0f766e] text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded-full">
                                {medicinePhotos.length}/{MAX_MEDICINE_PHOTOS}
                              </span>
                            )}
                            <span className="text-[#94a3b8] normal-case font-normal ml-1">(optional)</span>
                          </p>

                          <div className="grid grid-cols-3 gap-2">
                            {/* Existing photo thumbnails */}
                            {medicinePhotos.map((photo, idx) => (
                              <motion.div
                                key={photo.preview}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.15 }}
                                className="relative rounded-[8px] overflow-hidden border border-[#ccfbf1] aspect-square group"
                              >
                                <img
                                  src={photo.preview}
                                  alt={`Medicine ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {/* Dark overlay on hover */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                                {/* Remove button */}
                                <button
                                  type="button"
                                  onClick={() => removeMedicinePhoto(idx)}
                                  className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/80 hover:bg-red-500 hover:text-white text-[#334155] rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                                {/* Index badge */}
                                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                  {idx + 1}
                                </div>
                              </motion.div>
                            ))}

                            {/* Add More tile — shown when below max */}
                            {medicinePhotos.length < MAX_MEDICINE_PHOTOS && (
                              <label className="aspect-square rounded-[8px] border-2 border-dashed border-[#cbd5e1] hover:border-[#0f766e] hover:bg-teal-50/10 bg-[#FAFBFB] flex flex-col items-center justify-center cursor-pointer transition-all group">
                                <div className="w-8 h-8 bg-teal-50 group-hover:bg-teal-100 rounded-full flex items-center justify-center mb-1 transition-colors">
                                  <ImagePlus className="w-4 h-4 text-[#0f766e]" />
                                </div>
                                <span className="text-[9px] font-bold text-[#64748b] group-hover:text-[#0f766e] transition-colors text-center px-1 leading-tight">
                                  {medicinePhotos.length === 0 ? 'Add Photo' : 'Add More'}
                                </span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  multiple
                                  onChange={handleMedicinePhotoUpload}
                                />
                              </label>
                            )}
                          </div>

                          {/* Helper text */}
                          {medicinePhotos.length === 0 && (
                            <p className="text-[10px] text-[#94a3b8] mt-1.5 text-center font-medium">
                              JPG, PNG, HEIC · up to {MAX_MEDICINE_PHOTOS} photos · AI reads dosage from strips
                            </p>
                          )}
                          {medicinePhotos.length >= MAX_MEDICINE_PHOTOS && (
                            <p className="text-[10px] text-amber-600 mt-1.5 font-medium text-center">
                              Maximum {MAX_MEDICINE_PHOTOS} photos reached
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === 'file-upload' && (
                    <div className="pt-2 space-y-3">
                      {!uploadedFile ? (
                        <label className="flex flex-col items-center justify-center w-full h-32 rounded-[8px] border border-dashed border-[#cbd5e1] hover:border-[#0f766e] bg-[#FAFBFB] hover:bg-teal-50/10 transition-all cursor-pointer group">
                          <div className="flex flex-col items-center justify-center p-4 text-center">
                            <UploadCloud className="w-7 h-7 text-[#0f766e] mb-2 transition-transform group-hover:scale-105" />
                            <p className="text-xs font-bold text-[#0f172a]">
                              Choose report file <span className="text-[#64748b] font-normal">or drag here</span>
                            </p>
                            <p className="text-[10px] text-[#64748b] mt-1 font-medium">
                              PDF, PNG, JPG, or DOCX (Max 15MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
                            onChange={handleFileUpload}
                          />
                        </label>
                      ) : (
                        <div className="p-3 border border-[#ccfbf1] bg-[#f0fdfa] flex items-center justify-between rounded-[8px]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#0f766e]/10 text-[#0f766e] flex items-center justify-center rounded-[6px] shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="text-left overflow-hidden">
                              <p className="text-xs font-bold text-[#0f172a] truncate max-w-[280px]">
                                {uploadedFile.name}
                              </p>
                              <p className="text-[10px] text-[#64748b] font-medium">
                                {uploadedFile.size} • Attached
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={removeFile}
                            className="p-1.5 hover:bg-[#f0fdfa] text-red-500 transition-colors rounded-[6px]"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      )}

                      <div className="p-3 border border-[#e2e8f0] bg-[#FAFBFB] flex items-start gap-2.5 rounded-[8px]">
                        <Sparkles className="w-4.5 h-4.5 text-[#0f766e] shrink-0 mt-0.5 animate-pulse" />
                        <p className="text-[11px] text-[#475569] leading-relaxed text-left font-medium">
                          <strong>AI Core Diagnostics:</strong> This report acts as a clinical marker to optimize your automated assistant's knowledge base and medical telemetry.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* AI Purpose Box */}
            <div className="mx-8 mb-2 p-3 bg-[#FAFBFB] border border-[#e2e8f0] rounded-[8px] flex items-start gap-2.5 text-left transition-all duration-150">
              <Info className="h-4 w-4 text-[#0f766e] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-[#0f766e] uppercase tracking-wider block">Why Nidaan One AI asks this:</span>
                <p className="text-[10.5px] text-[#475569] leading-normal font-semibold">{q.aiPurpose}</p>
              </div>
            </div>

            {/* Footer Navigation Controls */}
            <div className="px-8 py-5 flex items-center justify-between border-t border-[#e2e8f0]">
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="flex items-center gap-1 text-xs font-bold text-[#64748b] hover:text-[#0f172a] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    localStorage.setItem('nidaan_onboarding_done', 'true');
                    onComplete(null);
                  }}
                  className="text-xs font-bold text-[#64748b] hover:text-[#0f172a] underline underline-offset-2 transition-colors"
                >
                  Skip
                </button>

                <button
                  onClick={handleNext}
                  disabled={!canProceed() || submitting}
                  className={`
                    flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold transition-all duration-150 rounded-[6px] shadow-sm
                    ${canProceed() && !submitting
                      ? 'bg-[#0f766e] hover:bg-[#0d5a54] text-white cursor-pointer shadow-sm shadow-[#0f766e]/10'
                      : 'bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed'
                    }
                  `}
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : step === TOTAL - 1 ? (
                    <>
                      <Check className="w-4 h-4" />
                      Finish Setup
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}
