import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  SharedPreferences? _prefs;

  Map<String, dynamic>? _currentUser;
  bool _isOnboardingDone = false;
  Map<String, dynamic>? _medicalProfile;

  AuthService() {
    _initPrefs();
  }

  Map<String, dynamic>? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;
  bool get isOnboardingDone => _isOnboardingDone;
  Map<String, dynamic>? get medicalProfile => _medicalProfile;

  Future<void> _initPrefs() async {
    _prefs = await SharedPreferences.getInstance();
    _loadSessionFromCache();
  }

  void _loadSessionFromCache() {
    final sessionStr = _prefs?.getString('nidaan_patient_session');
    if (sessionStr != null) {
      try {
        _currentUser = json.decode(sessionStr);
        final phone = _currentUser?['phone'] ?? '';
        
        // Load onboarding states
        _isOnboardingDone = _prefs?.getBool('nidaan_onboarding_done_${phone}') ?? false;
        
        final medStr = _prefs?.getString('nidaan_medical_profile_${phone}');
        if (medStr != null) {
          _medicalProfile = json.decode(medStr);
        }
      } catch (e) {
        print('❌ [AuthService] load session error: $e');
      }
      notifyListeners();
    }
  }

  /// Trigger a mock OTP request. In a real app, this would ping Twilio or Firebase Auth.
  Future<String> requestOtp(String phone) async {
    // Return a stable 6-digit mock OTP for testing
    final randomOtp = (100000 + (900000 * (DateTime.now().millisecond / 1000)).floor()).toString();
    return randomOtp;
  }

  /// Log in or register a patient using their phone number.
  Future<bool> verifyOtpAndLogin(String phone, {Map<String, dynamic>? registerData}) async {
    // 1. Check if patient exists in MongoDB collection "patients"
    final results = await _apiService.getDocs(
      'patients',
      clauses: [
        {'field': 'phone', 'op': '==', 'value': phone}
      ],
      limit: 1,
    );

    Map<String, dynamic> userProfile;

    if (results.isNotEmpty) {
      userProfile = results.first;
      // Merge with registerData if provided
      if (registerData != null) {
        userProfile.addAll(registerData);
        await _apiService.setDoc('patients', userProfile['_id'] ?? userProfile['id'], userProfile, merge: true);
      }
    } else {
      // 2. Create a new patient profile if not found
      final newId = 'patient_${phone.replaceAll(RegExp(r'\D'), '')}';
      userProfile = {
        '_id': newId,
        'id': newId,
        'phone': phone,
        'name': registerData?['name'] ?? 'New Patient',
        'age': registerData?['age'] ?? '25',
        'gender': registerData?['gender'] ?? 'Other',
        'city': registerData?['city'] ?? 'Hyderabad',
        'abhaId': registerData?['abhaId'] ?? '',
        'persona': registerData?['persona'] ?? 'Busy Professional',
        'createdAt': DateTime.now().toIso8601String(),
      };
      await _apiService.setDoc('patients', newId, userProfile);
    }

    _currentUser = userProfile;
    _prefs?.setString('nidaan_patient_session', json.encode(userProfile));

    // Load user-specific clinical attributes
    _isOnboardingDone = _prefs?.getBool('nidaan_onboarding_done_${phone}') ?? false;
    final medStr = _prefs?.getString('nidaan_medical_profile_${phone}');
    if (medStr != null) {
      _medicalProfile = json.decode(medStr);
    } else {
      _medicalProfile = null;
    }

    notifyListeners();
    return true;
  }

  /// Update the current patient's profile details.
  Future<bool> updateProfile(Map<String, dynamic> updatedFields) async {
    if (_currentUser == null) return false;
    final id = _currentUser?['_id'] ?? _currentUser?['id'];
    if (id == null) return false;

    final success = await _apiService.updateDoc('patients', id, updatedFields);
    if (success) {
      _currentUser!.addAll(updatedFields);
      _prefs?.setString('nidaan_patient_session', json.encode(_currentUser));
      notifyListeners();
    }
    return success;
  }

  /// Save ABDM clinical profile data.
  Future<void> saveMedicalProfile(Map<String, dynamic> profile) async {
    if (_currentUser == null) return;
    final phone = _currentUser?['phone'] ?? '';

    _isOnboardingDone = true;
    _medicalProfile = profile;

    _prefs?.setBool('nidaan_onboarding_done_${phone}', true);
    _prefs?.setString('nidaan_medical_profile_${phone}', json.encode(profile));

    notifyListeners();
  }

  /// Sign out the current user session and wipe cached data.
  Future<void> logout() async {
    _currentUser = null;
    _isOnboardingDone = false;
    _medicalProfile = null;
    await _prefs?.remove('nidaan_patient_session');
    notifyListeners();
  }
}
