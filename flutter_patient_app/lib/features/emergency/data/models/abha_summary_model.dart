// lib/features/emergency/data/models/abha_summary_model.dart

class AbhaSummary {
  final String abhaId;
  final String patientName;
  final String bloodGroup;
  final List<String> allergies;
  final List<String> existingConditions;
  final List<String> currentMedications;
  final String emergencyContactName;
  final String emergencyContactPhone;
  final DateTime? lastUpdated;

  const AbhaSummary({
    required this.abhaId,
    required this.patientName,
    required this.bloodGroup,
    required this.allergies,
    required this.existingConditions,
    required this.currentMedications,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
    this.lastUpdated,
  });

  factory AbhaSummary.fromJson(Map<String, dynamic> json) {
    DateTime? lastUpdated;
    if (json['last_updated'] != null) {
      try {
        lastUpdated = DateTime.parse(json['last_updated'] as String);
      } catch (_) {}
    }
    return AbhaSummary(
      abhaId: json['abha_id'] as String? ?? '',
      patientName: json['patient_name'] as String? ?? '',
      bloodGroup: json['blood_group'] as String? ?? '',
      allergies: List<String>.from(json['allergies'] as List? ?? []),
      existingConditions:
          List<String>.from(json['existing_conditions'] as List? ?? []),
      currentMedications:
          List<String>.from(json['current_medications'] as List? ?? []),
      emergencyContactName: json['emergency_contact_name'] as String? ?? '',
      emergencyContactPhone: json['emergency_contact_phone'] as String? ?? '',
      lastUpdated: lastUpdated,
    );
  }
}

class AbhaConsentToken {
  final String token;
  final DateTime expiresAt;

  const AbhaConsentToken({required this.token, required this.expiresAt});

  factory AbhaConsentToken.fromJson(Map<String, dynamic> json) {
    final ts = json['expires_at'] as num?;
    return AbhaConsentToken(
      token: json['consent_token'] as String? ?? '',
      expiresAt: ts != null
          ? DateTime.fromMillisecondsSinceEpoch((ts * 1000).toInt())
          : DateTime.now().add(const Duration(hours: 1)),
    );
  }

  bool get isValid => DateTime.now().isBefore(expiresAt);
}
