// lib/features/emergency/data/services/location_service.dart

import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';
import 'location_helper.dart';

class LocationServiceDisabledException implements Exception {
  @override
  String toString() => 'Location services are disabled on this device.';
}

class LocationPermissionDeniedException implements Exception {
  @override
  String toString() => 'Location permission was denied. Please allow location access.';
}

class LocationPermissionPermanentlyDeniedException implements Exception {
  @override
  String toString() =>
      'Location permission is permanently denied. Please enable it in browser/app settings.';
}

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  final Dio _dio = Dio();

  Future<Position> getCurrentPosition() async {
    try {
      final posMap = await fetchUniversalPosition();
      final lat = posMap['lat'] ?? 28.6139;
      final lng = posMap['lng'] ?? 77.2090;

      return Position(
        longitude: lng,
        latitude: lat,
        timestamp: DateTime.now(),
        accuracy: 10,
        altitude: 0,
        altitudeAccuracy: 0,
        heading: 0,
        headingAccuracy: 0,
        speed: 0,
        speedAccuracy: 0,
      );
    } catch (e) {
      return Position(
        longitude: 77.2090,
        latitude: 28.6139,
        timestamp: DateTime.now(),
        accuracy: 10,
        altitude: 0,
        altitudeAccuracy: 0,
        heading: 0,
        headingAccuracy: 0,
        speed: 0,
        speedAccuracy: 0,
      );
    }
  }

  Future<String> reverseGeocode(double lat, double lng) async {
    try {
      final resp = await _dio.get(
        'https://nominatim.openstreetmap.org/reverse',
        queryParameters: {
          'format': 'json',
          'lat': lat,
          'lon': lng,
          'zoom': 18,
          'addressdetails': 1,
        },
        options: Options(
          headers: {'User-Agent': 'AayuEmergencyApp/1.0'},
          sendTimeout: const Duration(seconds: 6),
          receiveTimeout: const Duration(seconds: 6),
        ),
      );
      if (resp.data != null && resp.data is Map && resp.data['display_name'] != null) {
        final displayName = resp.data['display_name'] as String;
        final parts = displayName.split(',');
        if (parts.length > 4) {
          return parts.take(4).join(',').trim();
        }
        return displayName;
      }
    } catch (_) {}
    return 'Lat: ${lat.toStringAsFixed(4)}, Lng: ${lng.toStringAsFixed(4)}';
  }

  Stream<Position> getLiveLocationStream() {
    return Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    );
  }

  Future<void> openLocationSettings() async {
    await Geolocator.openLocationSettings();
  }

  Future<void> openAppSettings() async {
    await Geolocator.openAppSettings();
  }
}
