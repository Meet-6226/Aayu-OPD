// lib/features/emergency/presentation/widgets/dos_and_donts_card.dart

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../data/models/emergency_report_model.dart';
import 'first_aid_card.dart';

class DosAndDontsCard extends StatefulWidget {
  final EmergencyType? emergencyType;
  const DosAndDontsCard({super.key, this.emergencyType});

  @override
  State<DosAndDontsCard> createState() => _DosAndDontsCardState();
}

class _DosAndDontsCardState extends State<DosAndDontsCard> {
  bool _expanded = true;
  bool _showCpr = false;

  @override
  Widget build(BuildContext context) {
    final type = widget.emergencyType ?? EmergencyType.other;
    final data = kDosDontsByType[type] ?? kDosDontsByType[EmergencyType.other]!;
    final showCprOption = type == EmergencyType.medicalEmergency ||
        type == EmergencyType.roadAccident;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFECACA)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFEF4444).withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Color(0xFFFEE2E2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(LucideIcons.bookOpen, size: 20, color: Color(0xFFDC2626)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '⚠️ Dos & Don\'ts',
                          style: AppTypography.titleMedium.copyWith(fontSize: 15),
                        ),
                        Text(
                          'Critical safety guidelines while waiting',
                          style: AppTypography.bodySmall.copyWith(color: const Color(0xFFDC2626)),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    _expanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                    size: 18,
                    color: AppColors.textLight,
                  ),
                ],
              ),
            ),
          ),

          if (_expanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // DOS section
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          '✓ DO',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppColors.emeraldGreen,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ...data.dos.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(LucideIcons.checkCircle2, size: 16, color: AppColors.emeraldGreen),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            item,
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.textDark,
                              fontSize: 12.5,
                              height: 1.45,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )),

                  const SizedBox(height: 16),

                  // DONTS section
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          '✕ DON\'T',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFFDC2626),
                            letterSpacing: 1.0,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ...data.donts.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(LucideIcons.xCircle, size: 16, color: Color(0xFFDC2626)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            item,
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.textDark,
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                              height: 1.45,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )),

                  // CPR guidance (for medical / road accident)
                  if (showCprOption) ...[
                    const SizedBox(height: 16),
                    const Divider(height: 1),
                    const SizedBox(height: 12),
                    InkWell(
                      onTap: () => setState(() => _showCpr = !_showCpr),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.heartPulse, size: 18, color: Color(0xFFDC2626)),
                          const SizedBox(width: 8),
                          Text(
                            'CPR Step-by-Step Guide',
                            style: AppTypography.bodyMedium.copyWith(
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFFDC2626),
                            ),
                          ),
                          const Spacer(),
                          Icon(
                            _showCpr ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                            size: 16,
                            color: AppColors.textLight,
                          ),
                        ],
                      ),
                    ),
                    if (_showCpr) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF1F2),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFFECACA)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _cprStep('1', 'Check victim is unresponsive and not breathing normally.'),
                            _cprStep('2', 'Call for help. Ensure someone has called emergency services.'),
                            _cprStep('3', 'Tilt head back gently and lift chin to open airway.'),
                            _cprStep('4', 'Place heel of hand on centre of chest (lower half of sternum).'),
                            _cprStep('5', 'Press down hard 5–6 cm at rate of 100–120 compressions/minute.'),
                            _cprStep('6', 'After 30 compressions — give 2 rescue breaths (if trained).'),
                            _cprStep('7', 'Repeat 30:2 cycle until ambulance arrives or victim recovers.'),
                            const SizedBox(height: 4),
                            const Text(
                              '⚠️ Only perform CPR if victim is unresponsive and not breathing. If untrained, do hands-only CPR (compressions without rescue breaths).',
                              style: TextStyle(fontSize: 11, color: Color(0xFFB91C1C), fontStyle: FontStyle.italic, height: 1.4),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _cprStep(String num, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: const BoxDecoration(
              color: Color(0xFFDC2626),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                num,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12, color: Color(0xFF7F1D1D), height: 1.45),
            ),
          ),
        ],
      ),
    );
  }
}
