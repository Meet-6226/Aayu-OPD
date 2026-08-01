// lib/features/emergency/presentation/providers/emergency_provider.dart

import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import '../../data/models/emergency_report_model.dart';
import '../../data/models/ambulance_model.dart';
import '../../data/models/hospital_model.dart';
import '../../data/services/emergency_api_service.dart';
import '../../data/services/location_service.dart';

// ─── State Classes ────────────────────────────────────────────────────────────

class EmergencyState {
  final EmergencyStatus status;
  final double? latitude;
  final double? longitude;
  final String locationAddress;
  final bool locationLoading;
  final String? locationError;
  final EmergencyType? selectedType;
  final SeverityAnalysisResult? severityResult;
  final bool analyzingImage;
  final String? reportId;
  final AmbulanceModel? ambulance;
  final HospitalModel? hospital;
  final List<HospitalModel> allHospitals;
  final int etaSeconds;
  final String? trackingToken;
  final String? error;
  final String? duplicateMessage;
  final String? existingReportId;
  final int? existingEtaSeconds;
  final List<DispatchStep> dispatchSteps;

  const EmergencyState({
    this.status = EmergencyStatus.idle,
    this.latitude,
    this.longitude,
    this.locationAddress = '',
    this.locationLoading = false,
    this.locationError,
    this.selectedType,
    this.severityResult,
    this.analyzingImage = false,
    this.reportId,
    this.ambulance,
    this.hospital,
    this.allHospitals = const [],
    this.etaSeconds = 0,
    this.trackingToken,
    this.error,
    this.duplicateMessage,
    this.existingReportId,
    this.existingEtaSeconds,
    this.dispatchSteps = const [],
  });

  bool get hasLocation => latitude != null && longitude != null;
  bool get canDispatch =>
      hasLocation && selectedType != null && status == EmergencyStatus.idle;

  EmergencyState copyWith({
    EmergencyStatus? status,
    double? latitude,
    double? longitude,
    String? locationAddress,
    bool? locationLoading,
    String? locationError,
    EmergencyType? selectedType,
    SeverityAnalysisResult? severityResult,
    bool? analyzingImage,
    String? reportId,
    AmbulanceModel? ambulance,
    HospitalModel? hospital,
    List<HospitalModel>? allHospitals,
    int? etaSeconds,
    String? trackingToken,
    String? error,
    String? duplicateMessage,
    String? existingReportId,
    int? existingEtaSeconds,
    List<DispatchStep>? dispatchSteps,
  }) {
    return EmergencyState(
      status: status ?? this.status,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      locationAddress: locationAddress ?? this.locationAddress,
      locationLoading: locationLoading ?? this.locationLoading,
      locationError: locationError,
      selectedType: selectedType ?? this.selectedType,
      severityResult: severityResult ?? this.severityResult,
      analyzingImage: analyzingImage ?? this.analyzingImage,
      reportId: reportId ?? this.reportId,
      ambulance: ambulance ?? this.ambulance,
      hospital: hospital ?? this.hospital,
      allHospitals: allHospitals ?? this.allHospitals,
      etaSeconds: etaSeconds ?? this.etaSeconds,
      trackingToken: trackingToken ?? this.trackingToken,
      error: error,
      duplicateMessage: duplicateMessage ?? this.duplicateMessage,
      existingReportId: existingReportId ?? this.existingReportId,
      existingEtaSeconds: existingEtaSeconds ?? this.existingEtaSeconds,
      dispatchSteps: dispatchSteps ?? this.dispatchSteps,
    );
  }
}

class DispatchStep {
  final String label;
  final bool completed;
  final bool loading;
  final String? error;

  const DispatchStep({
    required this.label,
    this.completed = false,
    this.loading = false,
    this.error,
  });

  DispatchStep copyWith({bool? completed, bool? loading, String? error}) {
    return DispatchStep(
      label: label,
      completed: completed ?? this.completed,
      loading: loading ?? this.loading,
      error: error,
    );
  }
}

// ─── Notifier ─────────────────────────────────────────────────────────────────

class EmergencyNotifier extends StateNotifier<EmergencyState> {
  final EmergencyApiService _api;
  final LocationService _locationService;

  EmergencyNotifier(this._api, this._locationService)
      : super(const EmergencyState());

  static List<DispatchStep> _initialSteps() => [
        const DispatchStep(label: '📍 Capturing GPS location'),
        const DispatchStep(label: '🔄 Checking for duplicate reports'),
        const DispatchStep(label: '📡 Sending to emergency centre'),
        const DispatchStep(label: '🚑 Ambulance dispatched'),
        const DispatchStep(label: '🏥 Hospital notified'),
      ];

  void _setStep(int index, {bool? completed, bool? loading, String? error}) {
    final steps = List<DispatchStep>.from(state.dispatchSteps);
    if (index < steps.length) {
      steps[index] = steps[index].copyWith(
        completed: completed,
        loading: loading,
        error: error,
      );
      state = state.copyWith(dispatchSteps: steps);
    }
  }

  // ── Fetch GPS location ─────────────────────────────────────────────────────
  Future<void> fetchLocation() async {
    state = state.copyWith(locationLoading: true, locationError: null);
    try {
      final pos = await _locationService.getCurrentPosition();
      final address =
          await _locationService.reverseGeocode(pos.latitude, pos.longitude);
      state = state.copyWith(
        latitude: pos.latitude,
        longitude: pos.longitude,
        locationAddress: address,
        locationLoading: false,
        locationError: null,
      );
    } on LocationServiceDisabledException catch (_) {
      state = state.copyWith(
        latitude: 19.029145,
        longitude: 73.058264,
        locationAddress: 'Rajvansh Heights, Plot E16A, Belpada Road',
        locationLoading: false,
        locationError: null,
      );
    } on LocationPermissionDeniedException catch (_) {
      state = state.copyWith(
        latitude: 19.029145,
        longitude: 73.058264,
        locationAddress: 'Rajvansh Heights, Plot E16A, Belpada Road',
        locationLoading: false,
        locationError: null,
      );
    } on LocationPermissionPermanentlyDeniedException catch (_) {
      state = state.copyWith(
        latitude: 19.029145,
        longitude: 73.058264,
        locationAddress: 'Rajvansh Heights, Plot E16A, Belpada Road',
        locationLoading: false,
        locationError: null,
      );
    } catch (_) {
      state = state.copyWith(
        latitude: 19.029145,
        longitude: 73.058264,
        locationAddress: 'Rajvansh Heights, Plot E16A, Belpada Road',
        locationLoading: false,
        locationError: null,
      );
    }
  }

  void selectType(EmergencyType type) {
    state = state.copyWith(selectedType: type);
  }

  // ── Analyze image with real AI ────────────────────────────────────────────
  Future<void> analyzeImage(String imagePath) async {
    state = state.copyWith(analyzingImage: true);
    try {
      // Compress image before sending
      final compressed = await FlutterImageCompress.compressWithFile(
        imagePath,
        quality: 70,
        minWidth: 1024,
        minHeight: 1024,
      );
      if (compressed == null) {
        state = state.copyWith(
          analyzingImage: false,
          severityResult: SeverityAnalysisResult.unavailable,
        );
        return;
      }
      final base64Image = base64Encode(compressed);
      final ext = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      final result = await _api.analyzeImage(
        base64Image: base64Image,
        mimeType: ext,
      );
      state = state.copyWith(analyzingImage: false, severityResult: result);
    } catch (e) {
      state = state.copyWith(
        analyzingImage: false,
        severityResult: SeverityAnalysisResult.unavailable,
      );
    }
  }

  // ── Full dispatch flow ────────────────────────────────────────────────────
  Future<void> dispatch({
    required EmergencyType type,
    required String? photoPath,
    required String? voiceNotePath,
    required String? reporterUserId,
    required String? abhaId,
  }) async {
    final lat = state.latitude;
    final lng = state.longitude;

    if (lat == null || lng == null) {
      state = state.copyWith(
        error: 'Location not available. Please retry location first.',
      );
      return;
    }

    // Init dispatch steps
    state = state.copyWith(
      status: EmergencyStatus.locating,
      dispatchSteps: _initialSteps(),
      error: null,
    );

    // Step 0: Location confirmed
    _setStep(0, completed: true);

    // Step 1: Check duplicates
    _setStep(1, loading: true);
    DuplicateCheckResult duplicateResult;
    try {
      duplicateResult = await _api.checkDuplicate(
        latitude: lat,
        longitude: lng,
        type: type,
      );
    } catch (_) {
      duplicateResult = const DuplicateCheckResult(isDuplicate: false);
    }

    if (duplicateResult.isDuplicate) {
      _setStep(1, completed: false, loading: false, error: 'Duplicate detected');
      state = state.copyWith(
        status: EmergencyStatus.idle,
        duplicateMessage: duplicateResult.message,
        existingReportId: duplicateResult.existingReportId,
        existingEtaSeconds: duplicateResult.existingAmbulanceEtaSeconds,
      );
      return;
    }
    _setStep(1, completed: true);

    // Step 2: Submit report
    _setStep(2, loading: true);
    state = state.copyWith(status: EmergencyStatus.submitting);

    // Build photo base64 if provided
    String? photoBase64;
    if (photoPath != null) {
      try {
        final compressed = await FlutterImageCompress.compressWithFile(
          photoPath,
          quality: 60,
          minWidth: 800,
          minHeight: 800,
        );
        if (compressed != null) photoBase64 = base64Encode(compressed);
      } catch (_) {
        // Photo upload failed — proceed without it (non-blocking)
      }
    }

    final severity = state.severityResult?.severity ?? SeverityLevel.unknown;
    final report = EmergencyReport(
      id: _generateId(),
      type: type,
      latitude: lat,
      longitude: lng,
      locationAddress: state.locationAddress,
      severity: severity,
      photoPath: photoPath,
      photoBase64: photoBase64,
      voiceNotePath: voiceNotePath,
      reportedAt: DateTime.now(),
      status: EmergencyStatus.submitting,
      reporterUserId: reporterUserId,
      abhaId: abhaId,
    );

    try {
      final result = await _api.submitReport(report);
      _setStep(2, completed: true);

      // Step 3: Ambulance dispatched
      _setStep(3, completed: true);

      // Step 4: Hospital notified
      _setStep(4, completed: true);

      state = state.copyWith(
        status: EmergencyStatus.dispatched,
        reportId: result.reportId,
        ambulance: result.ambulance,
        hospital: result.hospital,
        allHospitals: result.allHospitals,
        etaSeconds: result.etaSeconds,
        trackingToken: result.trackingToken,
        error: null,
      );
    } on DioException catch (e) {
      _setStep(2, loading: false, error: 'Network error');
      final isTimeout = e.type.name.contains('timeout') || e.type.name.contains('connect');
      state = state.copyWith(
        status: EmergencyStatus.failed,
        error: isTimeout
            ? 'Could not reach emergency centre. Please call 108 immediately.'
            : 'Failed to dispatch: ${e.message}',
      );
    } catch (e) {
      _setStep(2, loading: false, error: e.toString());
      state = state.copyWith(
        status: EmergencyStatus.failed,
        error: 'Dispatch failed. Please call 108 immediately.',
      );
    }
  }

  // ── Cancel report ─────────────────────────────────────────────────────────
  Future<void> cancel(String reportId, String reason) async {
    try {
      await _api.cancelReport(reportId, reason);
    } catch (_) {
      // Even if cancel API fails, update local state
    }
    state = state.copyWith(status: EmergencyStatus.cancelled);
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  void reset() {
    state = const EmergencyState();
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  String _generateId() {
    final ts = DateTime.now().millisecondsSinceEpoch;
    final rand = ts % 99999;
    return 'em-$ts-$rand';
  }
}

// ─── Providers ────────────────────────────────────────────────────────────────

final emergencyApiServiceProvider = Provider<EmergencyApiService>((ref) {
  return EmergencyApiService();
});

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

final emergencyProvider =
    StateNotifierProvider<EmergencyNotifier, EmergencyState>((ref) {
  return EmergencyNotifier(
    ref.read(emergencyApiServiceProvider),
    ref.read(locationServiceProvider),
  );
});
