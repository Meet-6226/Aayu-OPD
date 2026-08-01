// lib/features/emergency/data/models/ambulance_model.dart

enum AmbulanceStatus { idle, enRoute, twoMinutesAway, arrived }

extension AmbulanceStatusExt on AmbulanceStatus {
  String get label {
    switch (this) {
      case AmbulanceStatus.idle:
        return 'Idle';
      case AmbulanceStatus.enRoute:
        return 'En Route';
      case AmbulanceStatus.twoMinutesAway:
        return '2 Minutes Away';
      case AmbulanceStatus.arrived:
        return 'Arrived';
    }
  }

  static AmbulanceStatus fromString(String s) {
    switch (s.toLowerCase()) {
      case 'en_route':
        return AmbulanceStatus.enRoute;
      case 'two_minutes_away':
        return AmbulanceStatus.twoMinutesAway;
      case 'arrived':
        return AmbulanceStatus.arrived;
      default:
        return AmbulanceStatus.enRoute;
    }
  }
}

class AmbulanceModel {
  final String id;
  final String vehicleNumber;
  final double currentLatitude;
  final double currentLongitude;
  final String driverName;
  final String driverPhone;
  final int etaSeconds;
  final AmbulanceStatus status;

  const AmbulanceModel({
    required this.id,
    required this.vehicleNumber,
    required this.currentLatitude,
    required this.currentLongitude,
    required this.driverName,
    required this.driverPhone,
    required this.etaSeconds,
    this.status = AmbulanceStatus.enRoute,
  });

  factory AmbulanceModel.fromJson(Map<String, dynamic> json) {
    return AmbulanceModel(
      id: json['id'] as String? ?? '',
      vehicleNumber: json['vehicle_number'] as String? ?? '',
      currentLatitude: (json['current_latitude'] as num?)?.toDouble() ?? 0,
      currentLongitude: (json['current_longitude'] as num?)?.toDouble() ?? 0,
      driverName: json['driver_name'] as String? ?? '',
      driverPhone: json['driver_phone'] as String? ?? '',
      etaSeconds: json['eta_seconds'] as int? ?? 0,
      status: AmbulanceStatusExt.fromString(json['status'] as String? ?? ''),
    );
  }

  AmbulanceModel copyWith({
    double? currentLatitude,
    double? currentLongitude,
    int? etaSeconds,
    AmbulanceStatus? status,
  }) {
    return AmbulanceModel(
      id: id,
      vehicleNumber: vehicleNumber,
      currentLatitude: currentLatitude ?? this.currentLatitude,
      currentLongitude: currentLongitude ?? this.currentLongitude,
      driverName: driverName,
      driverPhone: driverPhone,
      etaSeconds: etaSeconds ?? this.etaSeconds,
      status: status ?? this.status,
    );
  }
}
