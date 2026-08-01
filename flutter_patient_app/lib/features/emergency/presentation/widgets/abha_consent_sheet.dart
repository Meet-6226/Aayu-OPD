// lib/features/emergency/presentation/widgets/abha_consent_sheet.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../data/models/abha_summary_model.dart';
import '../../data/services/emergency_api_service.dart';
import '../providers/emergency_provider.dart';

// ─── ABHA Provider ─────────────────────────────────────────────────────────────

class AbhaState {
  final bool loading;
  final AbhaSummary? summary;
  final AbhaConsentToken? consentToken;
  final bool consentGiven;
  final bool consentSkipped;
  final String? error;

  const AbhaState({
    this.loading = false,
    this.summary,
    this.consentToken,
    this.consentGiven = false,
    this.consentSkipped = false,
    this.error,
  });

  AbhaState copyWith({
    bool? loading,
    AbhaSummary? summary,
    AbhaConsentToken? consentToken,
    bool? consentGiven,
    bool? consentSkipped,
    String? error,
  }) {
    return AbhaState(
      loading: loading ?? this.loading,
      summary: summary ?? this.summary,
      consentToken: consentToken ?? this.consentToken,
      consentGiven: consentGiven ?? this.consentGiven,
      consentSkipped: consentSkipped ?? this.consentSkipped,
      error: error,
    );
  }
}

class AbhaNotifier extends StateNotifier<AbhaState> {
  final EmergencyApiService _api;
  AbhaNotifier(this._api) : super(const AbhaState());

  Future<void> grantConsentAndFetch({
    required String abhaId,
    required String reportId,
    String? reporterUserId,
  }) async {
    state = state.copyWith(loading: true, error: null, consentGiven: true);
    try {
      final consentToken = await _api.requestAbhaConsent(
        abhaId: abhaId,
        reportId: reportId,
        reporterUserId: reporterUserId,
      );
      final summary = await _api.getAbhaSummary(
        abhaId: abhaId,
        consentToken: consentToken.token,
      );
      state = state.copyWith(
        loading: false,
        consentToken: consentToken,
        summary: summary,
      );
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: 'Could not fetch medical summary.',
      );
    }
  }

  void skip() {
    state = state.copyWith(consentSkipped: true);
  }
}

final abhaProvider = StateNotifierProvider<AbhaNotifier, AbhaState>((ref) {
  return AbhaNotifier(ref.read(emergencyApiServiceProvider));
});

// ─── Consent Sheet Widget ──────────────────────────────────────────────────────

class AbhaConsentSheet extends ConsumerWidget {
  final String abhaId;
  final String reportId;
  final String? reporterUserId;

  const AbhaConsentSheet({
    super.key,
    required this.abhaId,
    required this.reportId,
    this.reporterUserId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40, height: 4,
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: AppColors.borderCustom,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // ABHA shield icon
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.lightTeal,
              shape: BoxShape.circle,
            ),
            child: const Icon(LucideIcons.shieldCheck, size: 32, color: AppColors.primaryTeal),
          ),
          const SizedBox(height: 16),

          Text(
            'Emergency ABHA Access',
            style: AppTypography.titleLarge.copyWith(fontSize: 20),
          ),
          const SizedBox(height: 8),
          Text(
            'The hospital treating this victim has requested access to their medical records to provide better emergency care.',
            style: AppTypography.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),

          // What will be accessed
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.bgSubtle,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderCustom),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Data that will be accessed:',
                  style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                ...[
                  'Blood group',
                  'Known allergies',
                  'Existing medical conditions',
                  'Current medications',
                  'Emergency contact details',
                ].map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.check, size: 14, color: AppColors.emeraldGreen),
                      const SizedBox(width: 8),
                      Text(item, style: AppTypography.bodySmall.copyWith(color: AppColors.textDark)),
                    ],
                  ),
                )),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Who sees it
          Row(
            children: [
              const Icon(LucideIcons.users, size: 14, color: AppColors.textLight),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Shared with: Assigned hospital + ambulance crew only',
                  style: AppTypography.bodySmall.copyWith(fontSize: 11),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(LucideIcons.fileText, size: 14, color: AppColors.textLight),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Under NHA emergency access provisions — access expires after this incident',
                  style: AppTypography.bodySmall.copyWith(fontSize: 11),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Buttons
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ref.read(abhaProvider.notifier).grantConsentAndFetch(
                  abhaId: abhaId,
                  reportId: reportId,
                  reporterUserId: reporterUserId,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryTeal,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text(
                'Allow Emergency Access',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
              ),
            ),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(abhaProvider.notifier).skip();
            },
            child: Text(
              'Skip — Don\'t access medical data',
              style: AppTypography.bodyMedium.copyWith(color: AppColors.textLight),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── ABHA Summary Display ─────────────────────────────────────────────────────

class AbhaSummaryPanel extends StatelessWidget {
  final AbhaSummary summary;

  const AbhaSummaryPanel({super.key, required this.summary});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.lightTeal,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primaryTeal.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.shieldCheck, size: 16, color: AppColors.primaryTeal),
              const SizedBox(width: 8),
              Text(
                'ABHA Medical Summary',
                style: AppTypography.bodyMedium.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryTeal,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Shared under emergency access provisions',
            style: TextStyle(fontSize: 10, color: AppColors.textLight, fontStyle: FontStyle.italic),
          ),
          const SizedBox(height: 14),

          // Blood group (prominent)
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  summary.bloodGroup,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(summary.patientName, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                  Text('ABHA: ${summary.abhaId}', style: AppTypography.bodySmall),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          if (summary.allergies.isNotEmpty) ...[
            _section('⚠️ Allergies', summary.allergies, const Color(0xFFFEE2E2), const Color(0xFFDC2626)),
            const SizedBox(height: 10),
          ],
          if (summary.existingConditions.isNotEmpty) ...[
            _section('🩺 Conditions', summary.existingConditions, AppColors.warmYellow, AppColors.goldAmber),
            const SizedBox(height: 10),
          ],
          if (summary.currentMedications.isNotEmpty) ...[
            _section('💊 Medications', summary.currentMedications, AppColors.lightTeal, AppColors.primaryTeal),
            const SizedBox(height: 10),
          ],

          // Emergency contact
          if (summary.emergencyContactName.isNotEmpty) ...[
            const Divider(height: 16),
            Row(
              children: [
                const Icon(LucideIcons.phoneCall, size: 14, color: AppColors.primaryTeal),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${summary.emergencyContactName} (${summary.emergencyContactPhone})',
                    style: AppTypography.bodySmall.copyWith(color: AppColors.textDark, fontWeight: FontWeight.w600),
                  ),
                ),
                InkWell(
                  onTap: () async {
                    await launchUrl(Uri.parse('tel:${summary.emergencyContactPhone}'));
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primaryTeal,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('Call', style: TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _section(String title, List<String> items, Color bg, Color fg) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: items.map((item) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
            child: Text(item, style: TextStyle(fontSize: 11, color: fg, fontWeight: FontWeight.w600)),
          )).toList(),
        ),
      ],
    );
  }
}
