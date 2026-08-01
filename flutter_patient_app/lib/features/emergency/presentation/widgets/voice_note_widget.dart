// lib/features/emergency/presentation/widgets/voice_note_widget.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../data/services/audio_recording_service.dart';

class VoiceNoteWidget extends StatefulWidget {
  final Function(String? path)? onRecordingComplete;

  const VoiceNoteWidget({super.key, this.onRecordingComplete});

  @override
  State<VoiceNoteWidget> createState() => _VoiceNoteWidgetState();
}

class _VoiceNoteWidgetState extends State<VoiceNoteWidget>
    with TickerProviderStateMixin {
  final AudioRecordingService _service = AudioRecordingService();

  bool _isRecording = false;
  bool _hasRecording = false;
  bool _isPlaying = false;

  int _seconds = 0;
  Timer? _timer;
  String? _recordedPath;
  List<double> _amplitudeHistory = List.filled(40, 0.0);

  static const int _maxSeconds = 60;

  @override
  void dispose() {
    _timer?.cancel();
    _service.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    try {
      final hasPermission = await _service.hasPermission();
      if (!hasPermission) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Microphone permission required to record voice note.')),
          );
        }
        return;
      }

      await _service.startRecording();
      setState(() {
        _isRecording = true;
        _seconds = 0;
        _amplitudeHistory = List.filled(40, 0.0);
      });

      // Timer for duration counter & dynamic amplitude animation
      _timer = Timer.periodic(const Duration(milliseconds: 120), (t) {
        if (!mounted || !_isRecording) return;
        if (t.tick % 8 == 0) {
          setState(() {
            _seconds++;
            if (_seconds >= _maxSeconds) {
              _stopRecording();
            }
          });
        }
        setState(() {
          final norm = (0.2 + (t.tick % 7) * 0.12 + (t.tick % 4) * 0.15).clamp(0.1, 0.95);
          _amplitudeHistory.add(norm);
          if (_amplitudeHistory.length > 40) {
            _amplitudeHistory.removeAt(0);
          }
        });
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Microphone recording not supported in this browser mode: $e')),
        );
      }
    }
  }

  Future<void> _stopRecording() async {
    _timer?.cancel();
    final path = await _service.stopRecording();
    if (mounted) {
      setState(() {
        _isRecording = false;
        _hasRecording = true;
        _recordedPath = path;
      });
      widget.onRecordingComplete?.call(path);
    }
  }

  Future<void> _togglePlayback() async {
    if (_isPlaying) {
      await _service.stopPlayback();
      setState(() => _isPlaying = false);
    } else {
      await _service.playRecording();
      setState(() => _isPlaying = true);
      Future.delayed(Duration(seconds: _seconds > 0 ? _seconds : 3), () {
        if (mounted) setState(() => _isPlaying = false);
      });
    }
  }

  void _reRecord() {
    setState(() {
      _hasRecording = false;
      _recordedPath = null;
      _seconds = 0;
      _amplitudeHistory = List.filled(40, 0.0);
    });
    widget.onRecordingComplete?.call(null);
  }

  String _formatTime(int s) =>
      '${(s ~/ 60).toString().padLeft(2, '0')}:${(s % 60).toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderCustom),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.mic, size: 16, color: AppColors.primaryTeal),
              const SizedBox(width: 8),
              Text(
                'Voice Description (Optional)',
                style: AppTypography.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
              const Spacer(),
              Text(
                'Max 60s',
                style: AppTypography.bodySmall.copyWith(fontSize: 10),
              ),
            ],
          ),
          const SizedBox(height: 14),

          if (_isRecording) ...[
            // Live waveform animation
            SizedBox(
              height: 52,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: List.generate(40, (i) {
                  final h = (_amplitudeHistory[i] * 48).clamp(3.0, 48.0);
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 1),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 80),
                        height: h,
                        decoration: BoxDecoration(
                          color: i == 39
                              ? const Color(0xFFDC2626)
                              : AppColors.primaryTeal.withValues(alpha: 0.7),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 8, height: 8,
                  decoration: const BoxDecoration(color: Color(0xFFDC2626), shape: BoxShape.circle),
                ),
                const SizedBox(width: 6),
                Text(
                  'Recording ${_formatTime(_seconds)} / ${_formatTime(_maxSeconds)}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFDC2626),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _stopRecording,
                icon: const Icon(Icons.stop_circle_outlined, size: 16),
                label: const Text('Stop Recording'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFDC2626),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ] else if (_hasRecording) ...[
            // Recorded playback UI
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.mintGreen,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.emeraldGreen.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.checkCircle2, size: 18, color: AppColors.emeraldGreen),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Voice note recorded',
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.emeraldGreen),
                        ),
                        Text(
                          'Duration: ${_formatTime(_seconds > 0 ? _seconds : 3)}',
                          style: AppTypography.bodySmall.copyWith(fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: _togglePlayback,
                    icon: Icon(
                      _isPlaying ? LucideIcons.pause : LucideIcons.play,
                      size: 22,
                      color: AppColors.primaryTeal,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            TextButton.icon(
              onPressed: _reRecord,
              icon: const Icon(LucideIcons.refreshCw, size: 14),
              label: const Text('Re-record'),
              style: TextButton.styleFrom(foregroundColor: AppColors.textMedium),
            ),
          ] else ...[
            // Not started
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _startRecording,
                icon: const Icon(LucideIcons.mic, size: 18, color: Color(0xFFDC2626)),
                label: const Text(
                  'Tap to Record Voice Description',
                  style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w600),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFDC2626)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Describe what you see — this helps emergency responders prepare.',
              style: AppTypography.bodySmall.copyWith(fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}
