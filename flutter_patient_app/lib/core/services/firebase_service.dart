import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import '../constants/firebase_constants.dart';
import '../models/patient_model.dart';
import '../models/doctor_model.dart';
import '../models/appointment_model.dart';

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  FirebaseFirestore? _firestore;

  Future<void> initFirebase() async {
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(
          options: const FirebaseOptions(
            apiKey: FirebaseConstants.apiKey,
            authDomain: FirebaseConstants.authDomain,
            projectId: FirebaseConstants.projectId,
            storageBucket: FirebaseConstants.storageBucket,
            messagingSenderId: FirebaseConstants.messagingSenderId,
            appId: FirebaseConstants.appId,
          ),
        );
      }
      _firestore = FirebaseFirestore.instance;
    } catch (e) {
      // Graceful fallback to mock mode if offline or uninitialized
      _firestore = null;
    }
  }

  // --- Patients ---
  Future<PatientModel?> getPatientById(String phoneId) async {
    if (_firestore == null) return _getMockPatient(phoneId);
    try {
      final doc = await _firestore!
          .collection(FirebaseConstants.patientsCollection)
          .doc(phoneId)
          .get();

      if (doc.exists && doc.data() != null) {
        return PatientModel.fromMap(doc.id, doc.data()!);
      }
    } catch (_) {}
    return _getMockPatient(phoneId);
  }

  Future<void> savePatient(PatientModel patient) async {
    if (_firestore != null) {
      try {
        await _firestore!
            .collection(FirebaseConstants.patientsCollection)
            .doc(patient.uid)
            .set(patient.toMap(), SetOptions(merge: true));
      } catch (_) {}
    }
  }

  PatientModel _getMockPatient(String phoneId) {
    return PatientModel(
      uid: phoneId.isEmpty ? '919876543210' : phoneId,
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      email: 'priya.sharma@example.com',
      age: 29,
      gender: 'female',
      city: 'Delhi',
      bloodGroup: 'O+',
      abhaId: '91-9876-5432-1090',
      persona: 'working_professional',
      trustScore: 96.5,
      totalVisits: 4,
      totalNoShows: 0,
    );
  }

  // --- Doctors ---
  Future<List<DoctorModel>> getDoctors() async {
    if (_firestore == null) return _getMockDoctors();
    try {
      final query = await _firestore!
          .collection(FirebaseConstants.doctorsCollection)
          .get();

      if (query.docs.isNotEmpty) {
        return query.docs
            .map((doc) => DoctorModel.fromMap(doc.id, doc.data()))
            .toList();
      }
    } catch (_) {}
    return _getMockDoctors();
  }

  List<DoctorModel> _getMockDoctors() {
    return [
      DoctorModel(
        id: 'doc_001',
        name: 'Dr. Arjun Deshmukh',
        initials: 'AD',
        department: 'Cardiology',
        qualifications: 'MBBS, MD (Cardiology), FACC',
        experienceYears: 14,
        consultationFee: 1200.0,
        phone: '+91 98230 11223',
        email: 'arjun.deshmukh@aayu.com',
        rating: 4.9,
        reviewCount: 340,
        hospital: 'Aayu Main Center, Chennai',
        bio: 'Senior Interventional Cardiologist specializing in preventative cardiac care, hypertension management, and non-invasive diagnostic procedures.',
        specializations: ['Coronary Angioplasty', 'Heart Failure Management', 'Preventative Cardiology'],
        imagePath: 'assets/images/dr_arjun_deshmukh.png',
      ),
      DoctorModel(
        id: 'doc_002',
        name: 'Dr. Kavita Reddy',
        initials: 'KR',
        department: 'Pediatrics',
        qualifications: 'MBBS, DCH, MD (Pediatrics)',
        experienceYears: 11,
        consultationFee: 900.0,
        phone: '+91 98450 44556',
        email: 'kavita.reddy@aayu.com',
        rating: 4.85,
        reviewCount: 215,
        hospital: 'Aayu Children\'s Center, Hyderabad',
        bio: 'Compassionate pediatrician focused on child immunization, growth monitoring, developmental disorders, and pediatric emergency care.',
        specializations: ['Pediatric Care', 'Child Immunization', 'Developmental Assessment'],
        imagePath: 'assets/images/dr_kavita_reddy.png',
      ),
      DoctorModel(
        id: 'doc_003',
        name: 'Dr. Rajesh Mehta',
        initials: 'RM',
        department: 'Orthopedics',
        qualifications: 'MBBS, MS (Ortho), M.Ch (UK)',
        experienceYears: 18,
        consultationFee: 1500.0,
        phone: '+91 97110 77889',
        email: 'rajesh.mehta@aayu.com',
        rating: 4.92,
        reviewCount: 480,
        hospital: 'Aayu Specialty Center, Delhi',
        bio: 'Leading orthopedic surgeon specializing in joint replacement, sports injury rehabilitation, and arthroscopic procedures.',
        specializations: ['Joint Replacement', 'Arthroscopy', 'Sports Injury Specialist'],
        imagePath: 'assets/images/dr_rajesh_mehta.png',
      ),
      DoctorModel(
        id: 'doc_004',
        name: 'Dr. Priya Iyer',
        initials: 'PI',
        department: 'Dermatology',
        qualifications: 'MBBS, DVD, MD (Dermatology)',
        experienceYears: 9,
        consultationFee: 850.0,
        phone: '+91 99001 22334',
        email: 'priya.iyer@aayu.com',
        rating: 4.78,
        reviewCount: 190,
        hospital: 'Aayu Specialty Clinic, Bengaluru',
        bio: 'Expert dermatologist specializing in clinical skin disorders, trichology, aesthetic skin treatments, and laser therapies.',
        specializations: ['Clinical Dermatology', 'Trichology', 'Aesthetic Skin Care'],
        imagePath: 'assets/images/dr_priya_iyer.png',
      ),
    ];
  }

  // --- Appointments ---
  Future<List<AppointmentModel>> getPatientAppointments(String patientId) async {
    if (_firestore == null) return _getMockAppointments(patientId);
    try {
      final query = await _firestore!
          .collection(FirebaseConstants.appointmentsCollection)
          .where('patientId', isEqualTo: patientId)
          .get();

      if (query.docs.isNotEmpty) {
        return query.docs
            .map((doc) => AppointmentModel.fromMap(doc.id, doc.data()))
            .toList();
      }
    } catch (_) {}
    return _getMockAppointments(patientId);
  }

  Future<void> createAppointment(AppointmentModel appointment) async {
    if (_firestore != null) {
      try {
        await _firestore!
            .collection(FirebaseConstants.appointmentsCollection)
            .doc(appointment.id)
            .set(appointment.toMap());
      } catch (_) {}
    }
  }

  Future<void> cancelAppointment(String appointmentId, String reason) async {
    if (_firestore != null) {
      try {
        await _firestore!
            .collection(FirebaseConstants.appointmentsCollection)
            .doc(appointmentId)
            .update({
          'status': 'cancelled',
          'cancelledReason': reason,
          'updatedAt': DateTime.now().toIso8601String(),
        });
      } catch (_) {}
    }
  }

  /// Fetches a single appointment by its document ID.
  Future<AppointmentModel?> getAppointmentById(String appointmentId) async {
    if (_firestore != null) {
      try {
        final doc = await _firestore!
            .collection(FirebaseConstants.appointmentsCollection)
            .doc(appointmentId)
            .get();
        if (doc.exists && doc.data() != null) {
          return AppointmentModel.fromMap(doc.id, doc.data()!);
        }
      } catch (_) {}
    }
    // Fallback: search in mock data by id
    final mocks = _getMockAppointments('919876543210');
    try {
      return mocks.firstWhere((a) => a.id == appointmentId);
    } catch (_) {
      return mocks.isNotEmpty ? mocks.first : null;
    }
  }

  List<AppointmentModel> _getMockAppointments(String patientId) {
    return [
      AppointmentModel(
        id: 'apt_1001',
        patientId: patientId,
        doctorId: 'doc_001',
        doctorName: 'Dr. Arjun Deshmukh',
        department: 'Cardiology',
        appointmentDate: '2026-07-25',
        appointmentTime: '10:30 AM',
        status: 'confirmed',
        consultationFee: 1200.0,
        riskScore: 18.5,
        riskLevel: 'LOW',
        bookingId: 'AP-884920',
        hospital: 'Aayu Main Building, OPD-104',
        room: 'Room 104',
        notes: 'Routine cardiac follow-up and blood pressure assessment.',
      ),
      AppointmentModel(
        id: 'apt_1002',
        patientId: patientId,
        doctorId: 'doc_004',
        doctorName: 'Dr. Priya Iyer',
        department: 'Dermatology',
        appointmentDate: '2026-06-15',
        appointmentTime: '02:00 PM',
        status: 'completed',
        consultationFee: 850.0,
        riskScore: 24.0,
        riskLevel: 'LOW',
        bookingId: 'AP-773129',
        hospital: 'Aayu Specialty Clinic, Bengaluru',
        room: 'Room 302',
        notes: 'Skin consultation completed.',
      ),
    ];
  }
}
