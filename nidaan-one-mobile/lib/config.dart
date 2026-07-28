import 'dart:io';

class AppConfig {
  // Dynamically resolve localhost depending on the running target platform
  static String get apiBaseUrl {
    // 10.0.2.2 is the alias to host loopback interface in Android Emulator
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5002';
    }
    // iOS Simulators can connect direct to localhost
    return 'http://localhost:5002';
  }

  // App Metadata
  static const String appName = 'Nidaan One';
  static const String appTagline = 'Predict. Prevent. Optimize.';
}
