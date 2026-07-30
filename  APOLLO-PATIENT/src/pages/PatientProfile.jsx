import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, Bell, Users, Shield, LogOut,
  CheckCircle, X, Edit2, Trash2, Plus, Loader2,
  Calendar, MapPin, Heart, Activity, QrCode, Lock, Gift,
  ClipboardList, Pill, AlertCircle, Droplets, Zap, TreePine,
  Stethoscope, Wind, ChevronRight, Sparkles, FileHeart
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { useAuth } from '../hooks/useAuth';

function HistoryChip({ label, color = 'green' }) {
  const colors = {
    green:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    red:    'bg-red-50 text-red-700 border-red-200',
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    slate:  'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${colors[color]}`}>
      {label}
    </span>
  );
}

function HistoryCard({ icon: Icon, label, iconColor, iconBg, children, isEmpty }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <span className="text-xs font-bold text-[#111827] tracking-tight">{label}</span>
      </div>
      {isEmpty ? (
        <p className="text-[11px] text-[#9CA3AF] italic">None reported</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">{children}</div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview',       icon: User },
  { id: 'history',  label: 'Medical History', icon: FileHeart },
  { id: 'prefs',    label: 'Notifications',   icon: Bell },
  { id: 'abha',     label: 'ABHA / ID',       icon: Shield },
];

export default function PatientProfile() {
  const navigate = useNavigate();
  const { user, updateMockSession, signOutUser } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [toastMessage, setToastMessage] = useState('');

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('');
  const [infoErrors, setInfoErrors] = useState({});
  const [infoSaving, setInfoSaving] = useState(false);

  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [familyFields, setFamilyFields] = useState({ name: '', phone: '', relation: 'Son/Daughter' });
  const [familyErrors, setFamilyErrors] = useState({});
  const [familySaving, setFamilySaving] = useState(false);

  const [abhaInput, setAbhaInput] = useState('');
  const [abhaSaving, setAbhaSaving] = useState(false);
  const [abhaError, setAbhaError] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditAge(user.age?.toString() || '');
      setEditGender(user.gender || 'Female');
      setEditCity(user.city || '');
      setEditBloodGroup(user.bloodGroup || '');
      setFamilyFields({
        name: user.familyContactName || '',
        phone: user.familyContactPhone || '',
        relation: user.familyContactRelation || 'Son/Daughter'
      });
      setAbhaInput(user.abhaId || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[80vh] flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#0f766e]" />
      </div>
    );
  }

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setInfoErrors({});
    const errors = {};
    if (!editName.trim()) errors.name = 'Name is required';
    const ageNum = parseInt(editAge, 10);
    if (!editAge.trim() || isNaN(ageNum) || ageNum < 1 || ageNum > 120) errors.age = 'Age must be 1-120';
    if (editEmail.trim() && !/\S+@\S+\.\S+/.test(editEmail)) errors.email = 'Invalid email format';
    if (Object.keys(errors).length > 0) { setInfoErrors(errors); return; }
    setInfoSaving(true);
    try {
      const ref = doc(db, COLLECTIONS.PATIENTS, user.uid);
      const data = { name: editName, email: editEmail, age: ageNum, gender: editGender, city: editCity, bloodGroup: editBloodGroup, updatedAt: serverTimestamp() };
      await updateDoc(ref, data);
      updateMockSession(data);
      setIsEditingInfo(false);
      triggerToast('Profile updated');
    } catch { triggerToast('Failed to save'); }
    finally { setInfoSaving(false); }
  };

  const handleCancelInfo = () => {
    setEditName(user.name || ''); setEditEmail(user.email || '');
    setEditAge(user.age?.toString() || ''); setEditGender(user.gender || 'Female');
    setEditCity(user.city || ''); setEditBloodGroup(user.bloodGroup || '');
    setInfoErrors({}); setIsEditingInfo(false);
  };

  const handleTogglePreference = async (key, current) => {
    try {
      const ref = doc(db, COLLECTIONS.PATIENTS, user.uid);
      const updated = { ...(user.preferences || {}), [key]: !current };
      await updateDoc(ref, { preferences: updated, updatedAt: serverTimestamp() });
      updateMockSession({ preferences: updated });
      triggerToast('Preference updated');
    } catch { triggerToast('Failed to update'); }
  };

  const handleSaveFamily = async () => {
    setFamilyErrors({});
    const errors = {};
    if (!familyFields.name.trim()) errors.name = 'Name required';
    if (!familyFields.phone.trim()) errors.phone = 'Phone required';
    if (Object.keys(errors).length > 0) { setFamilyErrors(errors); return; }
    setFamilySaving(true);
    try {
      const ref = doc(db, COLLECTIONS.PATIENTS, user.uid);
      const data = { familyContactName: familyFields.name, familyContactPhone: familyFields.phone, familyContactRelation: familyFields.relation, updatedAt: serverTimestamp() };
      await updateDoc(ref, data);
      updateMockSession(data);
      setIsEditingFamily(false);
      triggerToast('Family contact saved');
    } catch { triggerToast('Failed to save'); }
    finally { setFamilySaving(false); }
  };

  const handleRemoveFamily = async () => {
    if (!window.confirm('Remove family caretaker contact?')) return;
    setFamilySaving(true);
    try {
      const ref = doc(db, COLLECTIONS.PATIENTS, user.uid);
      const data = { familyContactName: '', familyContactPhone: '', familyContactRelation: '', updatedAt: serverTimestamp() };
      await updateDoc(ref, data);
      updateMockSession(data);
      setFamilyFields({ name: '', phone: '', relation: 'Son/Daughter' });
      setIsEditingFamily(false);
      triggerToast('Contact removed');
    } catch { triggerToast('Failed to remove'); }
    finally { setFamilySaving(false); }
  };

  const handleLinkAbha = async () => {
    setAbhaError('');
    if (!abhaInput.trim()) { setAbhaError('ABHA ID cannot be empty'); return; }
    setAbhaSaving(true);
    try {
      const ref = doc(db, COLLECTIONS.PATIENTS, user.uid);
      await updateDoc(ref, { abhaId: abhaInput, updatedAt: serverTimestamp() });
      updateMockSession({ abhaId: abhaInput });
      triggerToast('ABHA linked');
    } catch { triggerToast('Failed to link ABHA'); }
    finally { setAbhaSaving(false); }
  };

  const handleUnlinkAbha = async () => {
    if (!window.confirm('Unlink ABHA ID?')) return;
    setAbhaSaving(true);
    try {
      const ref = doc(db, COLLECTIONS.PATIENTS, user.uid);
      await updateDoc(ref, { abhaId: '', updatedAt: serverTimestamp() });
      updateMockSession({ abhaId: '' });
      setAbhaInput('');
      triggerToast('ABHA unlinked');
    } catch { triggerToast('Failed to unlink'); }
    finally { setAbhaSaving(false); }
  };

  const handleLogout = async () => {
    localStorage.removeItem('aayu_onboarding_done');
    localStorage.removeItem('aayu_medical_profile');
    await signOutUser();
    navigate('/');
  };

  const initials = user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PS';
  const hasFamilyContact = !!(user.familyContactName && user.familyContactPhone);
  const prefs = user.preferences || { whatsapp: true, sms: false, voiceCall: false, email: false };
  const mh = user.medicalHistory || {};

  const toArr = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    return val.split(',').map(s => s.trim()).filter(Boolean);
  };

  const conditions = toArr(mh.chronicConditions);
  const meds = toArr(mh.currentMedications);
  const allergies = toArr(mh.allergies);
  const symptoms = toArr(mh.currentSymptoms);
  const lifestyle = toArr(mh.lifestyle);
  const family = toArr(mh.familyHistory);
  const blood = mh.bloodGroup || user.bloodGroup || '';
  const hasHistory = conditions.length || meds.length || allergies.length || symptoms.length || lifestyle.length || family.length || blood;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#334155] text-left antialiased">

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#0f172a] text-white text-xs font-semibold px-4.5 py-3 rounded-[12px] shadow-2xl z-50 flex items-center gap-2.5 border border-white/10">
          <CheckCircle className="h-4.5 w-4.5 text-[#10B981]" />
          {toastMessage}
        </div>
      )}

      {/* ── HERO HEADER: Deep Mesh Gradient ── */}
      <div className="bg-gradient-to-br from-[#062421] via-[#0b3c37] to-[#115e59] pt-12 pb-28 px-4 relative overflow-hidden select-none">
        {/* Decorative background glows */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-[#14b8a6]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 w-96 h-48 bg-[#10b981]/5 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-10 w-48 h-48 bg-white/5 rounded-full" />

        <div className="max-w-[1100px] mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            
            {/* Glowing Avatar */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#86efac] to-[#14b8a6] rounded-[22px] blur-sm opacity-60 group-hover:opacity-100 transition duration-300" />
              <div className="relative w-20 h-20 rounded-[20px] bg-[#0b2b27] border border-white/20 flex items-center justify-center shadow-xl">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200">{initials}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-400 border-2 border-[#0b3c37] w-4.5 h-4.5 rounded-full flex items-center justify-center">
                <CheckCircle className="h-2.5 w-2.5 text-[#062421]" />
              </div>
            </div>

            {/* Identity Info */}
            <div className="flex-1 text-white space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-300">Aayu Health Locker</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white" style={{ color: '#ffffff' }}>{user.name}</h1>
              <p className="text-white/60 text-xs font-medium tracking-wide">
                {user.phone}
                {user.city ? ` · ${user.city}` : ''}
                {user.age ? ` · ${user.age}y` : ''}
                {user.gender ? ` · ${user.gender}` : ''}
              </p>
            </div>

            {/* Glowing Stats Grid */}
            <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] px-5 py-2.5 text-white text-center shadow-lg">
                <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Trust Score</p>
                <p className="text-xl font-black text-emerald-400 mt-0.5">{user.trustScore ?? 100}%</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] px-5 py-2.5 text-white text-center shadow-lg">
                <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Total Visits</p>
                <p className="text-xl font-black text-white mt-0.5">{user.totalVisits ?? 0}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="max-w-[1100px] mx-auto px-4 -mt-12 pb-20 relative z-10">

        {/* Premium Pill Tab Bar */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1.5 flex gap-1 mb-8">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-[12px] text-xs font-bold transition-all duration-200 cursor-pointer ${
                  active 
                    ? 'bg-[#115e59] text-white shadow-md shadow-teal-900/10' 
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0f172a]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Health Summary Box */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] mb-5">Health Summary</p>
                  <div className="space-y-4">
                    {[
                      { label: 'Blood Group', val: blood || '—', color: 'text-red-500 font-extrabold text-sm' },
                      { label: 'Chronic Conditions', val: conditions.length ? `${conditions.length} recorded` : 'None' },
                      { label: 'Active Medications', val: meds.length ? `${meds.length} active` : 'None' },
                      { label: 'Known Allergies', val: allergies.length ? `${allergies.length} noted` : 'None' },
                      { label: 'Completed Visits', val: user.totalVisits ?? 0 },
                      { label: 'Recorded No-shows', val: user.totalNoShows ?? 0 },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="flex justify-between items-center text-xs pb-3 border-b border-[#F1F5F9] last:border-0 last:pb-0">
                        <span className="text-[#64748B] font-medium">{label}</span>
                        <span className={`font-semibold text-[#0F172A] ${color || ''}`}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
                  <div className="flex justify-between text-[10px] mb-2">
                    <span className="font-bold uppercase tracking-wider text-[#94A3B8]">Trust Score</span>
                    <span className="font-black text-[#115e59]">{user.trustScore ?? 100}%</span>
                  </div>
                  <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#14b8a6] to-[#115e59] transition-all rounded-full" 
                      style={{ width: `${user.trustScore ?? 100}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {hasHistory && (
                <button
                  onClick={() => setActiveTab('history')}
                  className="w-full py-3.5 bg-gradient-to-r from-[#115e59] to-[#0f766e] text-white rounded-[14px] text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-900/10 hover:brightness-110 transition-all cursor-pointer"
                >
                  <FileHeart className="h-4.5 w-4.5" />
                  View Medical History
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full py-3 bg-white border border-red-200 hover:bg-red-50/50 text-red-600 rounded-[14px] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
                Log out from account
              </button>
            </div>

            {/* Right Column: Personal Info & Caretaker */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Personal Info Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#F1F5F9]">
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2.5">
                    <User className="h-4.5 w-4.5 text-[#115e59]" /> Personal Information
                  </h3>
                  {!isEditingInfo && (
                    <button 
                      onClick={() => setIsEditingInfo(true)} 
                      className="text-xs font-bold text-[#115e59] hover:text-[#0f766e] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                </div>

                {isEditingInfo ? (
                  <form onSubmit={handleSaveInfo} className="space-y-5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Full Name *', key: 'name', val: editName, set: setEditName, err: infoErrors.name },
                        { label: 'Email', key: 'email', val: editEmail, set: setEditEmail, err: infoErrors.email, placeholder: 'email@example.com' },
                        { label: 'Age *', key: 'age', val: editAge, set: setEditAge, err: infoErrors.age, type: 'number' },
                        { label: 'City', key: 'city', val: editCity, set: setEditCity },
                      ].map(f => (
                        <div key={f.key} className="space-y-1.5">
                          <label className="block text-[#64748B] font-bold text-[9px] uppercase tracking-wider">{f.label}</label>
                          <input
                            type={f.type || 'text'}
                            value={f.val}
                            onChange={e => f.set(e.target.value)}
                            placeholder={f.placeholder}
                            className={`w-full px-4 py-2.5 border rounded-[12px] focus:outline-none focus:border-[#115e59] focus:bg-[#FAFBFC] transition-all font-semibold text-xs ${f.err ? 'border-red-500 bg-red-50/10' : 'border-[#E2E8F0]'}`}
                          />
                          {f.err && <p className="text-red-500 text-[10px] mt-1 font-semibold">{f.err}</p>}
                        </div>
                      ))}
                      <div className="space-y-1.5">
                        <label className="block text-[#64748B] font-bold text-[9px] uppercase tracking-wider">Gender</label>
                        <select value={editGender} onChange={e => setEditGender(e.target.value)} className="w-full px-4 py-2.5 border border-[#E2E8F0] bg-white rounded-[12px] focus:outline-none focus:border-[#115e59] text-xs font-semibold">
                          <option>Female</option><option>Male</option><option>Other</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[#64748B] font-bold text-[9px] uppercase tracking-wider">Blood Group</label>
                        <select value={editBloodGroup} onChange={e => setEditBloodGroup(e.target.value)} className="w-full px-4 py-2.5 border border-[#E2E8F0] bg-white rounded-[12px] focus:outline-none focus:border-[#115e59] text-xs font-semibold">
                          <option value="">Select</option>
                          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-[#F1F5F9] mt-3">
                      <button type="button" onClick={handleCancelInfo} className="px-4.5 py-2 border border-[#E2E8F0] text-[#475569] rounded-[10px] hover:bg-[#F8FAFC] font-semibold text-xs cursor-pointer">Cancel</button>
                      <button type="submit" disabled={infoSaving} className="px-5 py-2 bg-[#115e59] hover:bg-[#0f766e] text-white font-bold rounded-[10px] text-xs flex items-center gap-1.5 cursor-pointer">
                        {infoSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {[
                      { icon: User,     label: 'Full Name',   val: user.name || '—' },
                      { icon: Mail,     label: 'Email',        val: user.email || '—' },
                      { icon: Phone,    label: 'Phone',        val: user.phone || '—' },
                      { icon: Calendar, label: 'Age & Gender', val: `${user.age ? user.age + 'y' : '—'} · ${user.gender || '—'}` },
                      { icon: MapPin,   label: 'City',         val: user.city || '—' },
                      { icon: Droplets, label: 'Blood Group',  val: blood || '—' },
                    ].map(({ icon: Ic, label, val }) => (
                      <div key={label} className="flex items-center gap-4 bg-[#F8FAFC] border border-[#F1F5F9] p-4 rounded-[14px]">
                        <div className="p-2.5 bg-[#eff6ff] rounded-[10px] shrink-0">
                          <Ic className="h-4.5 w-4.5 text-[#2563eb]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8.5px] uppercase tracking-wider text-[#94A3B8] font-bold">{label}</p>
                          <p className="font-bold text-[#1e293b] mt-0.5 text-xs truncate">{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Family Contact Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#F1F5F9]">
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2.5">
                    <Users className="h-4.5 w-4.5 text-[#115e59]" /> Family Caretaker
                  </h3>
                  {!isEditingFamily && hasFamilyContact && (
                    <div className="flex gap-3 text-xs">
                      <button onClick={() => setIsEditingFamily(true)} className="text-[#115e59] font-bold hover:text-[#0f766e] flex items-center gap-1 cursor-pointer"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={handleRemoveFamily} className="text-red-500 font-bold hover:text-red-700 flex items-center gap-1 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                    </div>
                  )}
                </div>
                
                {isEditingFamily ? (
                  <div className="space-y-5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: 'Name *', key: 'name', placeholder: 'Caretaker Name' },
                        { label: 'Mobile *', key: 'phone', placeholder: 'Mobile Number' },
                      ].map(f => (
                        <div key={f.key} className="space-y-1.5">
                          <label className="block text-[#64748B] font-bold text-[9px] uppercase tracking-wider">{f.label}</label>
                          <input
                            value={familyFields[f.key]}
                            onChange={e => setFamilyFields({ ...familyFields, [f.key]: e.target.value })}
                            placeholder={f.placeholder}
                            className={`w-full px-4 py-2.5 border rounded-[12px] focus:outline-none focus:border-[#115e59] focus:bg-[#FAFBFC] font-semibold text-xs ${familyErrors[f.key] ? 'border-red-500 bg-red-50/10' : 'border-[#E2E8F0]'}`}
                          />
                          {familyErrors[f.key] && <p className="text-red-500 text-[10px] mt-1 font-semibold">{familyErrors[f.key]}</p>}
                        </div>
                      ))}
                      <div className="space-y-1.5">
                        <label className="block text-[#64748B] font-bold text-[9px] uppercase tracking-wider">Relation</label>
                        <select value={familyFields.relation} onChange={e => setFamilyFields({ ...familyFields, relation: e.target.value })} className="w-full px-4 py-2.5 border border-[#E2E8F0] bg-white rounded-[12px] focus:outline-none focus:border-[#115e59] text-xs font-semibold">
                          {['Son/Daughter','Spouse','Sibling','Caretaker','Other'].map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-[#F1F5F9]">
                      <button onClick={() => { setIsEditingFamily(false); setFamilyErrors({}); }} className="px-4.5 py-2 border border-[#E2E8F0] text-[#475569] rounded-[10px] hover:bg-[#F8FAFC] font-semibold text-xs cursor-pointer">Cancel</button>
                      <button onClick={handleSaveFamily} disabled={familySaving} className="px-5 py-2 bg-[#115e59] hover:bg-[#0f766e] text-white rounded-[10px] font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                        {familySaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Contact'}
                      </button>
                    </div>
                  </div>
                ) : hasFamilyContact ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { icon: User,  label: 'Name',     val: user.familyContactName },
                      { icon: Phone, label: 'Mobile',   val: user.familyContactPhone },
                      { icon: Heart, label: 'Relation', val: user.familyContactRelation },
                    ].map(({ icon: Ic, label, val }) => (
                      <div key={label} className="flex items-center gap-4 bg-[#F8FAFC] border border-[#F1F5F9] p-4 rounded-[14px]">
                        <div className="p-2.5 bg-[#f0fdf4] rounded-[10px] shrink-0">
                          <Ic className="h-4.5 w-4.5 text-[#16a34a]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8.5px] uppercase tracking-wider text-[#94A3B8] font-bold">{label}</p>
                          <p className="font-bold text-[#1e293b] text-xs mt-0.5">{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-[#E2E8F0] rounded-[14px] bg-[#F8FAFC]">
                    <Users className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
                    <p className="text-xs text-[#64748B] font-medium">No caretaker linked yet</p>
                    <button onClick={() => setIsEditingFamily(true)} className="mt-4 inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#115e59] hover:bg-[#0f766e] text-white rounded-[12px] font-bold text-xs shadow-sm hover:shadow-teal-900/5 transition-all cursor-pointer">
                      <Plus className="h-4.5 w-4.5" /> Add Contact
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: MEDICAL HISTORY ── */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            
            {/* Header profile status */}
            <div className="bg-gradient-to-r from-[#062421] to-[#0f3c38] rounded-[18px] p-6 flex items-center gap-5 text-white shadow-md relative overflow-hidden select-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-400/25 rounded-[14px] flex items-center justify-center shrink-0">
                <FileHeart className="h-6 w-6 text-emerald-300" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-emerald-300" />
                  <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-300">Aayu AI · ABDM Clinical Profile</span>
                </div>
                <h2 className="text-base font-extrabold tracking-tight">Your Medical History</h2>
                <p className="text-white/60 text-[11px] font-medium">Shared securely with your attending consultant during appointments</p>
              </div>
              <div className="ml-auto text-right shrink-0">
                <div className="text-[8px] text-white/40 uppercase tracking-widest font-black">Sync Status</div>
                <div className="flex items-center gap-1.5 mt-1 bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-wide">Verified</span>
                </div>
              </div>
            </div>

            {!hasHistory ? (
              <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-16 text-center shadow-sm">
                <ClipboardList className="h-12 w-12 text-[#D1D5DB] mx-auto mb-4" />
                <h3 className="text-sm font-bold text-[#374151]">No Medical History Recorded</h3>
                <p className="text-xs text-[#9CA3AF] mt-1">Complete your onboarding questionnaire to populate your health profile.</p>
              </div>
            ) : (
              <>
                {/* Blood Group */}
                {blood && (
                  <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 flex items-center gap-5 shadow-sm">
                    <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-[14px] flex items-center justify-center shrink-0">
                      <Droplets className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">Blood Group</p>
                      <p className="text-2xl font-black text-red-600 mt-0.5">{blood}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Critical Info</span>
                    </div>
                  </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <HistoryCard icon={Stethoscope} label="Chronic Conditions" iconColor="text-purple-600" iconBg="bg-purple-50" isEmpty={!conditions.length}>
                    {conditions.map(c => <HistoryChip key={c} label={c} color="purple" />)}
                  </HistoryCard>
                  <HistoryCard icon={Pill} label="Current Medications" iconColor="text-blue-600" iconBg="bg-blue-50" isEmpty={!meds.length}>
                    {meds.map(m => <HistoryChip key={m} label={m} color="blue" />)}
                  </HistoryCard>
                  <HistoryCard icon={AlertCircle} label="Allergies" iconColor="text-red-600" iconBg="bg-red-50" isEmpty={!allergies.length}>
                    {allergies.map(a => <HistoryChip key={a} label={a} color="red" />)}
                  </HistoryCard>
                  <HistoryCard icon={Zap} label="Current Symptoms" iconColor="text-amber-600" iconBg="bg-amber-50" isEmpty={!symptoms.length}>
                    {symptoms.map(s => <HistoryChip key={s} label={s} color="amber" />)}
                  </HistoryCard>
                  <HistoryCard icon={Wind} label="Lifestyle Factors" iconColor="text-teal-600" iconBg="bg-teal-50" isEmpty={!lifestyle.length}>
                    {lifestyle.map(l => <HistoryChip key={l} label={l} color="green" />)}
                  </HistoryCard>
                  <HistoryCard icon={TreePine} label="Family History" iconColor="text-slate-600" iconBg="bg-slate-100" isEmpty={!family.length}>
                    {family.map(f => <HistoryChip key={f} label={f} color="slate" />)}
                  </HistoryCard>
                </div>

                {/* Encryption disclaimer card - High Contrast Clean Styling */}
                <div className="flex items-start gap-3 bg-[#0f172a] border border-[#1e293b] rounded-[16px] p-5 shadow-sm text-xs text-white">
                  <Lock className="h-5 w-5 shrink-0 text-[#2dd4bf] mt-0.5" />
                  <div className="space-y-0.5 text-left">
                    <span className="text-[10px] font-bold text-[#2dd4bf] uppercase tracking-wider block">End-to-End Cryptographic Security</span>
                    <p className="text-white/70 leading-relaxed font-medium">This clinical profile is fully encrypted under ABDM standards and shared strictly with verified medical practitioners only during active consult sessions.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB: NOTIFICATIONS ── */}
        {activeTab === 'prefs' && (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2.5 mb-6 pb-4 border-b border-[#F1F5F9]">
              <Bell className="h-4.5 w-4.5 text-[#115e59]" /> Notification Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'whatsapp', icon: Phone,    title: 'WhatsApp Alerts',  desc: 'Real-time delay buffers and slot recovery notifications.' },
                { key: 'sms',      icon: Bell,     title: 'Standard SMS',      desc: 'Carrier network text nudges directly to your device.' },
                { key: 'voiceCall',icon: Activity, title: 'IVR Call Nudges',   desc: 'Automated audio calls for priority booking confirmations.' },
                { key: 'email',    icon: Mail,     title: 'Email Digests',     desc: 'Weekly wellness analytics, receipts, and prescription copies.' },
              ].map(item => {
                const Ic = item.icon;
                const checked = prefs[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => handleTogglePreference(item.key, checked)}
                    className={`flex items-start justify-between gap-4 border rounded-[14px] p-4.5 cursor-pointer transition-all duration-200 select-none ${
                      checked ? 'border-[#115e59] bg-[#f0fdfa]/50 shadow-sm' : 'border-[#E2E8F0] bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-[10px] shrink-0 transition-colors ${checked ? 'bg-[#115e59] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                        <Ic className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-[#0F172A]">{item.title}</h4>
                        <p className="text-[10px] text-[#64748B] mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                    <div className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${checked ? 'bg-[#115e59]' : 'bg-[#CBD5E1]'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB: ABHA / ID ── */}
        {activeTab === 'abha' && (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2.5 mb-6 pb-4 border-b border-[#F1F5F9]">
              <Shield className="h-4.5 w-4.5 text-[#115e59]" /> Ayushman Bharat Digital Health ID (ABHA)
            </h3>
            {user.abhaId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="relative w-full aspect-[1.586/1] rounded-[18px] bg-gradient-to-tr from-[#0b1329] via-[#1e293b] to-[#0f172a] text-white p-6 border border-[#334155] overflow-hidden flex flex-col justify-between shadow-xl">
                  {/* Decorative glowing gradient ring inside health card */}
                  <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#2dd4bf]/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-[#2DD4BF]" />
                        <span className="text-[8px] font-black tracking-widest uppercase text-[#94A3B8]">ABDM Health ID</span>
                      </div>
                      <h4 className="text-[10px] font-black text-[#E2E8F0] mt-1.5 uppercase tracking-wide">Ayushman Bharat Digital Health</h4>
                    </div>
                    <QrCode className="h-9 w-9 text-white/90" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[7.5px] text-[#64748B] uppercase tracking-widest font-black">Health Address / ID</p>
                    <p className="font-mono text-base font-black tracking-widest text-[#2DD4BF] mt-1">{user.abhaId}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
                    <div>
                      <p className="text-[7.5px] text-[#64748B] uppercase tracking-widest font-black">Card Holder</p>
                      <p className="text-xs font-black text-white mt-1 truncate max-w-[200px]">{user.name}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-[#134E4A] border border-[#0F766E] px-3 py-0.5 rounded-full">
                      <span className="text-[7.5px] font-black text-[#2DD4BF] uppercase tracking-widest">Verified</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-5 text-left">
                  <div className="flex items-start gap-3 bg-[#f0fdf4] border border-[#bbf7d0] p-4.5 rounded-[14px]">
                    <CheckCircle className="h-5 w-5 text-[#16a34a] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#1e293b]">Successfully Sync-Linked</h4>
                      <p className="text-[10px] text-[#64748B] mt-1.5 leading-relaxed font-medium">Your medical profile cards are locked under central Ayushman Bharat credentials and sync automatically.</p>
                    </div>
                  </div>
                  <button onClick={handleUnlinkAbha} disabled={abhaSaving} className="px-4.5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50/50 rounded-[12px] font-bold text-xs transition-colors cursor-pointer">
                    {abhaSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Unlink Health Card'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-left">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] p-4.5 flex items-start gap-3">
                  <Shield className="h-5 w-5 text-[#115e59] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">What is Ayushman Bharat ABHA?</h4>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-relaxed font-medium">Ayushman Bharat Health Account (ABHA) digitizes clinical registries. It links all your lab prescriptions, report files, and doctor visits into a unified health card.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1.5 text-[9px] uppercase tracking-wider">Link ABHA Address / Card Number</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={abhaInput}
                        onChange={e => { setAbhaInput(e.target.value.replace(/[^0-9a-zA-Z-@]/g, '').substring(0, 24)); setAbhaError(''); }}
                        placeholder="XX-XXXX-XXXX-XXXX"
                        className={`w-full pl-4 pr-10 py-3 border rounded-[12px] focus:outline-none focus:border-[#115e59] focus:bg-[#FAFBFC] font-mono tracking-widest text-sm ${abhaError ? 'border-red-500 bg-red-50/5' : 'border-[#E2E8F0]'}`}
                      />
                      <Lock className="absolute right-4.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    </div>
                    <button onClick={handleLinkAbha} disabled={abhaSaving} className="px-5 py-3 bg-[#115e59] hover:bg-[#0f766e] text-white rounded-[12px] font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-teal-900/10">
                      {abhaSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Link ABHA'}
                    </button>
                  </div>
                  {abhaError && <p className="text-red-500 text-[10px] mt-2 font-bold">{abhaError}</p>}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
