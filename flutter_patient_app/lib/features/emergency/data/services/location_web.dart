// lib/features/emergency/data/services/location_web.dart

import 'dart:async';
import 'dart:html' as html;

Future<Map<String, double>> getCrossPlatformPosition() async {
  try {
    final pos = await html.window.navigator.geolocation
        .getCurrentPosition()
        .timeout(const Duration(seconds: 4));
    final coords = pos.coords;
    final lat = coords?.latitude?.toDouble() ?? 28.6139;
    final lng = coords?.longitude?.toDouble() ?? 77.2090;
    return {'lat': lat, 'lng': lng};
  } catch (_) {
    return {'lat': 28.6139, 'lng': 77.2090};
  }
}
