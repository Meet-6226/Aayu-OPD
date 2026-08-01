// lib/features/emergency/data/services/audio_recorder_web.dart

import 'dart:async';
import 'dart:html' as html;

class CrossPlatformAudioRecorder {
  html.MediaRecorder? _mediaRecorder;
  final List<html.Blob> _chunks = [];
  String? _recordedUrl;

  Future<bool> hasPermission() async {
    try {
      final mediaDevices = html.window.navigator.mediaDevices;
      if (mediaDevices == null) return false;
      final stream = await mediaDevices.getUserMedia({'audio': true});
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> start() async {
    _chunks.clear();
    final mediaDevices = html.window.navigator.mediaDevices;
    if (mediaDevices == null) {
      throw Exception('Media Devices API not supported in this browser.');
    }
    final stream = await mediaDevices.getUserMedia({'audio': true});
    _mediaRecorder = html.MediaRecorder(stream);
    _mediaRecorder!.addEventListener('dataavailable', (html.Event event) {
      if (event is html.BlobEvent && event.data != null) {
        _chunks.add(event.data!);
      }
    });
    _mediaRecorder!.start(100);
  }

  Future<String?> stop() async {
    if (_mediaRecorder == null) return _recordedUrl;

    final completer = Completer<String?>();
    _mediaRecorder!.addEventListener('stop', (e) {
      final blob = html.Blob(_chunks, 'audio/webm');
      _recordedUrl = html.Url.createObjectUrlFromBlob(blob);
      completer.complete(_recordedUrl);
    });

    _mediaRecorder!.stop();
    _mediaRecorder!.stream?.getTracks().forEach((track) => track.stop());
    return completer.future;
  }

  Future<void> dispose() async {
    try {
      _mediaRecorder?.stream?.getTracks().forEach((track) => track.stop());
    } catch (_) {}
  }
}
