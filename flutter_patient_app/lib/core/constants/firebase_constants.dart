/// Firebase options & Firestore collection names matching FIRESTORE_SCHEMA.md
class FirebaseConstants {
  FirebaseConstants._();

  static const String patientsCollection = 'patients';
  static const String appointmentsCollection = 'appointments';
  static const String doctorsCollection = 'doctors';
  static const String doctorSlotsCollection = 'doctor_slots';

  // Fallback Web/Mobile Firebase configuration (apollo-opd)
  static const String apiKey = "YOUR_FIREBASE_API_KEY";
  static const String authDomain = "apollo-opd.firebaseapp.com";
  static const String projectId = "apollo-opd";
  static const String storageBucket = "apollo-opd.firebasestorage.app";
  static const String messagingSenderId = "297620250848";
  static const String appId = "1:297620250848:web:ab85ae9ea382b87e6a7085";
}
