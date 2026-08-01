// lib/features/emergency/presentation/screens/emergency_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../auth/auth_provider.dart';
import '../../data/models/emergency_report_model.dart';
import '../providers/emergency_provider.dart';
import '../widgets/dispatch_status_timeline.dart';
import '../widgets/first_aid_card.dart';
import '../widgets/dos_and_donts_card.dart';
import '../widgets/photo_capture_widget.dart';
import '../widgets/voice_note_widget.dart';

class EmergencyScreen extends ConsumerStatefulWidget {
  const EmergencyScreen({super.key});

  @override
  ConsumerState<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends ConsumerState<EmergencyScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  String? _photoPath;
  String? _voiceNotePath;

  @override
  void initState() {
    super.initState();

    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.88, end: 1.05).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );

    // Start location fetch immediately & select default type so SOS button is ready instantly
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final notifier = ref.read(emergencyProvider.notifier);
      notifier.fetchLocation();
      if (ref.read(emergencyProvider).selectedType == null) {
        notifier.selectType(EmergencyType.roadAccident);
      }
    });
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  void _onSosTap() {
    final state = ref.read(emergencyProvider);
    final type = state.selectedType ?? EmergencyType.roadAccident;

    final patient = ref.read(authProvider).patient;
    ref.read(emergencyProvider.notifier).dispatch(
      type: type,
      photoPath: _photoPath,
      voiceNotePath: _voiceNotePath,
      reporterUserId: patient?.uid,
      abhaId: null, // ABHA entered manually if needed
    );
  }

  Future<void> _onCancel() async {
    final state = ref.read(emergencyProvider);
    final reportId = state.reportId;

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _CancelConfirmSheet(),
    );

    if (confirmed == true) {
      if (reportId != null) {
        await ref.read(emergencyProvider.notifier).cancel(reportId, 'mistake');
      }
      if (mounted) context.pop();
    }
  }

  void _showDuplicateModal(EmergencyState state) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(LucideIcons.info, color: AppColors.goldAmber),
            SizedBox(width: 10),
            Text('Help Is Already On the Way'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              state.duplicateMessage ?? 'An ambulance has already been dispatched for this location.',
              style: AppTypography.bodyMedium,
            ),
            const SizedBox(height: 16),
            if (state.existingEtaSeconds != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.lightTeal,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.clock, size: 18, color: AppColors.primaryTeal),
                    const SizedBox(width: 8),
                    Text(
                      'ETA: ~${(state.existingEtaSeconds! / 60).ceil()} minutes',
                      style: AppTypography.titleMedium.copyWith(color: AppColors.primaryTeal),
                    ),
                  ],
                ),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          if (state.existingReportId != null)
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                context.push('/emergency/tracking/${state.existingReportId}',
                    extra: {'eta': state.existingEtaSeconds ?? 300});
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryTeal),
              child: const Text('Track Ambulance', style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(emergencyProvider);

    // Handle duplicate detection
    ref.listen<EmergencyState>(emergencyProvider, (prev, next) {
      if (prev?.duplicateMessage == null && next.duplicateMessage != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _showDuplicateModal(next));
      }
      // Navigate to tracking on dispatch
      if (prev?.reportId == null && next.reportId != null &&
          next.status == EmergencyStatus.dispatched) {
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            context.push('/emergency/tracking/${next.reportId}',
                extra: {'eta': next.etaSeconds, 'ambulance': next.ambulance, 'hospital': next.hospital});
          }
        });
      }
    });

    final isDispatching = state.status == EmergencyStatus.locating ||
        state.status == EmergencyStatus.checkingDuplicate ||
        state.status == EmergencyStatus.submitting;
    final isDispatched = state.status == EmergencyStatus.dispatched;

    return Scaffold(
      backgroundColor: AppColors.bgMain,
      body: CustomScrollView(
        slivers: [
          // ── App Bar ──────────────────────────────────────────────────────
          SliverAppBar(
            pinned: true,
            backgroundColor: const Color(0xFFB91C1C),
            foregroundColor: Colors.white,
            surfaceTintColor: Colors.transparent,
            leading: IconButton(
              onPressed: () => context.pop(),
              icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
            ),
            title: const Row(
              children: [
                Text(
                  '🚨 Emergency Report',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () async {
                  final uri = Uri.parse('tel:108');
                  if (await canLaunchUrl(uri)) launchUrl(uri);
                },
                child: const Text(
                  'Call 108',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),

                  // ── GPS Location status ─────────────────────────────────
                  _LocationBar(
                    loading: state.locationLoading,
                    address: state.locationAddress,
                    error: state.locationError,
                    onRetry: () => ref.read(emergencyProvider.notifier).fetchLocation(),
                  ),
                  const SizedBox(height: 20),

                  // ── SOS Button ──────────────────────────────────────────
                  if (!isDispatched) ...[
                    Center(
                      child: _SosPulseButton(
                        pulseAnim: _pulseAnim,
                        enabled: !isDispatching,
                        isLoading: isDispatching,
                        onTap: _onSosTap,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (!isDispatching)
                      Center(
                        child: Text(
                          state.selectedType == null
                              ? 'Select emergency type below, then tap'
                              : 'Tap to dispatch emergency help',
                          style: AppTypography.bodySmall.copyWith(color: AppColors.textLight, fontSize: 12),
                        ),
                      ),
                    const SizedBox(height: 24),

                    // ── Emergency type selector ─────────────────────────────
                    Text('Emergency Type', style: AppTypography.titleMedium.copyWith(fontSize: 16)),
                    const SizedBox(height: 12),
                    _EmergencyTypeSelector(
                      selected: state.selectedType,
                      onSelect: (t) => ref.read(emergencyProvider.notifier).selectType(t),
                    ),
                    const SizedBox(height: 24),

                    // ── Photo capture ───────────────────────────────────────
                    PhotoCaptureWidget(
                      analysisResult: state.severityResult,
                      analyzingImage: state.analyzingImage,
                      onPhotoSelected: (path) {
                        _photoPath = path;
                        if (path != null) {
                          ref.read(emergencyProvider.notifier).analyzeImage(path);
                        }
                      },
                    ),
                    const SizedBox(height: 14),

                    // ── Voice note ──────────────────────────────────────────
                    VoiceNoteWidget(
                      onRecordingComplete: (path) {
                        _voiceNotePath = path;
                      },
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Dispatch timeline (shown during/after dispatch) ──────
                  if (isDispatching || isDispatched) ...[
                    DispatchStatusTimeline(steps: state.dispatchSteps),
                    const SizedBox(height: 20),
                    if (isDispatched && state.ambulance != null)
                      _DispatchedCard(
                        ambulance: state.ambulance!,
                        hospital: state.hospital,
                        etaSeconds: state.etaSeconds,
                        reportId: state.reportId!,
                      ),
                    const SizedBox(height: 20),
                  ],

                  // ── Error state ─────────────────────────────────────────
                  if (state.error != null) ...[
                    _ErrorCard(
                      error: state.error!,
                      onRetry: _onSosTap,
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ── First Aid & Dos/Donts (shown after dispatch or always) ─
                  if (state.selectedType != null) ...[
                    FirstAidCard(emergencyType: state.selectedType),
                    const SizedBox(height: 14),
                    DosAndDontsCard(emergencyType: state.selectedType),
                    const SizedBox(height: 24),
                  ],

                  // ── Cancel button ────────────────────────────────────────
                  if (isDispatched || isDispatching)
                    Center(
                      child: TextButton(
                        onPressed: _onCancel,
                        child: const Text(
                          'Cancel Report',
                          style: TextStyle(color: AppColors.textLight, fontSize: 13),
                        ),
                      ),
                    ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Location Bar ─────────────────────────────────────────────────────────────

class _LocationBar extends StatelessWidget {
  final bool loading;
  final String address;
  final String? error;
  final VoidCallback onRetry;

  const _LocationBar({
    required this.loading,
    required this.address,
    this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onRetry,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: error != null
                ? const Color(0xFFFECACA)
                : address.isNotEmpty
                    ? const Color(0xFFA7F3D0)
                    : AppColors.borderCustom,
          ),
        ),
        child: Row(
          children: [
            if (loading)
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryTeal),
              )
            else if (error != null)
              const Icon(LucideIcons.mapPinOff, size: 18, color: Color(0xFFDC2626))
            else if (address.isNotEmpty)
              const Icon(LucideIcons.mapPin, size: 18, color: AppColors.emeraldGreen)
            else
              const Icon(LucideIcons.mapPin, size: 18, color: AppColors.textLight),
            const SizedBox(width: 10),
            Expanded(
              child: loading
                  ? const Text('Getting your GPS location...', style: TextStyle(fontSize: 12, color: AppColors.textLight))
                  : error != null
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(error!, style: const TextStyle(fontSize: 11, color: Color(0xFFDC2626))),
                            const SizedBox(height: 2),
                            const Text(
                              'Tap to retry',
                              style: TextStyle(fontSize: 11, color: AppColors.primaryTeal, fontWeight: FontWeight.w600),
                            ),
                          ],
                        )
                      : address.isNotEmpty
                          ? Text(
                              address,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDark),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            )
                          : const Text('Tap to get location', style: TextStyle(fontSize: 12, color: AppColors.textLight)),
            ),
            if (error != null)
              const Icon(LucideIcons.refreshCw, size: 16, color: AppColors.primaryTeal),
            if (address.isNotEmpty && error == null)
              const Icon(LucideIcons.checkCircle2, size: 16, color: AppColors.emeraldGreen),
          ],
        ),
      ),
    );
  }
}

// ─── SOS Pulse Button ─────────────────────────────────────────────────────────

class _SosPulseButton extends StatelessWidget {
  final Animation<double> pulseAnim;
  final bool enabled;
  final bool isLoading;
  final VoidCallback onTap;

  const _SosPulseButton({
    required this.pulseAnim,
    required this.enabled,
    required this.isLoading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: pulseAnim,
      builder: (ctx, child) => GestureDetector(
        onTap: enabled ? onTap : null,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Outer ring 2
            Container(
              width: 160 * pulseAnim.value,
              height: 160 * pulseAnim.value,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (enabled ? const Color(0xFFDC2626) : AppColors.borderCustom)
                    .withValues(alpha: 0.08 * (2 - pulseAnim.value)),
              ),
            ),
            // Outer ring 1
            Container(
              width: 130 * pulseAnim.value,
              height: 130 * pulseAnim.value,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (enabled ? const Color(0xFFDC2626) : AppColors.borderCustom)
                    .withValues(alpha: 0.12 * (2 - pulseAnim.value)),
              ),
            ),
            // Main button
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: enabled
                    ? const RadialGradient(
                        colors: [Color(0xFFEF4444), Color(0xFFB91C1C)],
                        center: Alignment(-0.3, -0.3),
                      )
                    : const RadialGradient(
                        colors: [Color(0xFFD1D5DB), Color(0xFF9CA3AF)],
                      ),
                boxShadow: enabled
                    ? [
                        BoxShadow(
                          color: const Color(0xFFDC2626).withValues(alpha: 0.5),
                          blurRadius: 20,
                          spreadRadius: 2,
                          offset: const Offset(0, 6),
                        ),
                      ]
                    : null,
              ),
              child: Center(
                child: isLoading
                    ? const SizedBox(
                        width: 36,
                        height: 36,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                      )
                    : const Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('🚨', style: TextStyle(fontSize: 30)),
                          Text(
                            'SOS',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 18,
                              letterSpacing: 2,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Emergency Type Selector ──────────────────────────────────────────────────

class _EmergencyTypeSelector extends StatelessWidget {
  final EmergencyType? selected;
  final ValueChanged<EmergencyType> onSelect;

  const _EmergencyTypeSelector({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final types = EmergencyType.values;
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: types.map((type) {
        final isActive = type == selected;
        return GestureDetector(
          onTap: () => onSelect(type),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isActive ? const Color(0xFFDC2626) : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isActive ? const Color(0xFFDC2626) : AppColors.borderCustom,
                width: isActive ? 2 : 1,
              ),
              boxShadow: isActive
                  ? [
                      BoxShadow(
                        color: const Color(0xFFDC2626).withValues(alpha: 0.25),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      )
                    ]
                  : null,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(type.emoji, style: const TextStyle(fontSize: 16)),
                const SizedBox(width: 6),
                Text(
                  type.label,
                  style: TextStyle(
                    color: isActive ? Colors.white : AppColors.textDark,
                    fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ─── Dispatched Card (after successful dispatch) ──────────────────────────────

class _DispatchedCard extends StatefulWidget {
  final dynamic ambulance;
  final dynamic hospital;
  final int etaSeconds;
  final String reportId;

  const _DispatchedCard({
    required this.ambulance,
    required this.hospital,
    required this.etaSeconds,
    required this.reportId,
  });

  @override
  State<_DispatchedCard> createState() => _DispatchedCardState();
}

class _DispatchedCardState extends State<_DispatchedCard> {
  late int _eta;

  @override
  void initState() {
    super.initState();
    _eta = widget.etaSeconds;
    // Countdown timer
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() {
        if (_eta > 0) _eta--;
      });
      return _eta > 0;
    });
  }

  String _formatEta(int s) {
    if (s <= 0) return 'Arriving...';
    final m = s ~/ 60;
    final sec = s % 60;
    if (m == 0) return '${sec}s';
    return '${m}m ${sec}s';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF065F46), Color(0xFF047857)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF065F46).withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Text('🚑', style: TextStyle(fontSize: 22)),
              SizedBox(width: 10),
              Text(
                'Ambulance Dispatched',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 17),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _infoBox('ETA', _formatEta(_eta), Colors.white.withValues(alpha: 0.15)),
              ),
              const SizedBox(width: 10),
              if (widget.ambulance != null)
                Expanded(
                  child: _infoBox(
                    'Ambulance',
                    widget.ambulance.vehicleNumber,
                    Colors.white.withValues(alpha: 0.15),
                  ),
                ),
            ],
          ),
          if (widget.hospital != null) ...[
            const SizedBox(height: 10),
            _infoBox(
              '🏥 Hospital',
              widget.hospital.name,
              Colors.white.withValues(alpha: 0.15),
            ),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => context.push(
                '/emergency/tracking/${widget.reportId}',
                extra: {'eta': _eta, 'ambulance': widget.ambulance, 'hospital': widget.hospital},
              ),
              icon: const Icon(LucideIcons.mapPin, size: 18),
              label: const Text('Track Ambulance Live'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF065F46),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoBox(String label, String value, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.7), fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 14, color: Colors.white, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

// ─── Error Card ───────────────────────────────────────────────────────────────

class _ErrorCard extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _ErrorCard({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final isNetworkError = error.toLowerCase().contains('108') ||
        error.toLowerCase().contains('network') ||
        error.toLowerCase().contains('timeout');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.alertTriangle, size: 18, color: Color(0xFFDC2626)),
              SizedBox(width: 8),
              Text('Dispatch Failed', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFDC2626))),
            ],
          ),
          const SizedBox(height: 8),
          Text(error, style: const TextStyle(fontSize: 12, color: Color(0xFF7F1D1D))),
          const SizedBox(height: 12),
          if (isNetworkError)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final uri = Uri.parse('tel:108');
                  if (await canLaunchUrl(uri)) launchUrl(uri);
                },
                icon: const Icon(Icons.phone, size: 16),
                label: const Text('Call 108 (Emergency)'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFDC2626),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: onRetry,
            child: const Text('Retry Dispatch'),
          ),
        ],
      ),
    );
  }
}

// ─── Cancel Confirm Sheet ─────────────────────────────────────────────────────

class _CancelConfirmSheet extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40, height: 4,
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(color: AppColors.borderCustom, borderRadius: BorderRadius.circular(2)),
          ),
          const Icon(LucideIcons.alertTriangle, size: 40, color: Color(0xFFD97706)),
          const SizedBox(height: 16),
          const Text(
            'Cancel Emergency Report?',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          const Text(
            'Cancelling will stand down the dispatched ambulance. Only cancel if the emergency has been resolved or was reported by mistake.',
            style: TextStyle(fontSize: 13, color: AppColors.textMedium, height: 1.5),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Yes, Cancel & Stand Down', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.pop(context, false),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.borderCustom),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('No, Keep Active', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }
}
