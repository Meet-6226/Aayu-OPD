// lib/features/emergency/data/services/audio_recorder_helper.dart

import 'audio_recorder_stub.dart'
    if (dart.library.html) 'audio_recorder_web.dart';

CrossPlatformAudioRecorder createCrossPlatformAudioRecorder() {
  return CrossPlatformAudioRecorder();
}
