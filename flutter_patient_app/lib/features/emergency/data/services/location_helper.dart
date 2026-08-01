// lib/features/emergency/data/services/location_helper.dart

import 'location_stub.dart'
    if (dart.library.html) 'location_web.dart';

Future<Map<String, double>> fetchUniversalPosition() {
  return getCrossPlatformPosition();
}
