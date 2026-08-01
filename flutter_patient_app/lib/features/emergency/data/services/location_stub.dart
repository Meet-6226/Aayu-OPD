// lib/features/emergency/data/services/location_stub.dart

import 'package:geolocator/geolocator.dart';

Future<Map<String, double>> getCrossPlatformPosition() async {
  LocationPermission permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  final pos = await Geolocator.getCurrentPosition(
    locationSettings: const LocationSettings(
      accuracy: LocationAccuracy.high,
      timeLimit: Duration(seconds: 8),
    ),
  );
  return {
    'lat': pos.latitude,
    'lng': pos.longitude,
  };
}
