// lib/features/emergency/presentation/providers/ambulance_tracking_provider.dart

import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/ambulance_model.dart';
import '../../data/models/hospital_model.dart';
import '../../data/services/emergency_api_service.dart';
import 'emergency_provider.dart';

class AmbulanceTrackingState {
  final double? ambulanceLat;
  final double? ambulanceLng;
  final int etaSeconds;
  final AmbulanceStatus ambulanceStatus;
  final HospitalPreparationStatus hospitalStatus;
  final String reportStatus;
  final bool isConnected;

  const AmbulanceTrackingState({
    this.ambulanceLat,
    this.ambulanceLng,
    this.etaSeconds = 0,
    this.ambulanceStatus = AmbulanceStatus.enRoute,
    this.hospitalStatus = HospitalPreparationStatus.notified,
    this.reportStatus = 'dispatched',
    this.isConnected = false,
  });

  bool get hasPosition => ambulanceLat != null && ambulanceLng != null;
}

class AmbulanceTrackingNotifier extends StateNotifier<AmbulanceTrackingState> {
  final EmergencyApiService _api;
  Timer? _pollingTimer;
  String? _reportId;

  AmbulanceTrackingNotifier(this._api) : super(const AmbulanceTrackingState());

  void startTracking(String reportId, int initialEta) {
    _reportId = reportId;
    state = AmbulanceTrackingState(
      etaSeconds: initialEta,
      isConnected: true,
    );
    // Poll every 5 seconds
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      _poll();
    });
    // First poll immediately
    _poll();
  }

  Future<void> _poll() async {
    if (_reportId == null) return;
    try {
      final update = await _api.pollTracking(_reportId!);
      if (!mounted) return;
      state = AmbulanceTrackingState(
        ambulanceLat: update.ambulanceLat,
        ambulanceLng: update.ambulanceLng,
        etaSeconds: update.etaSeconds,
        ambulanceStatus: update.ambulanceStatus,
        hospitalStatus: update.hospitalStatus,
        reportStatus: update.reportStatus,
        isConnected: true,
      );
      // Stop polling when arrived or cancelled
      if (update.etaSeconds <= 0 ||
          update.ambulanceStatus == AmbulanceStatus.arrived ||
          update.reportStatus == 'cancelled') {
        _pollingTimer?.cancel();
      }
    } catch (_) {
      // Silently ignore polling errors — don't show error to user
      // WebSocket fallback would go here
    }
  }

  void stopTracking() {
    _pollingTimer?.cancel();
    _reportId = null;
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}

final ambulanceTrackingProvider =
    StateNotifierProvider<AmbulanceTrackingNotifier, AmbulanceTrackingState>((ref) {
  return AmbulanceTrackingNotifier(
    ref.read(emergencyApiServiceProvider),
  );
});
