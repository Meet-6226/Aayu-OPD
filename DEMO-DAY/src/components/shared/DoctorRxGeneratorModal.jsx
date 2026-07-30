import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  CheckCircle2,
  X,
  Sparkles,
  Pill,
  Send,
  MessageSquare,
  Activity,
  Calendar,
  Heart
} from 'lucide-react';
import { doc, updateDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

// ─── Department Specific Templates ───
const DEPARTMENT_TEMPLATES = {
  'Cardiology': {
    diagnoses: ['Mild Essential Hypertension', 'Coronary Artery Disease', 'Angina Pectoris', 'Arrhythmia'],
    medicines: [
      { id: 1, name: 'Telmisartan 40mg', type: 'Tablet', morning: true, afternoon: false, night: false, afterFood: true, duration: '30 Days', checked: true },
      { id: 2, name: 'Metformin 500mg', type: 'Tablet', morning: false, afternoon: false, night: true, afterFood: true, duration: '30 Days', checked: true },
      { id: 3, name: 'Atorvastatin 20mg', type: 'Tablet', morning: false, afternoon: false, night: true, afterFood: true, duration: '30 Days', checked: true },
      { id: 4, name: 'Clopidogrel 75mg', type: 'Tablet', morning: true, afternoon: false, night: false, afterFood: true, duration: '30 Days', checked: false }
    ],
    precautions: [
      { id: 1, label: 'Low salt diet (Under 5g daily)', checked: true },
      { id: 2, label: 'Avoid deep-fried & junk food', checked: true },
      { id: 3, label: 'Daily 30 mins morning brisk walk', checked: true },
      { id: 4, label: 'Avoid table salt (Extra sprinkling)', checked: true },
      { id: 5, label: 'Monitor BP twice daily', checked: false }
    ]
  },
  'General Medicine': {
    diagnoses: ['Seasonal Allergic Rhinitis', 'Acute Gastritis', 'Viral Fever', 'Acute Bronchitis'],
    medicines: [
      { id: 1, name: 'Paracetamol 650mg (Dolo)', type: 'Tablet', morning: true, afternoon: true, night: true, afterFood: true, duration: '5 Days', checked: true },
      { id: 2, name: 'Pantoprazole 40mg (Pan-40)', type: 'Capsule', morning: true, afternoon: false, night: false, afterFood: false, duration: '10 Days', checked: true },
      { id: 3, name: 'Cetirizine 10mg', type: 'Tablet', morning: false, afternoon: false, night: true, afterFood: true, duration: '7 Days', checked: false },
      { id: 4, name: 'Amoxicillin 500mg', type: 'Capsule', morning: true, afternoon: false, night: true, afterFood: true, duration: '5 Days', checked: false }
    ],
    precautions: [
      { id: 1, label: 'Hydration: Drink min 3.5L water daily', checked: true },
      { id: 2, label: 'Complete bed rest for 3 days', checked: true },
      { id: 3, label: 'Avoid cold drinks & oily foods', checked: true },
      { id: 4, label: 'Steam inhalation twice daily', checked: false }
    ]
  },
  'Orthopedics': {
    diagnoses: ['Osteoarthritis Knee', 'Lower Back Pain (Lumbago)', 'Vitamin D3 Deficiency', 'Cervical Spondylosis'],
    medicines: [
      { id: 1, name: 'Vitamin D3 (60,000 IU)', type: 'Sachet', morning: true, afternoon: false, night: false, afterFood: false, duration: '4 Weeks', checked: true },
      { id: 2, name: 'Aceclofenac 100mg', type: 'Tablet', morning: true, afternoon: false, night: true, afterFood: true, duration: '7 Days', checked: true },
      { id: 3, name: 'Calcium Carbonate 500mg', type: 'Tablet', morning: false, afternoon: false, night: true, afterFood: true, duration: '30 Days', checked: true },
      { id: 4, name: 'Paracetamol 650mg (Dolo)', type: 'Tablet', morning: false, afternoon: false, night: false, afterFood: true, duration: 'As Needed (SOS)', checked: false }
    ],
    precautions: [
      { id: 1, label: 'Avoid heavy weight lifting', checked: true },
      { id: 2, label: 'Regular knee physiotherapy exercise', checked: true },
      { id: 3, label: 'Avoid sitting on low chairs/floor', checked: true },
      { id: 4, label: 'Use hot water fermentation for back', checked: false }
    ]
  },
  'Dermatology': {
    diagnoses: ['Atopic Dermatitis', 'Acne Vulgaris', 'Tinea Corporis (Fungal)', 'Psoriasis'],
    medicines: [
      { id: 1, name: 'Cetirizine 10mg', type: 'Tablet', morning: false, afternoon: false, night: true, afterFood: true, duration: '15 Days', checked: true },
      { id: 2, name: 'Itraconazole 100mg', type: 'Capsule', morning: true, afternoon: false, night: true, afterFood: true, duration: '14 Days', checked: true },
      { id: 3, name: 'Clobetasol Propionate Cream', type: 'Ointment', morning: true, afternoon: false, night: true, afterFood: false, duration: '10 Days', checked: true },
      { id: 4, name: 'Salicylic Acid 2% Face Wash', type: 'Liquid', morning: true, afternoon: false, night: true, afterFood: false, duration: '30 Days', checked: false }
    ],
    precautions: [
      { id: 1, label: 'Apply sunscreen daily SPF 50', checked: true },
      { id: 2, label: 'Avoid scratching affected areas', checked: true },
      { id: 3, label: 'Use mild moisturizing soap only', checked: true },
      { id: 4, label: 'Wear loose cotton clothes', checked: false }
    ]
  },
  'Neurology': {
    diagnoses: ['Migraine Headache', 'Tension Type Headache', 'Peripheral Neuropathy', 'Essential Tremors'],
    medicines: [
      { id: 1, name: 'Naproxen 250mg', type: 'Tablet', morning: true, afternoon: false, night: true, afterFood: true, duration: '5 Days', checked: true },
      { id: 2, name: 'Pregabalin 75mg', type: 'Capsule', morning: false, afternoon: false, night: true, afterFood: true, duration: '30 Days', checked: true },
      { id: 3, name: 'Amitriptyline 10mg', type: 'Tablet', morning: false, afternoon: false, night: true, afterFood: true, duration: '30 Days', checked: false },
      { id: 4, name: 'Propranolol 40mg', type: 'Tablet', morning: true, afternoon: false, night: false, afterFood: true, duration: '30 Days', checked: false }
    ],
    precautions: [
      { id: 1, label: 'Maintain fixed sleep timings', checked: true },
      { id: 2, label: 'Avoid loud noises and bright lights', checked: true },
      { id: 3, label: 'Limit screen time to under 4 hours', checked: true },
      { id: 4, label: 'Identify and record headache triggers', checked: false }
    ]
  },
  'ENT': {
    diagnoses: ['Acute Otitis Media', 'Allergic Sinusitis', 'Pharyngitis / Throat Infection', 'Tinnitus'],
    medicines: [
      { id: 1, name: 'Amoxicillin 500mg', type: 'Capsule', morning: true, afternoon: false, night: true, afterFood: true, duration: '5 Days', checked: true },
      { id: 2, name: 'Fluticasone Nasal Spray', type: 'Spray', morning: true, afternoon: false, night: true, afterFood: false, duration: '14 Days', checked: true },
      { id: 3, name: 'Cetirizine 10mg', type: 'Tablet', morning: false, afternoon: false, night: true, afterFood: true, duration: '10 Days', checked: true },
      { id: 4, name: 'Paracetamol 650mg (Dolo)', type: 'Tablet', morning: false, afternoon: false, night: false, afterFood: true, duration: 'As Needed (SOS)', checked: false }
    ],
    precautions: [
      { id: 1, label: 'Warm saline gargles 3 times daily', checked: true },
      { id: 2, label: 'Avoid direct cold air exposure', checked: true },
      { id: 3, label: 'Do not use ear buds/sharp objects', checked: true },
      { id: 4, label: 'Keep ears dry during bath', checked: false }
    ]
  },
  'Gynecology': {
    diagnoses: ['Polycystic Ovary Syndrome (PCOS)', 'Iron Deficiency Anemia', 'Dysmenorrhea', 'Urinary Tract Infection (UTI)'],
    medicines: [
      { id: 1, name: 'Ferrous Ascorbate (Iron)', type: 'Tablet', morning: false, afternoon: false, night: true, afterFood: true, duration: '60 Days', checked: true },
      { id: 2, name: 'Folic Acid 5mg', type: 'Tablet', morning: true, afternoon: false, night: false, afterFood: true, duration: '60 Days', checked: true },
      { id: 3, name: 'Mefenamic Acid 500mg', type: 'Tablet', morning: false, afternoon: false, night: false, afterFood: true, duration: 'As Needed (SOS)', checked: false },
      { id: 4, name: 'Nitrofurantoin 100mg', type: 'Tablet', morning: true, afternoon: false, night: true, afterFood: true, duration: '7 Days', checked: false }
    ],
    precautions: [
      { id: 1, label: 'Increase intake of leafy greens/fruits', checked: true },
      { id: 2, label: 'Hydrate well: drink 3L water daily', checked: true },
      { id: 3, label: 'Avoid high glycemic index foods', checked: true },
      { id: 4, label: 'Perform 30 mins light exercise daily', checked: false }
    ]
  },
  'Pediatrics': {
    diagnoses: ['Acute Gastroenteritis', 'Tonsillitis', 'Infantile Colic', 'Pediatric Asthma'],
    medicines: [
      { id: 1, name: 'ORS Sachet', type: 'Sachet', morning: true, afternoon: true, night: true, afterFood: false, duration: '3 Days', checked: true },
      { id: 2, name: 'Paracetamol Syrup (Calpol)', type: 'Syrup', morning: false, afternoon: false, night: false, afterFood: true, duration: 'As Needed (SOS)', checked: true },
      { id: 3, name: 'Amoxicillin Suspension', type: 'Syrup', morning: true, afternoon: false, night: true, afterFood: true, duration: '5 Days', checked: false },
      { id: 4, name: 'Montelukast Kid', type: 'Tablet', morning: false, afternoon: false, night: true, afterFood: false, duration: '10 Days', checked: false }
    ],
    precautions: [
      { id: 1, label: 'Maintain liquid diet with ORS', checked: true },
      { id: 2, label: 'Keep child warm and comfortable', checked: true },
      { id: 3, label: 'Avoid dust and direct cold exposure', checked: true },
      { id: 4, label: 'Sterilize baby bottles before feed', checked: false }
    ]
  }
};

export default function DoctorRxGeneratorModal({ isOpen, onClose, patient, onPrescriptionGenerated }) {
  if (!isOpen || !patient) return null;

  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [precautions, setPrecautions] = useState([]);
  const [followUpDays, setFollowUpDays] = useState('14');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);

  // Initialize templates based on doctor/patient department
  useEffect(() => {
    if (isOpen && patient?.department) {
      const dept = patient.department;
      const template = DEPARTMENT_TEMPLATES[dept] || DEPARTMENT_TEMPLATES['General Medicine'];
      setSelectedDiagnoses([template.diagnoses[0]]);
      setMedicines(template.medicines);
      setPrecautions(template.precautions);
    }
  }, [isOpen, patient?.department]);

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

  const handleGenerateAndDispatch = async () => {
    setIsGenerating(true);
    try {
      const rxNumber = `APO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
      
      const selectedMeds = medicines.filter(m => m.checked).map(m => {
        const timings = [];
        if (m.morning) timings.push('Morning');
        if (m.afternoon) timings.push('Afternoon');
        if (m.night) timings.push('Night');
        
        return {
          name: m.name,
          type: m.type,
          dosage: m.morning && m.afternoon && m.night ? '3 times a day' : m.morning && m.night ? '2 times a day' : '1 time a day',
          timing: `${timings.join(' + ')} (${m.afterFood ? 'After Food' : 'Before Food'})`,
          frequency: m.duration,
          duration: m.duration,
          instructions: m.afterFood ? 'Take after food' : 'Take on empty stomach',
          badgeColor: m.morning && m.night ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      });

      const selectedPrecs = precautions.filter(p => p.checked).map(p => ({
        rule: p.label.split('(')[0].trim(),
        detail: p.label
      }));

      const followUpDateObj = new Date();
      followUpDateObj.setDate(followUpDateObj.getDate() + parseInt(followUpDays));
      const followUpDisplay = followUpDateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const followUpDateStr = followUpDateObj.toISOString().split('T')[0];

      const prescription = {
        rxNumber,
        date,
        doctorName: patient.doctorName || 'Dr. Rajesh Mehta',
        department: patient.department || 'Cardiology',
        hospital: patient.hospital || 'Aayu Clinics',
        diagnosis: selectedDiagnoses.map(d => ({ name: d, code: 'ICD-10', severity: 'Active / Controlled' })),
        vitals: {
          bp: patient.vitals?.bp || '120/80 mmHg',
          heartRate: patient.vitals?.hr || '72 bpm',
          weight: '70 kg',
          spo2: '98%'
        },
        medicines: selectedMeds,
        precautions: selectedPrecs,
        followUp: {
          date: followUpDateStr,
          displayDate: `${followUpDisplay} (In ${followUpDays} Days)`,
          room: 'OPD Room 302'
        }
      };

      if (patient.appointmentId) {
        const apptRef = doc(db, 'appointments', patient.appointmentId);
        await updateDoc(apptRef, {
          prescription,
          status: 'completed',
          updatedAt: serverTimestamp()
        });
        
        const notifyRef = doc(collection(db, 'notifications'));
        await setDoc(notifyRef, {
          patientId: patient.id,
          type: 'prescription',
          title: 'Prescription Uploaded',
          body: `Dr. ${patient.doctorName || 'Rajesh Mehta'} uploaded your digital prescription. Tap to view.`,
          read: false,
          appointmentId: patient.appointmentId,
          channel: 'system',
          createdAt: serverTimestamp()
        });
      }

      setIsGenerating(false);
      setDispatchedSuccess(true);
      if (onPrescriptionGenerated) {
        onPrescriptionGenerated(prescription);
      }
    } catch (e) {
      console.error("Failed to generate prescription:", e);
      setIsGenerating(false);
    }
  };

  const getActiveTemplate = () => {
    return DEPARTMENT_TEMPLATES[patient?.department] || DEPARTMENT_TEMPLATES['General Medicine'];
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem', backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0',
            width: '100%', maxWidth: '640px', maxHeight: '88vh',
            boxShadow: '0 24px 48px -12px rgba(27, 80, 76, 0.16)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#1e293b'
          }}
        >
          
          {/* Header */}
          <div style={{
            padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#fafbfc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '10px',
                background: '#1b504c', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Stethoscope size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#1b504c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    AAYU ONE OPD STUDIO
                  </span>
                  <span style={{ fontSize: '8px', background: '#e5f9f8', color: '#1b504c', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                    {patient.department?.toUpperCase() || 'GENERAL MEDICINE'}
                  </span>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>
                  Generate & Dispatch Patient Rx
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: '#e2e8f0',
                border: 'none', color: '#475569', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <X size={14} />
            </button>
          </div>

          {!dispatchedSuccess ? (
            <>
              {/* Scrollable Form Body */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '1.5rem',
                display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left'
              }}>
                
                {/* 1. Active Patient Banner */}
                <div style={{
                  background: '#e5f9f8', border: '1px solid #97c9c4',
                  borderRadius: '14px', padding: '0.85rem 1.15rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#1b504c', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Active Patient</span>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#133b38', margin: '0.15rem 0 0 0' }}>{patient.name}</p>
                  </div>
                  <span style={{ fontSize: '10px', background: '#1b504c', color: 'white', padding: '0.25rem 0.65rem', borderRadius: '20px', fontWeight: 700 }}>
                    OPD Room 302
                  </span>
                </div>

                {/* 2. Diagnosis Quick Checkboxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1. Select Diagnosis (1-Click)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {(getActiveTemplate().diagnoses).map((diag) => {
                      const isSelected = selectedDiagnoses.includes(diag);
                      return (
                        <button
                          key={diag}
                          type="button"
                          onClick={() => toggleDiagnosis(diag)}
                          style={{
                            padding: '0.45rem 0.75rem', borderRadius: '10px', border: isSelected ? '1px solid #1b504c' : '1px solid #e2e8f0',
                            fontSize: '11.5px', fontWeight: 600, background: isSelected ? '#1b504c' : '#f8fafc',
                            color: isSelected ? 'white' : '#475569', cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          {isSelected ? '✓ ' : '+ '} {diag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Medicines Checklist Matrix */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    2. Select Prescribed Medicines & Timings
                  </label>
                  
                  <div style={{
                    border: '1px solid #e2e8f0', borderRadius: '14px',
                    overflow: 'hidden', background: 'white', display: 'flex', flexDirection: 'column'
                  }}>
                    {medicines.map((med, idx) => (
                      <div
                        key={med.id}
                        style={{
                          padding: '0.85rem 1rem', display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between',
                          borderBottom: idx < medicines.length - 1 ? '1px solid #f1f5f9' : 'none',
                          gap: '1rem', background: med.checked ? 'rgba(229, 249, 248, 0.15)' : 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={med.checked}
                            onChange={() => toggleMedicine(med.id)}
                            style={{
                              width: '16px', height: '16px', accentColor: '#1b504c', cursor: 'pointer'
                            }}
                          />
                          <div style={{ textAlign: 'left' }}>
                            <p style={{
                              fontSize: '13px', fontWeight: 700, margin: 0,
                              color: med.checked ? '#0f172a' : '#94a3b8',
                              textDecoration: med.checked ? 'none' : 'line-through'
                            }}>
                              {med.name}
                            </p>
                            <p style={{ fontSize: '10.5px', color: '#64748b', margin: '0.1rem 0 0 0' }}>
                              {med.type} · {med.duration}
                            </p>
                          </div>
                        </div>

                        {med.checked && (
                          <div style={{
                            display: 'flex', gap: '0.65rem', padding: '0.35rem 0.55rem',
                            background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0',
                            fontSize: '11px', fontWeight: 600, color: '#334155'
                          }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={med.morning}
                                onChange={() => toggleMedTiming(med.id, 'morning')}
                                style={{ accentColor: '#1b504c', cursor: 'pointer' }}
                              />
                              <span>Morning ☀️</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={med.afternoon}
                                onChange={() => toggleMedTiming(med.id, 'afternoon')}
                                style={{ accentColor: '#1b504c', cursor: 'pointer' }}
                              />
                              <span>Afternoon 🌤️</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={med.night}
                                onChange={() => toggleMedTiming(med.id, 'night')}
                                style={{ accentColor: '#1b504c', cursor: 'pointer' }}
                              />
                              <span>Night 🌙</span>
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Dietary Precautions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    3. Dietary Advice & Precautions
                  </label>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 1.2rem',
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem 1rem'
                  }}>
                    {precautions.map((item) => (
                      <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '11.5px', color: '#334155', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => togglePrecaution(item.id)}
                          style={{ accentColor: '#1b504c', width: '14px', height: '14px' }}
                        />
                        <span style={{ fontWeight: item.checked ? 600 : 400, color: item.checked ? '#1e293b' : '#64748b' }}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 5. Follow-up and Actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifycontent: 'space-between',
                  background: '#e5f9f8', border: '1px solid #e8faee', borderRadius: '14px', padding: '0.75rem 1rem'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#133b38' }}>Next Follow-up Visit:</span>
                  <select
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(e.target.value)}
                    style={{
                      padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid #97c9c4',
                      fontSize: '11px', fontWeight: 700, color: '#1b504c', background: 'white', outline: 'none'
                    }}
                  >
                    <option value="7">In 7 Days (1 Week)</option>
                    <option value="14">In 14 Days (2 Weeks)</option>
                    <option value="30">In 30 Days (1 Month)</option>
                  </select>
                </div>

              </div>

              {/* Footer Actions */}
              <div style={{
                padding: '1.25rem 1.5rem', borderTop: '1px solid #f1f5f9',
                background: '#fafbfc'
              }}>
                <button
                  onClick={handleGenerateAndDispatch}
                  disabled={isGenerating}
                  style={{
                    width: '100%', padding: '0.85rem', border: 'none', borderRadius: '14px',
                    background: 'linear-gradient(135deg, #1b504c 0%, #153f3c 100%)',
                    color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                    boxShadow: '0 4px 12px rgba(27, 80, 76, 0.15)', opacity: isGenerating ? 0.75 : 1
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Sparkles size={16} className="animate-spin" />
                      <span>Generating Digital Prescription Plan...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>AI Auto-Generate & Dispatch Rx to Patient</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Success State */
            <div style={{ padding: '2.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                width: 54, height: 54, borderRadius: '50%', background: '#d1fae5',
                color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto', boxShadow: '0 4px 10px rgba(5, 150, 105, 0.1)'
              }}>
                <CheckCircle2 size={30} />
              </div>
              
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>
                  Rx Dispatched Successfully!
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0.35rem 0 0 0', lineHeight: 1.45 }}>
                  Digital Prescription generated in 1 second and pushed live to <strong>{patient.name}'s</strong> patient portal under <strong>"My Reports"</strong>.
                </p>
              </div>

              <div style={{
                background: 'rgba(37, 211, 102, 0.08)', border: '1px solid rgba(37, 211, 102, 0.25)',
                borderRadius: '14px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                maxWidth: '440px', margin: '0.25rem auto 0 auto', textAlign: 'left'
              }}>
                <MessageSquare size={20} color="#25D366" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#133b38', margin: 0 }}>WhatsApp Notification Sent</p>
                  <p style={{ fontSize: '10.5px', color: '#475569', margin: '0.1rem 0 0 0' }}>Sent to {patient.phone || 'patient number'} with digital prescription download link.</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setDispatchedSuccess(false);
                  onClose();
                }}
                style={{
                  alignSelf: 'center', padding: '0.65rem 2rem', background: '#1b504c', color: 'white',
                  border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', marginTop: '0.5rem', transition: 'background 0.15s'
                }}
              >
                Done & Continue OPD
              </button>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
