// lib/features/emergency/data/services/audio_recording_service.dart

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:audioplayers/audioplayers.dart';
import 'audio_recorder_helper.dart';

class AudioPermissionDeniedException implements Exception {
  @override
  String toString() => 'Microphone permission denied.';
}

class AudioRecordingService {
  static final AudioRecordingService _instance = AudioRecordingService._internal();
  factory AudioRecordingService() => _instance;
  AudioRecordingService._internal();

  final _recorder = createCrossPlatformAudioRecorder();
  final AudioPlayer _player = AudioPlayer();

  String? _currentPath;
  bool _isRecording = false;
  bool _isPlaying = false;

  bool get isRecording => _isRecording;
  bool get isPlaying => _isPlaying;
  String? get currentPath => _currentPath;

  Future<bool> hasPermission() async {
    try {
      return await _recorder.hasPermission();
    } catch (_) {
      return false;
    }
  }

  Future<void> startRecording() async {
    try {
      final ok = await hasPermission();
      if (!ok) {
        throw AudioPermissionDeniedException();
      }
      await _recorder.start();
      _isRecording = true;
    } catch (e) {
      _isRecording = false;
      rethrow;
    }
  }

  Future<String?> stopRecording() async {
    if (!_isRecording) return _currentPath;
    try {
      final path = await _recorder.stop();
      _isRecording = false;
      _currentPath = path ?? _currentPath;
      return _currentPath;
    } catch (e) {
      _isRecording = false;
      return _currentPath;
    }
  }

  Future<void> playRecording() async {
    if (_currentPath == null) return;
    try {
      if (kIsWeb || _currentPath!.startsWith('http') || _currentPath!.startsWith('blob:')) {
        await _player.play(UrlSource(_currentPath!));
      } else {
        await _player.play(DeviceFileSource(_currentPath!));
      }
      _isPlaying = true;
      _player.onPlayerComplete.listen((_) {
        _isPlaying = false;
      });
    } catch (_) {}
  }

  Future<void> stopPlayback() async {
    try {
      await _player.stop();
    } catch (_) {}
    _isPlaying = false;
  }

  Future<void> dispose() async {
    try {
      await _recorder.dispose();
      await _player.dispose();
    } catch (_) {}
  }
}
