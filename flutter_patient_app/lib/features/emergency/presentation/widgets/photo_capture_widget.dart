// lib/features/emergency/presentation/widgets/photo_capture_widget.dart

import 'dart:io' show File;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../data/models/emergency_report_model.dart';
import 'image_picker_helper.dart';

class PhotoCaptureWidget extends StatefulWidget {
  final Function(String? path)? onPhotoSelected;
  final SeverityAnalysisResult? analysisResult;
  final bool analyzingImage;

  const PhotoCaptureWidget({
    super.key,
    this.onPhotoSelected,
    this.analysisResult,
    this.analyzingImage = false,
  });

  @override
  State<PhotoCaptureWidget> createState() => _PhotoCaptureWidgetState();
}

class _PhotoCaptureWidgetState extends State<PhotoCaptureWidget> {
  String? _imagePath;

  Future<void> _pickImage({required bool isCamera}) async {
    try {
      final pickedPath = await pickImageCrossPlatform(isCamera: isCamera);
      if (pickedPath != null && mounted) {
        setState(() => _imagePath = pickedPath);
        widget.onPhotoSelected?.call(pickedPath);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Photo selection failed: $e')),
        );
      }
    }
  }

  void _removePhoto() {
    setState(() => _imagePath = null);
    widget.onPhotoSelected?.call(null);
  }

  Widget _buildImagePreview(String path) {
    if (kIsWeb || path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
      return Image.network(
        path,
        width: double.infinity,
        height: 180,
        fit: BoxFit.cover,
        errorBuilder: (ctx, err, stack) => Container(
          height: 180,
          color: AppColors.borderLight,
          child: const Center(child: Icon(LucideIcons.image, size: 40, color: AppColors.textLight)),
        ),
      );
    }
    return Image.file(
      File(path),
      width: double.infinity,
      height: 180,
      fit: BoxFit.cover,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderCustom),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                const Icon(LucideIcons.camera, size: 16, color: AppColors.primaryTeal),
                const SizedBox(width: 8),
                Text(
                  'Scene Photo (Optional)',
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                const Spacer(),
                Text(
                  'AI Triage',
                  style: AppTypography.bodySmall.copyWith(
                    fontSize: 10,
                    color: AppColors.primaryTeal,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          if (_imagePath != null) ...[
            // Photo preview
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: _buildImagePreview(_imagePath!),
                  ),
                  // Remove button
                  Positioned(
                    top: 8, right: 8,
                    child: GestureDetector(
                      onTap: _removePhoto,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(LucideIcons.x, size: 14, color: Colors.white),
                      ),
                    ),
                  ),
                  // AI analysis overlay
                  if (widget.analyzingImage)
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              CircularProgressIndicator(color: Colors.white),
                              SizedBox(height: 10),
                              Text(
                                'AI analysing severity...',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // AI Analysis result
            if (widget.analysisResult != null && !widget.analyzingImage)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _SeverityResultCard(result: widget.analysisResult!),
              ),

            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextButton.icon(
                onPressed: () => _pickImage(isCamera: true),
                icon: const Icon(LucideIcons.camera, size: 14),
                label: const Text('Retake Photo'),
                style: TextButton.styleFrom(foregroundColor: AppColors.textMedium),
              ),
            ),
            const SizedBox(height: 12),
          ] else ...[
            // Capture buttons
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(isCamera: true),
                      icon: const Icon(LucideIcons.camera, size: 16),
                      label: const Text('Camera'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primaryTeal,
                        side: const BorderSide(color: AppColors.primaryTeal),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(isCamera: false),
                      icon: const Icon(LucideIcons.image, size: 16),
                      label: const Text('Gallery'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textMedium,
                        side: const BorderSide(color: AppColors.borderCustom),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Text(
                'Adding a photo helps AI assess severity and prepare the hospital.',
                style: AppTypography.bodySmall.copyWith(fontSize: 11),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SeverityResultCard extends StatelessWidget {
  final SeverityAnalysisResult result;
  const _SeverityResultCard({required this.result});

  Color get _severityColor {
    switch (result.severity) {
      case SeverityLevel.minor:
        return const Color(0xFF16A34A);
      case SeverityLevel.moderate:
        return const Color(0xFFD97706);
      case SeverityLevel.critical:
        return const Color(0xFFDC2626);
      case SeverityLevel.unknown:
        return AppColors.textLight;
    }
  }

  Color get _severityBg {
    switch (result.severity) {
      case SeverityLevel.minor:
        return const Color(0xFFDCFCE7);
      case SeverityLevel.moderate:
        return const Color(0xFFFEF3C7);
      case SeverityLevel.critical:
        return const Color(0xFFFEE2E2);
      case SeverityLevel.unknown:
        return AppColors.borderLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (result.severity == SeverityLevel.unknown && result.reasoning == 'Analysis unavailable') {
      return Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppColors.borderLight,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.borderCustom),
        ),
        child: const Row(
          children: [
            Icon(LucideIcons.info, size: 14, color: AppColors.textLight),
            SizedBox(width: 8),
            Text('AI analysis unavailable', style: TextStyle(fontSize: 12, color: AppColors.textLight)),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _severityBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _severityColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('🤖 AI Severity Assessment', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _severityColor,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  result.severity.label.toUpperCase(),
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white),
                ),
              ),
            ],
          ),
          if (result.confidence > 0) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Text('Confidence: ', style: TextStyle(fontSize: 11, color: AppColors.textMedium)),
                Text(
                  '${(result.confidence * 100).toInt()}%',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: _severityColor),
                ),
              ],
            ),
          ],
          if (result.reasoning.isNotEmpty && result.reasoning != 'Analysis unavailable') ...[
            const SizedBox(height: 4),
            Text(
              result.reasoning,
              style: TextStyle(fontSize: 11, color: _severityColor, fontStyle: FontStyle.italic),
            ),
          ],
          if (result.suggestedHospitalType != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(LucideIcons.building2, size: 11, color: AppColors.textLight),
                const SizedBox(width: 4),
                Text(
                  'Suggested: ${result.suggestedHospitalType}',
                  style: const TextStyle(fontSize: 11, color: AppColors.textMedium),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
