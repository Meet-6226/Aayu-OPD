import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAW6B2V0QzKouT3T7Rf4DGyzcEcamLcCQ4",
  authDomain: "nidaan-one-opd.firebaseapp.com",
  projectId: "nidaan-one-opd",
  storageBucket: "nidaan-one-opd.firebasestorage.app",
  messagingSenderId: "297620250848",
  appId: "1:297620250848:web:ab85ae9ea382b87e6a7085",
  measurementId: "G-R41EM6TTNK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
