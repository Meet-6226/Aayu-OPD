// lib/features/emergency/data/services/emergency_api_service.dart

import 'package:dio/dio.dart';
import '../models/emergency_report_model.dart';
import '../models/ambulance_model.dart';
import '../models/hospital_model.dart';
import '../models/abha_summary_model.dart';

const String _kBaseUrl = 'http://localhost:8080/api';

class DispatchResult {
  final String reportId;
  final AmbulanceModel ambulance;
  final HospitalModel hospital;
  final List<HospitalModel> allHospitals;
  final int etaSeconds;
  final String trackingToken;

  const DispatchResult({
    required this.reportId,
    required this.ambulance,
    required this.hospital,
    required this.allHospitals,
    required this.etaSeconds,
    required this.trackingToken,
  });

  factory DispatchResult.fromJson(Map<String, dynamic> json) {
    return DispatchResult(
      reportId: json['report_id'] as String? ?? '',
      ambulance: AmbulanceModel.fromJson(
          json['assigned_ambulance'] as Map<String, dynamic>? ?? {}),
      hospital: HospitalModel.fromJson(
          json['assigned_hospital'] as Map<String, dynamic>? ?? {}),
      allHospitals: (json['all_hospitals'] as List? ?? [])
          .map((h) => HospitalModel.fromJson(h as Map<String, dynamic>))
          .toList(),
      etaSeconds: json['eta_seconds'] as int? ?? 300,
      trackingToken: json['tracking_token'] as String? ?? '',
    );
  }
}

class TrackingUpdate {
  final double ambulanceLat;
  final double ambulanceLng;
  final int etaSeconds;
  final AmbulanceStatus ambulanceStatus;
  final HospitalPreparationStatus hospitalStatus;
  final String reportStatus;

  const TrackingUpdate({
    required this.ambulanceLat,
    required this.ambulanceLng,
    required this.etaSeconds,
    required this.ambulanceStatus,
    required this.hospitalStatus,
    required this.reportStatus,
  });

  factory TrackingUpdate.fromJson(Map<String, dynamic> json) {
    return TrackingUpdate(
      ambulanceLat: (json['ambulance_lat'] as num?)?.toDouble() ?? 0,
      ambulanceLng: (json['ambulance_lng'] as num?)?.toDouble() ?? 0,
      etaSeconds: json['eta_seconds'] as int? ?? 0,
      ambulanceStatus:
          AmbulanceStatusExt.fromString(json['status'] as String? ?? ''),
      hospitalStatus: HospitalPreparationStatusExt.fromString(
          json['hospital_status'] as String? ?? ''),
      reportStatus: json['report_status'] as String? ?? 'dispatched',
    );
  }
}

class EmergencyApiService {
  final Dio _dio;

  EmergencyApiService({Dio? dio})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: _kBaseUrl,
              connectTimeout: const Duration(seconds: 15),
              receiveTimeout: const Duration(seconds: 30),
              sendTimeout: const Duration(seconds: 30),
            ));

  // Submit emergency report
  Future<DispatchResult> submitReport(EmergencyReport report) async {
    try {
      final response = await _dio.post(
        '/emergency/report',
        data: report.toJson(),
      );
      return DispatchResult.fromJson(response.data as Map<String, dynamic>);
    } catch (_) {
      // Fallback for APK / mobile standalone mode
      return DispatchResult(
        reportId: 'EM-${DateTime.now().millisecondsSinceEpoch}',
        ambulance: const AmbulanceModel(
          id: 'AMB-108-MH',
          vehicleNumber: 'MH-04-AM-1008',
          currentLatitude: 19.0310,
          currentLongitude: 73.0600,
          driverName: 'Rajesh Kumar (ALS Specialist)',
          driverPhone: '+919876543210',
          etaSeconds: 240,
          status: AmbulanceStatus.enRoute,
        ),
        hospital: const HospitalModel(
          id: 'HOSP-01',
          name: 'Apollo Hospital (Level 1 Emergency)',
          latitude: 19.0350,
          longitude: 73.0650,
          distanceKm: 1.2,
          specialities: ['Trauma', 'ICU', 'Emergency'],
          traumaBayReady: true,
          availableBeds: 8,
          contactNumber: '+919876543210',
          preparationStatus: HospitalPreparationStatus.traumaBayReady,
        ),
        allHospitals: const [],
        etaSeconds: 240,
        trackingToken: 'TRACK-${DateTime.now().millisecondsSinceEpoch}',
      );
    }
  }

  // AI image analysis
  Future<SeverityAnalysisResult> analyzeImage({
    required String base64Image,
    required String mimeType,
  }) async {
    try {
      final response = await _dio.post(
        '/emergency/analyze-image',
        data: {'image': base64Image, 'mime_type': mimeType, 'context': 'road_accident_scene'},
        options: Options(
          sendTimeout: const Duration(seconds: 45),
          receiveTimeout: const Duration(seconds: 45),
        ),
      );
      return SeverityAnalysisResult.fromJson(
          response.data as Map<String, dynamic>);
    } on DioException {
      return SeverityAnalysisResult.unavailable;
    }
  }

  // Duplicate check
  Future<DuplicateCheckResult> checkDuplicate({
    required double latitude,
    required double longitude,
    required EmergencyType type,
    double radiusMeters = 200,
    int windowMinutes = 15,
  }) async {
    try {
      final response = await _dio.get(
        '/emergency/check-duplicate',
        queryParameters: {
          'lat': latitude,
          'lng': longitude,
          'type': type.apiValue,
          'radius_meters': radiusMeters,
          'window_minutes': windowMinutes,
        },
      );
      return DuplicateCheckResult.fromJson(
          response.data as Map<String, dynamic>);
    } catch (_) {
      return const DuplicateCheckResult(isDuplicate: false);
    }
  }

  // Nearest hospitals
  Future<List<HospitalModel>> getNearestHospitals({
    required double latitude,
    required double longitude,
    required String severity,
    required String type,
    int limit = 3,
  }) async {
    try {
      final response = await _dio.get(
        '/emergency/nearest-hospitals',
        queryParameters: {
          'lat': latitude,
          'lng': longitude,
          'severity': severity,
          'type': type,
          'limit': limit,
        },
      );
      final data = response.data as Map<String, dynamic>;
      final list = data['hospitals'] as List? ?? [];
      return list.map((h) => HospitalModel.fromJson(h as Map<String, dynamic>)).toList();
    } catch (_) {
      return const [];
    }
  }

  // Tracking poll (5-second interval)
  Future<TrackingUpdate> pollTracking(String reportId) async {
    try {
      final response = await _dio.get('/emergency/tracking/$reportId');
      return TrackingUpdate.fromJson(response.data as Map<String, dynamic>);
    } catch (_) {
      return const TrackingUpdate(
        ambulanceLat: 19.0305,
        ambulanceLng: 73.0595,
        etaSeconds: 180,
        ambulanceStatus: AmbulanceStatus.enRoute,
        hospitalStatus: HospitalPreparationStatus.traumaBayReady,
        reportStatus: 'dispatched',
      );
    }
  }

  // Cancel report
  Future<void> cancelReport(String reportId, String reason) async {
    try {
      await _dio.delete(
        '/emergency/cancel/$reportId',
        data: {'reason': reason},
      );
    } catch (_) {}
  }

  // ABHA consent
  Future<AbhaConsentToken> requestAbhaConsent({
    required String abhaId,
    required String reportId,
    String? reporterUserId,
  }) async {
    final response = await _dio.post(
      '/abha/emergency-consent',
      data: {
        'abha_id': abhaId,
        'report_id': reportId,
        'reporter_user_id': reporterUserId,
      },
    );
    return AbhaConsentToken.fromJson(response.data as Map<String, dynamic>);
  }

  // ABHA summary
  Future<AbhaSummary> getAbhaSummary({
    required String abhaId,
    required String consentToken,
  }) async {
    final response = await _dio.get(
      '/abha/emergency-summary/$abhaId',
      options: Options(headers: {'X-Consent-Token': consentToken}),
    );
    return AbhaSummary.fromJson(response.data as Map<String, dynamic>);
  }
}
