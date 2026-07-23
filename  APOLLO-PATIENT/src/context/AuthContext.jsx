import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { formatPatientId, formatPatientPhone } from '../utils/dataFormat';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 1. Check if there is a mock session stored in localStorage safely
    let sessionLoaded = false;
    try {
      const savedSession = localStorage.getItem('apollo_patient_session');
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        setUser(parsedSession);
        setIsAuthenticated(true);
        setLoading(false);
        sessionLoaded = true;

        // Background sync with Firestore to prevent stale session data
        if (parsedSession && parsedSession.uid) {
          const cleanId = formatPatientId(parsedSession.uid);
          const patientRef = doc(db, COLLECTIONS.PATIENTS, cleanId);
          getDoc(patientRef).then((docSnap) => {
            if (docSnap.exists()) {
              const freshData = docSnap.data();
              const mergedSession = {
                ...parsedSession,
                ...freshData,
                isNew: false
              };
              setUser(mergedSession);
              localStorage.setItem('apollo_patient_session', JSON.stringify(mergedSession));
              console.log("[AuthContext] Background sync complete. Session updated with fresh Firestore data.");
            }
          }).catch((err) => {
            console.warn("[AuthContext] Background session sync failed:", err);
          });
        }
      }
    } catch (e) {
      console.warn("Failed to parse saved session from localStorage:", e);
      localStorage.removeItem('apollo_patient_session');
    }

    if (sessionLoaded) return;

    // 2. Fallback to real Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Extract the cleanId (phone number) from email if possible, else fallback to uid
          const cleanId = firebaseUser.email ? firebaseUser.email.split('@')[0] : firebaseUser.uid;
          const patientRef = doc(db, COLLECTIONS.PATIENTS, cleanId);
          const patientDoc = await getDoc(patientRef);
          
          if (patientDoc.exists()) {
            setUser({
              uid: cleanId,
              ...patientDoc.data()
            });
          } else {
            setUser({
              uid: cleanId,
              phone: firebaseUser.phoneNumber || ''
            });
          }
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Error fetching patient details:", error);
          setUser(firebaseUser);
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Mock sign-in function to query patient by phone and register in Firebase Auth
  const loginMockUser = async (phone) => {
    setLoading(true);
    try {
      const cleanId = formatPatientId(phone);
      const email = `${cleanId}@apollo-opd.com`;
      const password = `apollo_${cleanId}`; // Stable unique password for this patient

      let firebaseUser = null;
      try {
        // Try to sign in with email and password first
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = userCred.user;
        console.log("[AuthContext] Signed in existing Firebase Auth user:", firebaseUser.email);
      } catch (err) {
        // If user not found, register them in Firebase Auth
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            firebaseUser = userCred.user;
            console.log("[AuthContext] Created and authenticated new Firebase Auth user:", firebaseUser.email);
          } catch (createErr) {
            console.warn("[AuthContext] Create user failed, trying signin fallback:", createErr);
            // If creation failed (e.g. user already exists but wrong password), try standard sign in or ignore
            throw createErr;
          }
        } else {
          throw err;
        }
      }
      
      const patientRef = doc(db, COLLECTIONS.PATIENTS, cleanId);
      const docSnap = await getDoc(patientRef);

      let matchedUser = null;
      if (docSnap.exists()) {
        matchedUser = {
          uid: cleanId,
          ...docSnap.data()
        };
      } else {
        matchedUser = {
          uid: cleanId,
          phone: formatPatientPhone(phone),
          isNew: true
        };
      }

      setUser(matchedUser);
      setIsAuthenticated(true);
      localStorage.setItem('apollo_patient_session', JSON.stringify(matchedUser));
      return matchedUser;
    } catch (err) {
      console.error("Mock login query & Firebase Auth signin failed:", err);
      const cleanId = formatPatientId(phone);
      const fallbackUser = { uid: cleanId, phone: formatPatientPhone(phone), isNew: true };
      setUser(fallbackUser);
      setIsAuthenticated(true);
      localStorage.setItem('apollo_patient_session', JSON.stringify(fallbackUser));
      return fallbackUser;
    } finally {
      setLoading(false);
    }
  };

  // Login/Register with Google
  const loginGoogleUser = async (googleUser) => {
    setLoading(true);
    try {
      // Query patient by Google UID in Firestore
      const patientRef = doc(db, COLLECTIONS.PATIENTS, googleUser.uid);
      const docSnap = await getDoc(patientRef);
      
      let matchedUser = null;
      if (docSnap.exists()) {
        matchedUser = {
          uid: googleUser.uid,
          ...docSnap.data(),
          isNew: false
        };
      } else {
        matchedUser = {
          uid: googleUser.uid,
          name: googleUser.displayName || '',
          email: googleUser.email || '',
          phone: googleUser.phoneNumber || '',
          isNew: true
        };
      }

      setUser(matchedUser);
      setIsAuthenticated(true);
      localStorage.setItem('apollo_patient_session', JSON.stringify(matchedUser));
      return matchedUser;
    } catch (err) {
      console.error("Google user Firestore fetch failed:", err);
      const fallbackUser = {
        uid: googleUser.uid,
        name: googleUser.displayName || '',
        email: googleUser.email || '',
        phone: googleUser.phoneNumber || '',
        isNew: true
      };
      setUser(fallbackUser);
      setIsAuthenticated(true);
      localStorage.setItem('apollo_patient_session', JSON.stringify(fallbackUser));
      return fallbackUser;
    } finally {
      setLoading(false);
    }
  };

  const updateMockSession = (updatedData) => {
    setUser((prevUser) => {
      const newSession = { ...prevUser, ...updatedData };
      localStorage.setItem('apollo_patient_session', JSON.stringify(newSession));
      return newSession;
    });
  };

  // ── Demo Login ────────────────────────────────────────────────────────────
  // Instantly logs in a pre-filled demo patient. No OTP, no Firebase call.
  // Used by "Try Demo" CTA on Landing Page for hackathon judges.
  const loginDemoUser = () => {
    const demoPatient = {
      uid: '9199750000',
      phone: '+919199750000',
      name: 'Priya Sharma',
      age: 28,
      gender: 'Female',
      city: 'Hyderabad',
      email: 'priya.sharma@demo.in',
      bloodGroup: 'B+',
      persona: 'working_professional',
      abhaId: 'ABHA-2891-7634-5521',
      whatsappOptedIn: true,
      totalVisits: 3,
      totalNoShows: 0,
      trustScore: 95,
      priorityTokens: 1,
      distanceKm: 12.4,
      familyContactName: '',
      familyContactPhone: '',
      familyContactRelation: '',
      earnedRewards: [],
      isNew: false,
      isDemoUser: true,
    };
    setUser(demoPatient);
    setIsAuthenticated(true);
    localStorage.setItem('apollo_patient_session', JSON.stringify(demoPatient));
    return demoPatient;
  };
  // ── End Demo Login ────────────────────────────────────────────────────────

  const signOutUser = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('apollo_patient_session');
      await signOut(auth);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error during signOut:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, loginMockUser, loginGoogleUser, loginDemoUser, updateMockSession, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}
