// lib/features/emergency/data/services/audio_recorder_stub.dart

import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';

class CrossPlatformAudioRecorder {
  final AudioRecorder _recorder = AudioRecorder();
  String? _currentPath;

  Future<bool> hasPermission() async {
    try {
      return await _recorder.hasPermission();
    } catch (_) {
      return false;
    }
  }

  Future<void> start() async {
    final dir = await getTemporaryDirectory();
    _currentPath =
        '${dir.path}/emergency_voice_${DateTime.now().millisecondsSinceEpoch}.m4a';

    await _recorder.start(
      const RecordConfig(
        encoder: AudioEncoder.aacLc,
        bitRate: 128000,
        sampleRate: 44100,
        numChannels: 1,
      ),
      path: _currentPath!,
    );
  }

  Future<String?> stop() async {
    final path = await _recorder.stop();
    _currentPath = path ?? _currentPath;
    return _currentPath;
  }

  Future<void> dispose() async {
    await _recorder.dispose();
  }
}
