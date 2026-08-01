// lib/features/emergency/data/models/hospital_model.dart

enum HospitalPreparationStatus {
  notified,
  preparingStaff,
  traumaBayReady,
  patientReceived,
}

extension HospitalPreparationStatusExt on HospitalPreparationStatus {
  String get label {
    switch (this) {
      case HospitalPreparationStatus.notified:
        return 'Hospital Notified';
      case HospitalPreparationStatus.preparingStaff:
        return 'Preparing Staff';
      case HospitalPreparationStatus.traumaBayReady:
        return 'Trauma Bay Ready';
      case HospitalPreparationStatus.patientReceived:
        return 'Patient Received';
    }
  }

  static HospitalPreparationStatus fromString(String s) {
    switch (s.toLowerCase()) {
      case 'preparing_staff':
        return HospitalPreparationStatus.preparingStaff;
      case 'trauma_bay_ready':
        return HospitalPreparationStatus.traumaBayReady;
      case 'patient_received':
        return HospitalPreparationStatus.patientReceived;
      default:
        return HospitalPreparationStatus.notified;
    }
  }
}

class HospitalModel {
  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final double distanceKm;
  final List<String> specialities;
  final bool traumaBayReady;
  final int availableBeds;
  final String contactNumber;
  final HospitalPreparationStatus preparationStatus;

  const HospitalModel({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.distanceKm,
    required this.specialities,
    this.traumaBayReady = false,
    this.availableBeds = 0,
    this.contactNumber = '',
    this.preparationStatus = HospitalPreparationStatus.notified,
  });

  factory HospitalModel.fromJson(Map<String, dynamic> json) {
    return HospitalModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      distanceKm: (json['distance_km'] as num?)?.toDouble() ?? 0,
      specialities: List<String>.from(json['specialities'] as List? ?? []),
      traumaBayReady: json['trauma_bay_ready'] as bool? ?? false,
      availableBeds: json['available_beds'] as int? ?? 0,
      contactNumber: json['contact_number'] as String? ?? '',
      preparationStatus: HospitalPreparationStatusExt.fromString(
          json['preparation_status'] as String? ?? ''),
    );
  }

  HospitalModel copyWith({HospitalPreparationStatus? preparationStatus}) {
    return HospitalModel(
      id: id,
      name: name,
      latitude: latitude,
      longitude: longitude,
      distanceKm: distanceKm,
      specialities: specialities,
      traumaBayReady: traumaBayReady,
      availableBeds: availableBeds,
      contactNumber: contactNumber,
      preparationStatus: preparationStatus ?? this.preparationStatus,
    );
  }
}
