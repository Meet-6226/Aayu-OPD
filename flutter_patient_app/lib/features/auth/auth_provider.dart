import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/models/patient_model.dart';
import '../../core/services/firebase_service.dart';

class AuthState {
  final PatientModel? patient;
  final bool isAuthenticated;
  final bool isLoading;

  AuthState({
    this.patient,
    this.isAuthenticated = false,
    this.isLoading = false,
  });

  AuthState copyWith({
    PatientModel? patient,
    bool? isAuthenticated,
    bool? isLoading,
  }) {
    return AuthState(
      patient: patient ?? this.patient,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final FirebaseService _firebaseService = FirebaseService();

  AuthNotifier() : super(AuthState(isLoading: true)) {
    _initSession();
  }

  Future<void> _initSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedPhone = prefs.getString('apollo_patient_phone');
      if (savedPhone != null && savedPhone.isNotEmpty) {
        final patient = await _firebaseService.getPatientById(savedPhone);
        if (patient != null) {
          state = AuthState(
            patient: patient,
            isAuthenticated: true,
            isLoading: false,
          );
          return;
        }
      }
    } catch (_) {}
    state = AuthState(isLoading: false);
  }

  /// Step 1+2: Login with phone (OTP verified).
  /// Always keeps isAuthenticated=false until Step 4 completes.
  Future<void> loginWithPhone(String phone) async {
    state = state.copyWith(isLoading: true);
    final cleanDigits = phone.replaceAll(RegExp(r'\D'), '');
    final phoneId = cleanDigits.isEmpty ? '919876543210' : cleanDigits;

    final patient = await _firebaseService.getPatientById(phoneId);

    if (patient != null) {
      // Existing user — load their data but KEEP isAuthenticated=false
      // so the router doesn't auto-redirect; they must confirm profile in Step 3/4.
      state = AuthState(
        patient: patient.copyWith(isNew: false),
        isAuthenticated: false,
        isLoading: false,
      );
    } else {
      // New user — create stub, mark isNew, wait for profile completion
      final stub = PatientModel(
        uid: phoneId,
        name: '',
        phone: '+91 $phoneId',
        isNew: true,
      );
      state = AuthState(
        patient: stub,
        isAuthenticated: false,
        isLoading: false,
      );
    }
  }

  /// Step 3+4: Complete profile for new patients and finalize authentication
  Future<void> completeProfile({
    required String name,
    required int age,
    required String gender,
    required String city,
    required String bloodGroup,
    required String email,
    String abhaId = '',
    required String persona,
    required bool whatsappOptedIn,
    List<String> medicalConditions = const [],
    String prescriptionName = '',
  }) async {
    final stub = state.patient;
    if (stub == null) return;

    state = state.copyWith(isLoading: true);

    final fullPatient = stub.copyWith(
      name: name,
      age: age,
      gender: gender,
      city: city,
      bloodGroup: bloodGroup,
      email: email,
      abhaId: abhaId.isNotEmpty ? abhaId : stub.abhaId,
      persona: persona,
      whatsappOptedIn: whatsappOptedIn,
      medicalConditions: medicalConditions,
      prescriptionName: prescriptionName,
      isNew: false,
    );

    await _firebaseService.savePatient(fullPatient);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('apollo_patient_phone', stub.uid);

    state = AuthState(
      patient: fullPatient,
      isAuthenticated: true,
      isLoading: false,
    );
  }

  Future<void> updateProfile(PatientModel updated) async {
    await _firebaseService.savePatient(updated);
    state = state.copyWith(patient: updated);
  }

  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('apollo_patient_phone');
    state = AuthState(
      patient: null,
      isAuthenticated: false,
      isLoading: false,
    );
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
