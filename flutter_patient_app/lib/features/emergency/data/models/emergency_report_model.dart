// lib/features/emergency/data/models/emergency_report_model.dart

enum EmergencyType { roadAccident, fire, medicalEmergency, fallInjury, other }

enum SeverityLevel { minor, moderate, critical, unknown }

enum EmergencyStatus {
  idle,
  locating,
  checkingDuplicate,
  submitting,
  dispatched,
  ambulanceEnRoute,
  twoMinutesAway,
  arrived,
  cancelled,
  failed,
}

extension EmergencyTypeExt on EmergencyType {
  String get apiValue {
    switch (this) {
      case EmergencyType.roadAccident:
        return 'road_accident';
      case EmergencyType.fire:
        return 'fire';
      case EmergencyType.medicalEmergency:
        return 'medical_emergency';
      case EmergencyType.fallInjury:
        return 'fall_injury';
      case EmergencyType.other:
        return 'other';
    }
  }

  String get label {
    switch (this) {
      case EmergencyType.roadAccident:
        return 'Road Accident';
      case EmergencyType.fire:
        return 'Fire';
      case EmergencyType.medicalEmergency:
        return 'Medical Emergency';
      case EmergencyType.fallInjury:
        return 'Fall Injury';
      case EmergencyType.other:
        return 'Other';
    }
  }

  String get emoji {
    switch (this) {
      case EmergencyType.roadAccident:
        return '🚗';
      case EmergencyType.fire:
        return '🔥';
      case EmergencyType.medicalEmergency:
        return '🏥';
      case EmergencyType.fallInjury:
        return '🧍';
      case EmergencyType.other:
        return '⚠️';
    }
  }
}

extension SeverityLevelExt on SeverityLevel {
  String get label {
    switch (this) {
      case SeverityLevel.minor:
        return 'Minor';
      case SeverityLevel.moderate:
        return 'Moderate';
      case SeverityLevel.critical:
        return 'Critical';
      case SeverityLevel.unknown:
        return 'Analysing...';
    }
  }

  static SeverityLevel fromString(String s) {
    switch (s.toLowerCase()) {
      case 'minor':
        return SeverityLevel.minor;
      case 'moderate':
        return SeverityLevel.moderate;
      case 'critical':
        return SeverityLevel.critical;
      default:
        return SeverityLevel.unknown;
    }
  }
}

class EmergencyReport {
  final String id;
  final EmergencyType type;
  final double latitude;
  final double longitude;
  final String locationAddress;
  final SeverityLevel severity;
  final String? photoPath;
  final String? photoBase64;
  final String? voiceNotePath;
  final DateTime reportedAt;
  final EmergencyStatus status;
  final String? reporterUserId;
  final String? abhaId;
  final String? assignedAmbulanceId;
  final String? assignedHospitalId;
  final bool isDuplicate;
  final int etaSeconds;
  final String? trackingToken;

  const EmergencyReport({
    required this.id,
    required this.type,
    required this.latitude,
    required this.longitude,
    this.locationAddress = '',
    this.severity = SeverityLevel.unknown,
    this.photoPath,
    this.photoBase64,
    this.voiceNotePath,
    required this.reportedAt,
    this.status = EmergencyStatus.idle,
    this.reporterUserId,
    this.abhaId,
    this.assignedAmbulanceId,
    this.assignedHospitalId,
    this.isDuplicate = false,
    this.etaSeconds = 0,
    this.trackingToken,
  });

  EmergencyReport copyWith({
    String? id,
    EmergencyType? type,
    double? latitude,
    double? longitude,
    String? locationAddress,
    SeverityLevel? severity,
    String? photoPath,
    String? photoBase64,
    String? voiceNotePath,
    DateTime? reportedAt,
    EmergencyStatus? status,
    String? reporterUserId,
    String? abhaId,
    String? assignedAmbulanceId,
    String? assignedHospitalId,
    bool? isDuplicate,
    int? etaSeconds,
    String? trackingToken,
  }) {
    return EmergencyReport(
      id: id ?? this.id,
      type: type ?? this.type,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      locationAddress: locationAddress ?? this.locationAddress,
      severity: severity ?? this.severity,
      photoPath: photoPath ?? this.photoPath,
      photoBase64: photoBase64 ?? this.photoBase64,
      voiceNotePath: voiceNotePath ?? this.voiceNotePath,
      reportedAt: reportedAt ?? this.reportedAt,
      status: status ?? this.status,
      reporterUserId: reporterUserId ?? this.reporterUserId,
      abhaId: abhaId ?? this.abhaId,
      assignedAmbulanceId: assignedAmbulanceId ?? this.assignedAmbulanceId,
      assignedHospitalId: assignedHospitalId ?? this.assignedHospitalId,
      isDuplicate: isDuplicate ?? this.isDuplicate,
      etaSeconds: etaSeconds ?? this.etaSeconds,
      trackingToken: trackingToken ?? this.trackingToken,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'latitude': latitude,
        'longitude': longitude,
        'location_address': locationAddress,
        'severity': severity == SeverityLevel.unknown ? 'unknown' : severity.label.toLowerCase(),
        'photo_base64': photoBase64,
        'voice_note_base64': null, // Handled separately
        'reported_at': reportedAt.toUtc().toIso8601String(),
        'reporter_user_id': reporterUserId,
        'abha_id': abhaId,
      };
}

class SeverityAnalysisResult {
  final SeverityLevel severity;
  final double confidence;
  final String reasoning;
  final String? suggestedHospitalType;
  final List<String> flags;

  const SeverityAnalysisResult({
    required this.severity,
    required this.confidence,
    required this.reasoning,
    this.suggestedHospitalType,
    this.flags = const [],
  });

  factory SeverityAnalysisResult.fromJson(Map<String, dynamic> json) {
    return SeverityAnalysisResult(
      severity: SeverityLevelExt.fromString(json['severity'] as String? ?? 'unknown'),
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      reasoning: json['reasoning'] as String? ?? 'Analysis complete',
      suggestedHospitalType: json['suggested_hospital_type'] as String?,
      flags: List<String>.from(json['flags'] as List? ?? []),
    );
  }

  static const SeverityAnalysisResult unavailable = SeverityAnalysisResult(
    severity: SeverityLevel.unknown,
    confidence: 0.0,
    reasoning: 'Analysis unavailable',
    flags: [],
  );
}

class DuplicateCheckResult {
  final bool isDuplicate;
  final String? existingReportId;
  final int? existingAmbulanceEtaSeconds;
  final String? message;

  const DuplicateCheckResult({
    required this.isDuplicate,
    this.existingReportId,
    this.existingAmbulanceEtaSeconds,
    this.message,
  });

  factory DuplicateCheckResult.fromJson(Map<String, dynamic> json) {
    return DuplicateCheckResult(
      isDuplicate: json['is_duplicate'] as bool? ?? false,
      existingReportId: json['existing_report_id'] as String?,
      existingAmbulanceEtaSeconds: json['existing_ambulance_eta_seconds'] as int?,
      message: json['message'] as String?,
    );
  }
}


