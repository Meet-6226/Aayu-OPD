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
  Loader2 
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
    setFamilyErrors({});
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
    <div className="max-w-[900px] mx-auto px-5 py-8 bg-transparent font-sans text-text-medium">
      
      {/* Toast Notification Simulation */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-text-dark text-white text-xs font-semibold px-4.5 py-3 rounded-xl shadow-lg border border-gray-700/50 z-50 flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-[#10b981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 text-left">
        <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-text-dark tracking-tight">
          Patient Settings
        </h1>
        <p className="text-sm text-text-light mt-1.5">
          Manage your personal medical information, Abha ABDM linkage, and smart WhatsApp notifications.
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PROFILE CARD LEFT (1 col, sticky) */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24 self-start">
          <div className="glass-panel border border-white/60 rounded-2xl p-6 text-center shadow-lg glow-shadow-teal">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-light-teal to-teal-50 border border-primary-teal/10 flex items-center justify-center mx-auto mb-4 shrink-0 shadow-inner">
              <span className="text-xl font-bold text-primary-teal font-display">{initials}</span>
            </div>
            
            <h2 className="text-[15.5px] font-bold text-text-dark font-display">{user.name}</h2>
            <p className="text-xs text-text-light mt-0.5 font-medium">{user.phone}</p>

            <div className="border-t border-[#e5e7eb]/45 mt-5 pt-4.5 text-left space-y-4">
              {/* Vitals overview */}
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-text-light">Completed visits</span>
                <span className="text-text-dark bg-[#f3f4f6] px-2 py-0.5 rounded-md">{user.totalVisits || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-text-light">Total No-shows</span>
                <span className="text-text-dark bg-[#f3f4f6] px-2 py-0.5 rounded-md">{user.totalNoShows || 0}</span>
              </div>
              
              {/* Trust Score */}
              <div className="space-y-2 pt-3 border-t border-[#e5e7eb]/45">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-light font-display">
                  <span>Patient Trust Score</span>
                  <span className="text-primary-teal text-xs font-extrabold">{user.trustScore ?? 100}%</span>
                </div>
                <div className="w-full h-2 bg-[#e5e7eb]/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-teal to-[#10b981] rounded-full transition-all duration-300" 
                    style={{ width: `${user.trustScore ?? 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-text-light leading-relaxed">
                  Earned by showing up on schedule. High scores get booking priority.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 bg-white/70 border border-red-200/50 hover:bg-red-50 hover:border-red-300 text-red-500 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Log out from account</span>
          </button>
        </div>

        {/* SETTINGS RIGHT */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Personal Info */}
          <div className="bg-white border border-border-custom rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f4f6]">
              <h3 className="text-sm font-semibold text-text-dark flex items-center space-x-2">
                <User className="h-4 w-4 text-primary-teal" />
                <span>Personal Information</span>
              </h3>
              {!isEditingInfo && (
                <button
                  onClick={() => setIsEditingInfo(true)}
                  className="text-xs font-semibold text-primary-teal hover:underline flex items-center space-x-1"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {isEditingInfo ? (
              <form onSubmit={handleSaveInfo} className="space-y-4 text-xs text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-light font-semibold mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary-teal ${
                        infoErrors.name ? 'border-red-500' : 'border-border-custom'
                      }`}
                    />
                    {infoErrors.name && <p className="text-red-500 text-[10px] mt-1">{infoErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-text-light font-semibold mb-1">Email Address</label>
                    <input
                      type="text"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary-teal ${
                        infoErrors.email ? 'border-red-500' : 'border-border-custom'
                      }`}
                      placeholder="email@example.com"
                    />
                    {infoErrors.email && <p className="text-red-500 text-[10px] mt-1">{infoErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-text-light font-semibold mb-1">Age *</label>
                    <input
                      type="number"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary-teal ${
                        infoErrors.age ? 'border-red-500' : 'border-border-custom'
                      }`}
                    />
                    {infoErrors.age && <p className="text-red-500 text-[10px] mt-1">{infoErrors.age}</p>}
                  </div>
                  <div>
                    <label className="block text-text-light font-semibold mb-1">Gender</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full px-3 py-2 border border-border-custom bg-white rounded-lg focus:outline-none focus:border-primary-teal"
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-text-light font-semibold mb-1">City</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 border border-border-custom rounded-lg focus:outline-none focus:border-primary-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-text-light font-semibold mb-1">Blood Group</label>
                    <select
                      value={editBloodGroup}
                      onChange={(e) => setEditBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 border border-border-custom bg-white rounded-lg focus:outline-none focus:border-primary-teal"
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

                <div className="flex justify-end space-x-2 pt-3 border-t border-[#f3f4f6]">
                  <button
                    type="button"
                    onClick={handleCancelInfo}
                    disabled={infoSaving}
                    className="px-4 py-2 border border-border-custom text-text-medium rounded-lg hover:bg-bg-subtle"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={infoSaving}
                    className="px-4 py-2 bg-primary-teal text-white font-semibold rounded-lg hover:bg-primary-dark flex items-center space-x-1"
                  >
                    {infoSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs text-left">
                <div>
                  <p className="text-text-light font-semibold mb-0.5">Full Name</p>
                  <p className="font-medium text-text-dark">{user.name || '—'}</p>
                </div>
                <div>
                  <p className="text-text-light font-semibold mb-0.5">Email Address</p>
                  <p className="font-medium text-text-dark">{user.email || '—'}</p>
                </div>
                <div>
                  <p className="text-text-light font-semibold mb-0.5">Age & Gender</p>
                  <p className="font-medium text-text-dark">{user.age ? `${user.age} yrs` : '—'} · {user.gender || '—'}</p>
                </div>
                <div>
                  <p className="text-text-light font-semibold mb-0.5">City & Blood Group</p>
                  <p className="font-medium text-text-dark">{user.city || '—'} {user.bloodGroup ? `· ${user.bloodGroup}` : ''}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Reminder Preferences */}
          <div className="bg-white border border-border-custom rounded-2xl p-5 space-y-4 text-left">
            <h3 className="text-sm font-semibold text-text-dark flex items-center space-x-2 pb-2 border-b border-[#f3f4f6]">
              <Bell className="h-4 w-4 text-primary-teal" />
              <span>Reminder Preferences</span>
            </h3>

            <div className="space-y-4">
              {/* WhatsApp Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-text-dark">WhatsApp Alerts</h4>
                  <p className="text-[10px] text-text-light">Get slot recovery updates and notifications directly on WhatsApp.</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.whatsapp}
                  onChange={() => handleTogglePreference('whatsapp', prefs.whatsapp)}
                  className="h-4 w-4 text-primary-teal border-border-custom rounded focus:ring-primary-teal cursor-pointer"
                />
              </div>

              {/* SMS Toggle */}
              <div className="flex items-center justify-between border-t border-[#f3f4f6] pt-3.5">
                <div>
                  <h4 className="text-xs font-semibold text-text-dark">Standard SMS Reminders</h4>
                  <p className="text-[10px] text-text-light">Carrier standard SMS updates.</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.sms}
                  onChange={() => handleTogglePreference('sms', prefs.sms)}
                  className="h-4 w-4 text-primary-teal border-border-custom rounded focus:ring-primary-teal cursor-pointer"
                />
              </div>

              {/* Voice Call Toggle */}
              <div className="flex items-center justify-between border-t border-[#f3f4f6] pt-3.5">
                <div>
                  <h4 className="text-xs font-semibold text-text-dark">IVR Call Nudges</h4>
                  <p className="text-[10px] text-text-light">Get automated calls for quick confirmation updates.</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.voiceCall}
                  onChange={() => handleTogglePreference('voiceCall', prefs.voiceCall)}
                  className="h-4 w-4 text-primary-teal border-border-custom rounded focus:ring-primary-teal cursor-pointer"
                />
              </div>

              {/* Email Toggle */}
              <div className="flex items-center justify-between border-t border-[#f3f4f6] pt-3.5">
                <div>
                  <h4 className="text-xs font-semibold text-text-dark">Email Digests</h4>
                  <p className="text-[10px] text-text-light">Weekly wellness reports and prescriptions copies.</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.email}
                  onChange={() => handleTogglePreference('email', prefs.email)}
                  className="h-4 w-4 text-primary-teal border-border-custom rounded focus:ring-primary-teal cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Family Contacts */}
          <div className="bg-white border border-border-custom rounded-2xl p-5 space-y-4 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f4f6]">
              <h3 className="text-sm font-semibold text-text-dark flex items-center space-x-2">
                <Users className="h-4 w-4 text-primary-teal" />
                <span>Family Caretaker Contacts</span>
              </h3>
              
              {!isEditingFamily && hasFamilyContact && (
                <div className="flex space-x-3 text-xs">
                  <button
                    onClick={() => setIsEditingFamily(true)}
                    className="font-semibold text-primary-teal hover:underline flex items-center space-x-1"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleRemoveFamily}
                    className="font-semibold text-red-500 hover:text-red-700 flex items-center space-x-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>

            {isEditingFamily ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-text-light font-semibold mb-1">Caretaker Name *</label>
                    <input
                      type="text"
                      value={familyFields.name}
                      onChange={(e) => setFamilyFields({ ...familyFields, name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary-teal ${
                        familyErrors.name ? 'border-red-500' : 'border-border-custom'
                      }`}
                      placeholder="Caretaker Name"
                    />
                    {familyErrors.name && <p className="text-red-500 text-[10px] mt-1">{familyErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-text-light font-semibold mb-1">Caretaker Mobile *</label>
                    <input
                      type="text"
                      value={familyFields.phone}
                      onChange={(e) => setFamilyFields({ ...familyFields, phone: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary-teal ${
                        familyErrors.phone ? 'border-red-500' : 'border-border-custom'
                      }`}
                      placeholder="Mobile"
                    />
                    {familyErrors.phone && <p className="text-red-500 text-[10px] mt-1">{familyErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-text-light font-semibold mb-1">Relationship</label>
                    <select
                      value={familyFields.relation}
                      onChange={(e) => setFamilyFields({ ...familyFields, relation: e.target.value })}
                      className="w-full px-3 py-2 border border-border-custom bg-white rounded-lg focus:outline-none focus:border-primary-teal"
                    >
                      <option>Son/Daughter</option>
                      <option>Spouse</option>
                      <option>Sibling</option>
                      <option>Caretaker</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-[#f3f4f6]">
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
                    className="px-4 py-2 border border-border-custom text-text-medium rounded-lg hover:bg-bg-subtle"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveFamily}
                    disabled={familySaving}
                    className="px-4 py-2 bg-primary-teal text-white font-semibold rounded-lg hover:bg-primary-dark flex items-center space-x-1"
                  >
                    {familySaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span>Save Contact</span>
                    )}
                  </button>
                </div>
              </div>
            ) : hasFamilyContact ? (
              <div className="grid grid-cols-3 gap-4 text-xs text-left">
                <div>
                  <p className="text-text-light font-semibold mb-0.5">Caretaker Name</p>
                  <p className="font-semibold text-text-dark">{user.familyContactName}</p>
                </div>
                <div>
                  <p className="text-text-light font-semibold mb-0.5">Caretaker Mobile</p>
                  <p className="font-semibold text-text-dark">{user.familyContactPhone}</p>
                </div>
                <div>
                  <p className="text-text-light font-semibold mb-0.5">Relationship</p>
                  <p className="font-semibold text-text-dark">{user.familyContactRelation}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs border border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb]">
                <p className="text-text-light">No family caretaker contact linked yet.</p>
                <button
                  type="button"
                  onClick={() => setIsEditingFamily(true)}
                  className="mt-3 inline-flex items-center space-x-1 px-3.5 py-2 bg-white border border-border-custom hover:border-primary-teal rounded-lg font-semibold text-primary-teal transition-all text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add family contact</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 4: ABHA ID */}
          <div className="bg-white border border-border-custom rounded-2xl p-5 space-y-4 text-left">
            <h3 className="text-sm font-semibold text-text-dark flex items-center space-x-2 pb-2 border-b border-[#f3f4f6]">
              <Shield className="h-4 w-4 text-primary-teal" />
              <span>Ayushman Bharat Digital Health ID (ABHA)</span>
            </h3>

            {user.abhaId ? (
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-text-light font-semibold mb-0.5">ABHA Health Address</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-mono text-sm font-bold text-text-dark tracking-wider">{user.abhaId}</span>
                    <span className="inline-flex items-center px-2 py-0.5 bg-mint-green text-primary-teal text-[10px] font-semibold rounded-full border border-primary-teal/10">
                      Linked
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleUnlinkAbha}
                  disabled={abhaSaving}
                  className="px-3.5 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg font-semibold transition-all"
                >
                  {abhaSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Unlink ID</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-text-light font-semibold mb-1">ABHA Health Address (14 Digits)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={abhaInput}
                      onChange={(e) => {
                        setAbhaInput(e.target.value.replace(/[^0-9-]/g, '').substring(0, 19));
                        setAbhaError('');
                      }}
                      placeholder="XX-XXXX-XXXX-XXXX"
                      className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-primary-teal font-medium tracking-wide ${
                        abhaError ? 'border-red-500' : 'border-border-custom'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleLinkAbha}
                      disabled={abhaSaving}
                      className="px-5 py-2 bg-primary-teal text-white rounded-lg font-semibold hover:bg-primary-dark transition-all shrink-0 flex items-center justify-center min-w-[80px]"
                    >
                      {abhaSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span>Link ID</span>
                      )}
                    </button>
                  </div>
                  {abhaError && <p className="text-red-500 text-[10px] mt-1">{abhaError}</p>}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
