import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Bell, 
  Users, 
  Shield, 
  LogOut, 
  CheckCircle, 
  X, 
  Edit2, 
  Trash2, 
  Plus, 
  Loader2,
  Calendar,
  MapPin,
  Heart,
  Activity,
  QrCode,
  Lock
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { useAuth } from '../hooks/useAuth';

export default function PatientProfile() {
  const navigate = useNavigate();
  const { user, updateMockSession, signOutUser } = useAuth();

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');

  // Personal Info Edit states
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('');
  const [infoErrors, setInfoErrors] = useState({});
  const [infoSaving, setInfoSaving] = useState(false);

  // Family Contacts states
  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [familyFields, setFamilyFields] = useState({ name: '', phone: '', relation: 'Son/Daughter' });
  const [familyErrors, setFamilyErrors] = useState({});
  const [familySaving, setFamilySaving] = useState(false);

  // ABHA ID states
  const [abhaInput, setAbhaInput] = useState('');
  const [abhaSaving, setAbhaSaving] = useState(false);
  const [abhaError, setAbhaError] = useState('');

  // Sync state values when user loads
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
        <Loader2 className="h-6 w-6 animate-spin text-primary-teal" />
      </div>
    );
  }

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // 1. Personal Info Save Handler
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setInfoErrors({});
    
    // Validations
    const errors = {};
    if (!editName.trim()) {
      errors.name = 'Name is required';
    }
    const ageNum = parseInt(editAge, 10);
    if (!editAge.trim() || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      errors.age = 'Age must be a number between 1 and 120';
    }
    if (editEmail.trim() && !/\S+@\S+\.\S+/.test(editEmail)) {
      errors.email = 'Invalid email address format';
    }

    if (Object.keys(errors).length > 0) {
      setInfoErrors(errors);
      return;
    }

    setInfoSaving(true);
    try {
      const patientRef = doc(db, COLLECTIONS.PATIENTS, user.uid);
      const updateData = {
        name: editName,
        email: editEmail,
        age: ageNum,
        gender: editGender,
        city: editCity,
        bloodGroup: editBloodGroup,
        updatedAt: serverTimestamp()
      };

      await updateDoc(patientRef, updateData);
      updateMockSession(updateData);
      setIsEditingInfo(false);
      triggerToast('Personal information updated');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save settings');
    } finally {
      setInfoSaving(false);
    }
  };

  const handleCancelInfo = () => {
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditAge(user.age?.toString() || '');
    setEditGender(user.gender || 'Female');
    setEditCity(user.city || '');
    setEditBloodGroup(user.bloodGroup || '');
    setInfoErrors({});
    setIsEditingInfo(false);
  };

  // 2. Reminder Preferences Toggle Handler
  const handleTogglePreference = async (prefKey, currentValue) => {
    try {
      const patientRef = doc(db, COLLECTIONS.PATIENTS, user.uid);
      const updatedPrefs = {
        ...(user.preferences || { whatsapp: true, sms: false, voiceCall: false, email: false }),
        [prefKey]: !currentValue
      };

      await updateDoc(patientRef, {
        preferences: updatedPrefs,
        updatedAt: serverTimestamp()
      });

      updateMockSession({ preferences: updatedPrefs });
      triggerToast('Preference updated');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to update preference');
    }
  };

  // 3. Family Contacts Handlers
  const handleSaveFamily = async () => {
    familyErrors({});
    const errors = {};
    if (!familyFields.name.trim()) errors.name = 'Caretaker name is required';
    if (!familyFields.phone.trim()) errors.phone = 'Caretaker phone is required';

    if (Object.keys(errors).length > 0) {
      setFamilyErrors(errors);
      return;
    }

    setFamilySaving(true);
    try {
      const patientRef = doc(db, COLLECTIONS.PATIENTS, user.uid);
      const updateData = {
        familyContactName: familyFields.name,
        familyContactPhone: familyFields.phone,
        familyContactRelation: familyFields.relation,
        updatedAt: serverTimestamp()
      };

      await updateDoc(patientRef, updateData);
      updateMockSession(updateData);
      setIsEditingFamily(false);
      triggerToast('Family contact saved');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save family contact');
    } finally {
      setFamilySaving(false);
    }
  };

  const handleRemoveFamily = async () => {
    if (!window.confirm("Remove family caretaker contact?")) return;
    setFamilySaving(true);
    try {
      const patientRef = doc(db, COLLECTIONS.PATIENTS, user.uid);
      const updateData = {
        familyContactName: '',
        familyContactPhone: '',
        familyContactRelation: '',
        updatedAt: serverTimestamp()
      };

      await updateDoc(patientRef, updateData);
      updateMockSession(updateData);
      setFamilyFields({ name: '', phone: '', relation: 'Son/Daughter' });
      setIsEditingFamily(false);
      triggerToast('Family contact removed');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to remove family contact');
    } finally {
      setFamilySaving(false);
    }
  };

  // 4. ABHA ID Link/Unlink Handlers
  const handleLinkAbha = async () => {
    setAbhaError('');
    if (!abhaInput.trim()) {
      setAbhaError('ABHA ID cannot be empty');
      return;
    }

    setAbhaSaving(true);
    try {
      const patientRef = doc(db, COLLECTIONS.PATIENTS, user.uid);
      await updateDoc(patientRef, {
        abhaId: abhaInput,
        updatedAt: serverTimestamp()
      });
      updateMockSession({ abhaId: abhaInput });
      triggerToast('ABHA ID linked');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to link ABHA ID');
    } finally {
      setAbhaSaving(false);
    }
  };

  const handleUnlinkAbha = async () => {
    if (!window.confirm("Unlink your ABHA health ID?")) return;
    setAbhaSaving(true);
    try {
      const patientRef = doc(db, COLLECTIONS.PATIENTS, user.uid);
      await updateDoc(patientRef, {
        abhaId: '',
        updatedAt: serverTimestamp()
      });
      updateMockSession({ abhaId: '' });
      setAbhaInput('');
      triggerToast('ABHA ID unlinked');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to unlink ABHA ID');
    } finally {
      setAbhaSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    navigate('/');
  };

  const initials = user.name?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || 'PS';
  const hasFamilyContact = !!(user.familyContactName && user.familyContactPhone);
  const prefs = user.preferences || { whatsapp: true, sms: false, voiceCall: false, email: false };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#f4f7f6] via-[#fafbfc] to-[#f9f8fd] py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-600 text-left">
      
      {/* Toast Notification Simulation */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#0f172a] text-white text-xs font-semibold px-4.5 py-3 rounded-2xl shadow-xl border border-slate-700/50 z-50 flex items-center space-x-2 animate-bounce-short">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-[1040px] mx-auto">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-left">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-primary-teal bg-primary-teal/10 border border-primary-teal/20 px-2 py-0.5 rounded-md uppercase tracking-widest">
                Apollo Health Locker
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <h1 className="font-display font-extrabold text-3xl text-slate-800 tracking-tight mt-1">
              Patient Settings
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your personal medical profile, ABHA ABDM linkage, and smart notifications.
            </p>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PROFILE CARD LEFT (4 cols, sticky) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6 self-start">
            <div className="glass-panel backdrop-blur-md bg-white/75 border border-white/80 rounded-3xl p-6.5 text-center shadow-[0_8px_32px_rgba(0,0,0,0.03)] relative overflow-hidden">
              {/* Decorative radial grid */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#0d9488 1.5px, transparent 1.5px)',
                  backgroundSize: '16px 16px'
                }}
              />
              
              {/* Avatar with glowing ring */}
              <div className="relative w-20 h-20 mx-auto mb-4 group select-none">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-indigo-500 animate-pulse opacity-20 blur-[3px]"></div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-indigo-500 p-[2.5px] transition-all duration-300 group-hover:scale-105">
                  <div className="w-full h-full rounded-[13px] bg-[#f8fafc] flex items-center justify-center font-display font-black text-2xl text-transparent bg-clip-text bg-gradient-to-tr from-[#0d9488] to-indigo-600">
                    {initials}
                  </div>
                </div>
              </div>
              
              <h2 className="text-base font-extrabold text-slate-800 font-display mt-2">{user.name}</h2>
              <p className="text-[11.5px] text-slate-400 font-bold tracking-wider mt-0.5">{user.phone}</p>

              <div className="border-t border-[#e2e8f0]/60 mt-5 pt-4.5 text-left space-y-3.5">
                {/* Vitals overview */}
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400 flex items-center space-x-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Completed Visits</span>
                  </span>
                  <span className="text-slate-700 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md font-mono">{user.totalVisits || 0}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400 flex items-center space-x-1.5">
                    <X className="h-3.5 w-3.5 text-red-400" />
                    <span>Total No-shows</span>
                  </span>
                  <span className="text-slate-700 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md font-mono">{user.totalNoShows || 0}</span>
                </div>
                
                {/* Trust Score */}
                <div className="space-y-2.5 pt-3.5 border-t border-[#e2e8f0]/60">
                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-display">
                    <span>Patient Trust Score</span>
                    <span className="text-primary-teal text-xs font-black">{user.trustScore ?? 100}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-[#0d9488] via-emerald-400 to-[#10b981] rounded-full shadow-[0_0_10px_rgba(20,184,166,0.25)] transition-all duration-500" 
                      style={{ width: `${user.trustScore ?? 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Earned by showing up on schedule. High scores get booking priority.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 bg-white/70 border border-red-200/50 hover:bg-red-50 hover:border-red-300 hover:text-red-600 text-red-500 rounded-2xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Log out from account</span>
            </button>
          </div>

          {/* SETTINGS RIGHT (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Section 1: Personal Info */}
            <div className="bg-white border border-[#e2e8f0]/60 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 mb-5 text-left">
                <h3 className="text-[14.5px] font-extrabold text-slate-800 flex items-center space-x-2">
                  <User className="h-4.5 w-4.5 text-primary-teal" />
                  <span>Personal Information</span>
                </h3>
                {!isEditingInfo && (
                  <button
                    onClick={() => setIsEditingInfo(true)}
                    className="text-xs font-bold text-primary-teal hover:text-primary-dark hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {isEditingInfo ? (
                <form onSubmit={handleSaveInfo} className="space-y-4.5 text-xs text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Full Name *</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 transition-all font-semibold ${
                          infoErrors.name ? 'border-red-500' : 'border-slate-200'
                        }`}
                      />
                      {infoErrors.name && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{infoErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Email Address</label>
                      <input
                        type="text"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 transition-all font-semibold ${
                          infoErrors.email ? 'border-red-500' : 'border-slate-200'
                        }`}
                        placeholder="email@example.com"
                      />
                      {infoErrors.email && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{infoErrors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Age *</label>
                      <input
                        type="number"
                        value={editAge}
                        onChange={(e) => setEditAge(e.target.value)}
                        className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 transition-all font-semibold ${
                          infoErrors.age ? 'border-red-500' : 'border-slate-200'
                        }`}
                      />
                      {infoErrors.age && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{infoErrors.age}</p>}
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Gender</label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 transition-all font-semibold"
                      >
                        <option>Female</option>
                        <option>Male</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[9px]">City</label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Blood Group</label>
                      <select
                        value={editBloodGroup}
                        onChange={(e) => setEditBloodGroup(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 transition-all font-semibold"
                      >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4.5 border-t border-slate-100 mt-4.5">
                    <button
                      type="button"
                      onClick={handleCancelInfo}
                      disabled={infoSaving}
                      className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 font-bold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={infoSaving}
                      className="px-5 py-2.5 bg-primary-teal hover:bg-primary-dark text-white font-extrabold rounded-xl flex items-center space-x-1.5 shadow shadow-primary-teal/20 transition-all cursor-pointer"
                    >
                      {infoSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
                  {/* Styled Fields Grid */}
                  <div className="flex items-center space-x-3.5 bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-2xl">
                    <div className="p-2 bg-teal-500/10 text-teal-600 rounded-xl shrink-0">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Full Name</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{user.name || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5 bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-2xl">
                    <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl shrink-0">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Email Address</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{user.email || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5 bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-2xl">
                    <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl shrink-0">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Age & Gender</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {user.age ? `${user.age} Years` : '—'} · {user.gender || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5 bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-2xl">
                    <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl shrink-0">
                      <MapPin className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">City & Blood Group</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {user.city || '—'} {user.bloodGroup ? `· ${user.bloodGroup}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Reminder Preferences */}
            <div className="bg-white border border-[#e2e8f0]/60 rounded-3xl p-6 shadow-sm text-left">
              <h3 className="text-[14.5px] font-extrabold text-slate-800 flex items-center space-x-2 pb-3.5 border-b border-slate-100 mb-5">
                <Bell className="h-4.5 w-4.5 text-primary-teal" />
                <span>Reminder Preferences</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'whatsapp', title: 'WhatsApp Alerts', desc: 'Real-time delay buffers and slot recovery notifications.', color: 'emerald', activeColor: 'bg-[#25D366]' },
                  { key: 'sms', title: 'Standard SMS', desc: 'Carrier network text nudges directly to your device.', color: 'indigo', activeColor: 'bg-indigo-600' },
                  { key: 'voiceCall', title: 'IVR Call Nudges', desc: 'Automated audio calls for priority booking confirmations.', color: 'amber', activeColor: 'bg-amber-500' },
                  { key: 'email', title: 'Email Digests', desc: 'Weekly wellness analytics, receipts, and digital prescription copies.', color: 'rose', activeColor: 'bg-rose-500' }
                ].map(item => {
                  const isChecked = prefs[item.key];
                  return (
                    <div 
                      key={item.key}
                      onClick={() => handleTogglePreference(item.key, isChecked)}
                      className={`border rounded-2xl p-4.5 flex items-start justify-between cursor-pointer transition-all duration-300 hover:border-slate-300 ${
                        isChecked 
                          ? 'border-slate-900 bg-slate-950 text-white shadow-md' 
                          : 'border-slate-150 bg-slate-50/20'
                      }`}
                    >
                      <div className="space-y-1 text-left pr-4">
                        <h4 className="text-xs font-bold">{item.title}</h4>
                        <p className={`text-[10px] leading-relaxed font-medium ${isChecked ? 'text-slate-400' : 'text-slate-400'}`}>
                          {item.desc}
                        </p>
                      </div>
                      
                      {/* iOS-Style Toggle Switch */}
                      <div className="shrink-0 pt-0.5">
                        <div
                          className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isChecked ? 'bg-primary-teal' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isChecked ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Family Contacts */}
            <div className="bg-white border border-[#e2e8f0]/60 rounded-3xl p-6 shadow-sm text-left">
              <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 mb-5">
                <h3 className="text-[14.5px] font-extrabold text-slate-800 flex items-center space-x-2">
                  <Users className="h-4.5 w-4.5 text-primary-teal" />
                  <span>Family Caretaker Contacts</span>
                </h3>
                
                {!isEditingFamily && hasFamilyContact && (
                  <div className="flex space-x-3 text-xs">
                    <button
                      onClick={() => setIsEditingFamily(true)}
                      className="font-bold text-primary-teal hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleRemoveFamily}
                      className="font-bold text-red-500 hover:text-red-700 flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>

              {isEditingFamily ? (
                <div className="space-y-4 text-xs text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Caretaker Name *</label>
                      <input
                        type="text"
                        value={familyFields.name}
                        onChange={(e) => setFamilyFields({ ...familyFields, name: e.target.value })}
                        className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 transition-all font-semibold ${
                          familyErrors.name ? 'border-red-500' : 'border-slate-200'
                        }`}
                        placeholder="Caretaker Name"
                      />
                      {familyErrors.name && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{familyErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Caretaker Mobile *</label>
                      <input
                        type="text"
                        value={familyFields.phone}
                        onChange={(e) => setFamilyFields({ ...familyFields, phone: e.target.value })}
                        className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 transition-all font-semibold ${
                          familyErrors.phone ? 'border-red-500' : 'border-slate-200'
                        }`}
                        placeholder="Mobile"
                      />
                      {familyErrors.phone && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{familyErrors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Relationship</label>
                      <select
                        value={familyFields.relation}
                        onChange={(e) => setFamilyFields({ ...familyFields, relation: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 transition-all font-semibold"
                      >
                        <option>Son/Daughter</option>
                        <option>Spouse</option>
                        <option>Sibling</option>
                        <option>Caretaker</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4.5 border-t border-slate-100 mt-4.5">
                    <button
                      onClick={() => {
                        setIsEditingFamily(false);
                        setFamilyErrors({});
                        setFamilyFields({
                          name: user.familyContactName || '',
                          phone: user.familyContactPhone || '',
                          relation: user.familyContactRelation || 'Son/Daughter'
                        });
                      }}
                      disabled={familySaving}
                      className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 font-bold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveFamily}
                      disabled={familySaving}
                      className="px-5 py-2.5 bg-primary-teal hover:bg-primary-dark text-white font-extrabold rounded-xl flex items-center space-x-1.5 shadow shadow-primary-teal/20 transition-all cursor-pointer"
                    >
                      {familySaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span>Save Contact</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : hasFamilyContact ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-left">
                  <div className="flex items-center space-x-3 bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-2xl">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Caretaker Name</p>
                      <p className="font-bold text-slate-800 mt-0.5">{user.familyContactName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-2xl">
                    <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Caretaker Mobile</p>
                      <p className="font-bold text-slate-800 mt-0.5">{user.familyContactPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-2xl">
                    <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl shrink-0">
                      <Heart className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Relationship</p>
                      <p className="font-bold text-slate-800 mt-0.5">{user.familyContactRelation}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                  <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No family caretaker contact linked yet.</p>
                  <button
                    type="button"
                    onClick={() => setIsEditingFamily(true)}
                    className="mt-3.5 inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-sm hover:shadow"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Caretaker Contact</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section 4: ABHA ID */}
            <div className="bg-white border border-[#e2e8f0]/60 rounded-3xl p-6 shadow-sm text-left">
              <h3 className="text-[14.5px] font-extrabold text-slate-800 flex items-center space-x-2 pb-3.5 border-b border-slate-100 mb-5">
                <Shield className="h-4.5 w-4.5 text-primary-teal" />
                <span>Ayushman Bharat Digital Health ID (ABHA)</span>
              </h3>

              {user.abhaId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Virtual ABHA Card Design */}
                  <div className="relative w-full max-w-[340px] aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-5 shadow-lg border border-slate-700/60 overflow-hidden flex flex-col justify-between select-none">
                    {/* Glowing effect inside card */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none"></div>

                    {/* Card Header */}
                    <div className="flex items-start justify-between relative z-10">
                      <div className="text-left">
                        <div className="flex items-center space-x-1">
                          <Activity className="h-4 w-4 text-teal-400" />
                          <span className="text-[8.5px] font-extrabold tracking-widest uppercase font-display text-slate-300">ABDM Health ID</span>
                        </div>
                        <h4 className="text-[10px] font-extrabold text-white mt-0.5 tracking-tight font-display">Ayushman Bharat Digital Health Card</h4>
                      </div>
                      <QrCode className="h-8 w-8 text-white opacity-90 shrink-0" />
                    </div>

                    {/* Card Body */}
                    <div className="text-left mt-3 relative z-10">
                      <p className="text-[7.5px] text-slate-400 uppercase tracking-widest font-extrabold">Health Address</p>
                      <p className="font-mono text-sm font-black tracking-widest text-teal-300 mt-0.5">{user.abhaId}</p>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-white/10 relative z-10">
                      <div className="text-left">
                        <p className="text-[7.5px] text-slate-400 uppercase tracking-widest font-extrabold">Card Holder</p>
                        <p className="text-[10.5px] font-bold text-slate-200 mt-0.5 truncate max-w-[180px]">{user.name}</p>
                      </div>
                      <div className="flex items-center space-x-1 bg-teal-500/20 border border-teal-500/35 px-2 py-0.5 rounded-full shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                        <span className="text-[8px] font-extrabold uppercase text-teal-300 tracking-wider">Verified</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-left">
                    <div className="flex items-start space-x-2">
                      <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Linked to Apollo Health Record Locker</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          Your digital health history is fully synchronized. Apollo updates your medical records automatically in the central ABDM registry.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleUnlinkAbha}
                      disabled={abhaSaving}
                      className="px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all text-xs cursor-pointer"
                    >
                      {abhaSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span>Unlink Health Card</span>
                      )}
                    </button>
                  </div>

                </div>
              ) : (
                <div className="space-y-4 text-xs text-left">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">What is ABDM Health ID?</h4>
                      <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                        The Ayushman Bharat Health Account (ABHA) address is a key to your digital healthcare journey. It securely holds all your lab reports, prescriptions, and health locker history across verified Indian hospitals.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[9px]">ABHA Address (14 Digits or username@abdm)</label>
                    <div className="flex gap-2.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={abhaInput}
                          onChange={(e) => {
                            setAbhaInput(e.target.value.replace(/[^0-9a-zA-Z-@]/g, '').substring(0, 24));
                            setAbhaError('');
                          }}
                          placeholder="XX-XXXX-XXXX-XXXX"
                          className={`w-full pl-3.5 pr-8 py-2.5 border rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 transition-all font-semibold font-mono tracking-widest ${
                            abhaError ? 'border-red-500' : 'border-slate-200'
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                          <Lock className="h-4 w-4" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLinkAbha}
                        disabled={abhaSaving}
                        className="px-5 py-2.5 bg-primary-teal hover:bg-primary-dark text-white rounded-xl font-extrabold transition-all shrink-0 flex items-center justify-center min-w-[90px] shadow-sm cursor-pointer"
                      >
                        {abhaSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span>Link ABHA</span>
                        )}
                      </button>
                    </div>
                    {abhaError && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{abhaError}</p>}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
