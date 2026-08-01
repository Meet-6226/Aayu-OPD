// lib/features/emergency/presentation/widgets/dispatch_status_timeline.dart

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../providers/emergency_provider.dart';

class DispatchStatusTimeline extends StatelessWidget {
  final List<DispatchStep> steps;
  const DispatchStatusTimeline({super.key, required this.steps});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderCustom),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.radio, size: 18, color: AppColors.primaryTeal),
              const SizedBox(width: 8),
              Text(
                'Dispatch Status',
                style: AppTypography.titleMedium.copyWith(fontSize: 15),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...steps.asMap().entries.map((entry) {
            final i = entry.key;
            final step = entry.value;
            final isLast = i == steps.length - 1;
            return _buildStep(step, isLast);
          }),
        ],
      ),
    );
  }

  Widget _buildStep(DispatchStep step, bool isLast) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline line + dot
          Column(
            children: [
              _buildDot(step),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: step.completed
                        ? AppColors.emeraldGreen
                        : AppColors.borderCustom,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 14),
          // Label
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.label,
                    style: AppTypography.bodyMedium.copyWith(
                      fontWeight: step.completed
                          ? FontWeight.w700
                          : step.loading
                              ? FontWeight.w600
                              : FontWeight.w400,
                      color: step.error != null
                          ? AppColors.statusCancelledText
                          : step.completed
                              ? AppColors.textDark
                              : step.loading
                                  ? AppColors.primaryTeal
                                  : AppColors.textLight,
                    ),
                  ),
                  if (step.error != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      step.error!,
                      style: const TextStyle(fontSize: 11, color: AppColors.statusCancelledText),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(DispatchStep step) {
    if (step.loading) {
      return SizedBox(
        width: 22,
        height: 22,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryTeal),
        ),
      );
    }
    if (step.completed) {
      return Container(
        width: 22,
        height: 22,
        decoration: const BoxDecoration(
          color: AppColors.emeraldGreen,
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.check, color: Colors.white, size: 14),
      );
    }
    if (step.error != null) {
      return Container(
        width: 22,
        height: 22,
        decoration: const BoxDecoration(
          color: AppColors.statusCancelledBg,
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.close, color: AppColors.statusCancelledText, size: 14),
      );
    }
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        color: AppColors.borderLight,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.borderCustom),
      ),
    );
  }
}
