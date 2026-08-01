// lib/features/emergency/presentation/screens/ambulance_tracking_screen.dart

import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../data/models/ambulance_model.dart';
import '../../data/models/hospital_model.dart';
import '../providers/ambulance_tracking_provider.dart';
import '../providers/emergency_provider.dart';
import '../widgets/abha_consent_sheet.dart';

class AmbulanceTrackingScreen extends ConsumerStatefulWidget {
  final String reportId;
  const AmbulanceTrackingScreen({super.key, required this.reportId});

  @override
  ConsumerState<AmbulanceTrackingScreen> createState() =>
      _AmbulanceTrackingScreenState();
}

class _AmbulanceTrackingScreenState
    extends ConsumerState<AmbulanceTrackingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pingCtrl;
  AmbulanceModel? _ambulance;
  HospitalModel? _hospital;
  int _etaSeconds = 272; // Default ~4 min 32 sec

  @override
  void initState() {
    super.initState();
    _pingCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1000))
      ..repeat(reverse: true);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(ambulanceTrackingProvider.notifier)
          .startTracking(widget.reportId, _etaSeconds);
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final state = ref.read(emergencyProvider);
    _ambulance = state.ambulance;
    _hospital = state.hospital;
    if (state.etaSeconds > 0) {
      _etaSeconds = state.etaSeconds;
    }
  }

  @override
  void dispose() {
    _pingCtrl.dispose();
    ref.read(ambulanceTrackingProvider.notifier).stopTracking();
    super.dispose();
  }

  Future<void> _onCancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(LucideIcons.alertTriangle, color: Color(0xFFDC2626)),
            SizedBox(width: 10),
            Text('Cancel Dispatch?'),
          ],
        ),
        content: const Text('Are you sure you want to cancel the emergency ambulance dispatch?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No, Keep Active')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            child: const Text('Yes, Cancel', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(emergencyProvider.notifier).cancel(widget.reportId, 'User requested cancel');
      if (mounted) context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final trackingState = ref.watch(ambulanceTrackingProvider);
    final abhaState = ref.watch(abhaProvider);

    if (trackingState.etaSeconds > 0) {
      _etaSeconds = trackingState.etaSeconds.clamp(180, 300);
    }

    final driverName = _ambulance?.driverName ?? 'Rajesh Kumar';
    final vehicleNum = _ambulance?.vehicleNumber ?? 'DL-01-AB-1234';
    final driverPhone = _ambulance?.driverPhone ?? '+919876543210';
    final hospitalName = _hospital?.name ?? 'Apollo Hospital';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          // ── App Bar Header ───────────────────────────────────────────────
          SliverAppBar(
            pinned: true,
            backgroundColor: Colors.white,
            surfaceTintColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              onPressed: () => context.pop(),
              icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF0F172A)),
            ),
            title: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Emergency Tracking',
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
                Text(
                  'Live Updates',
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            actions: [
              Container(
                margin: const EdgeInsets.only(right: 16, top: 10, bottom: 10),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7, height: 7,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFF16A34A),
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Live',
                          style: TextStyle(color: Color(0xFF16A34A), fontSize: 10, fontWeight: FontWeight.w800),
                        ),
                        Text(
                          'Connected',
                          style: TextStyle(color: Color(0xFF16A34A), fontSize: 8),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          SliverToBoxAdapter(
            child: Column(
              children: [
                // ── Interactive Light Theme Vector Map ─────────────────────
                _LightTrackingMapView(
                  pingCtrl: _pingCtrl,
                  trackingState: trackingState,
                  hospitalName: hospitalName,
                ),

                // ── Main Content Sheet Card ─────────────────────────────────
                Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── Ambulance Status Header ──────────────────────────
                      Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: const BoxDecoration(
                              color: Color(0xFFF0FDF4),
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: Text('🚑', style: TextStyle(fontSize: 26)),
                            ),
                          ),
                          const SizedBox(width: 14),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Ambulance En Route',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF0F766E),
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Help is on the way',
                                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                          GestureDetector(
                            onTap: () => launchUrl(Uri.parse('tel:$driverPhone')),
                            child: Container(
                              width: 42,
                              height: 42,
                              decoration: const BoxDecoration(
                                color: Color(0xFFF0FDF4),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(LucideIcons.phone, color: Color(0xFF0F766E), size: 20),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // ── ETA & Distance Columns ───────────────────────────
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            // Left Box: ETA
                            Expanded(
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFF0FDF4),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(LucideIcons.clock, size: 20, color: Color(0xFF0F766E)),
                                  ),
                                  const SizedBox(width: 10),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('ETA', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                      const SizedBox(height: 2),
                                      Text(
                                        _formatEtaText(_etaSeconds),
                                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F766E)),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Container(width: 1, height: 36, color: const Color(0xFFCBD5E1)),
                            // Right Box: Distance
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.only(left: 16),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFF0FDF4),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(LucideIcons.mapPin, size: 20, color: Color(0xFF0F766E)),
                                    ),
                                    const SizedBox(width: 10),
                                    const Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Distance', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                        SizedBox(height: 2),
                                        Text(
                                          '2.1 km',
                                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F766E)),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // ── Step Progress Timeline ───────────────────────────
                      _buildProgressTimeline(),
                      const SizedBox(height: 24),

                      // ── Driver & Vehicle Card ────────────────────────────
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: const BoxDecoration(
                                color: Color(0xFFF0FDF4),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(LucideIcons.user, size: 18, color: Color(0xFF0F766E)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Driver', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                  Text(driverName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                                ],
                              ),
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Vehicle Number', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                  Text(vehicleNum, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                                ],
                              ),
                            ),
                            OutlinedButton.icon(
                              onPressed: () => launchUrl(Uri.parse('tel:$driverPhone')),
                              icon: const Icon(LucideIcons.phone, size: 13),
                              label: const Text('Call'),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0xFF0F766E)),
                                foregroundColor: const Color(0xFF0F766E),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // ── Hospital Card ────────────────────────────────────
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: const BoxDecoration(
                                color: Color(0xFFF0FDF4),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(LucideIcons.building2, size: 18, color: Color(0xFF0F766E)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Hospital', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                  Text(hospitalName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                                  const Text('Trauma Center', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDCFCE7),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.check_circle, size: 13, color: Color(0xFF16A34A)),
                                  SizedBox(width: 4),
                                  Text('Hospital Notified', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF16A34A))),
                                ],
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(LucideIcons.chevronRight, size: 16, color: Color(0xFF94A3B8)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // ── Medical Information (Optional) ABHA Card ─────────
                      GestureDetector(
                        onTap: () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => AbhaConsentSheet(
                              abhaId: 'XX-XXXX-XXXX-XXXX',
                              reportId: widget.reportId,
                              reporterUserId: null,
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: const BoxDecoration(
                                  color: Color(0xFFF0FDF4),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(LucideIcons.shieldCheck, size: 18, color: Color(0xFF0F766E)),
                              ),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Medical Information (Optional)',
                                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                                    ),
                                    SizedBox(height: 2),
                                    Text(
                                      'Share victim\'s ABHA records with hospital to help provide faster care.',
                                      style: TextStyle(fontSize: 11, color: Color(0xFF64748B), height: 1.3),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Icon(LucideIcons.chevronRight, size: 16, color: Color(0xFF94A3B8)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // ── Bottom Action Bar (3 Buttons) ─────────────────────
                      Row(
                        children: [
                          // Button 1: Share Location
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Live location link copied! Share with family or emergency contacts.')),
                                );
                              },
                              icon: const Icon(LucideIcons.share2, size: 14),
                              label: const Text('Share Location', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0xFFA7F3D0)),
                                backgroundColor: const Color(0xFFF0FDF4),
                                foregroundColor: const Color(0xFF0F766E),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Button 2: Call Driver
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => launchUrl(Uri.parse('tel:$driverPhone')),
                              icon: const Icon(LucideIcons.phoneCall, size: 14),
                              label: const Text('Call Driver', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFDC2626),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Button 3: Cancel Request
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _onCancel,
                              icon: const Icon(LucideIcons.x, size: 14),
                              label: const Text('Cancel Request', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0xFFFECACA)),
                                backgroundColor: const Color(0xFFFEF2F2),
                                foregroundColor: const Color(0xFFDC2626),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatEtaText(int s) {
    if (s <= 0) return 'Arriving now';
    final m = s ~/ 60;
    final sec = s % 60;
    if (m == 0) return '$sec sec';
    return '$m min $sec sec';
  }

  // ── Step Progress Timeline Widget ─────────────────────────────────────────
  Widget _buildProgressTimeline() {
    return Column(
      children: [
        Row(
          children: [
            _buildStepDot(isDone: true, isCurrent: false, icon: LucideIcons.check),
            Expanded(child: Container(height: 2, color: const Color(0xFF10B981))),
            _buildStepDot(isDone: true, isCurrent: false, icon: LucideIcons.check),
            Expanded(child: Container(height: 2, color: const Color(0xFF10B981))),
            _buildStepDot(isDone: false, isCurrent: true, icon: LucideIcons.truck),
            Expanded(child: Container(height: 2, color: const Color(0xFFE2E8F0))),
            _buildStepDot(isDone: false, isCurrent: false, icon: LucideIcons.building2),
          ],
        ),
        const SizedBox(height: 8),
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 60,
              child: Column(
                children: [
                  Text('Reported', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                  Text('09:32 AM', style: TextStyle(fontSize: 9, color: Color(0xFF94A3B8))),
                ],
              ),
            ),
            SizedBox(
              width: 70,
              child: Column(
                children: [
                  Text('Ambulance', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                  Text('Assigned', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                  Text('09:33 AM', style: TextStyle(fontSize: 9, color: Color(0xFF94A3B8))),
                ],
              ),
            ),
            SizedBox(
              width: 60,
              child: Column(
                children: [
                  Text('En Route', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF0F766E))),
                  Text('09:35 AM', style: TextStyle(fontSize: 9, color: Color(0xFF0F766E))),
                ],
              ),
            ),
            SizedBox(
              width: 60,
              child: Column(
                children: [
                  Text('Arriving', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: Color(0xFF94A3B8))),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStepDot({required bool isDone, required bool isCurrent, required IconData icon}) {
    if (isDone) {
      return Container(
        width: 24,
        height: 24,
        decoration: const BoxDecoration(color: Color(0xFF0F766E), shape: BoxShape.circle),
        child: const Icon(LucideIcons.check, size: 14, color: Colors.white),
      );
    }
    if (isCurrent) {
      return Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: const Color(0xFF0F766E),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(color: const Color(0xFF0F766E).withValues(alpha: 0.3), blurRadius: 6, spreadRadius: 2),
          ],
        ),
        child: Icon(icon, size: 14, color: Colors.white),
      );
    }
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFCBD5E1)),
      ),
      child: Icon(icon, size: 12, color: const Color(0xFF94A3B8)),
    );
  }
}

// ─── Light Tracking Map View ──────────────────────────────────────────────────

class _LightTrackingMapView extends StatefulWidget {
  final AnimationController pingCtrl;
  final AmbulanceTrackingState trackingState;
  final String hospitalName;

  const _LightTrackingMapView({
    required this.pingCtrl,
    required this.trackingState,
    required this.hospitalName,
  });

  @override
  State<_LightTrackingMapView> createState() => _LightTrackingMapViewState();
}

class _LightTrackingMapViewState extends State<_LightTrackingMapView>
    with SingleTickerProviderStateMixin {
  late AnimationController _ambCtrl;
  late Animation<double> _ambProgress;

  @override
  void initState() {
    super.initState();
    _ambCtrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 5))
      ..repeat(reverse: false);
    _ambProgress = Tween<double>(begin: 0.2, end: 0.85).animate(CurvedAnimation(
      parent: _ambCtrl,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _ambCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 260,
      color: const Color(0xFFF1F5F9),
      child: Stack(
        children: [
          // Light Map Grid & Road Canvas
          CustomPaint(
            size: const Size(double.infinity, 260),
            painter: _LightMapCanvasPainter(),
          ),
          // Route curve line
          CustomPaint(
            size: const Size(double.infinity, 260),
            painter: _TealRoutePainter(),
          ),

          // Accident Location Pin (Left)
          Positioned(
            left: 30,
            top: 140,
            child: Column(
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    AnimatedBuilder(
                      animation: widget.pingCtrl,
                      builder: (ctx, _) => Container(
                        width: 32 * widget.pingCtrl.value,
                        height: 32 * widget.pingCtrl.value,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFFDC2626).withValues(alpha: 0.25 * (1 - widget.pingCtrl.value + 0.1)),
                        ),
                      ),
                    ),
                    const Icon(Icons.location_on, color: Color(0xFFDC2626), size: 30),
                  ],
                ),
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'Accident\nLocation',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFFDC2626), height: 1.1),
                  ),
                ),
              ],
            ),
          ),

          // Apollo Hospital Pin (Top Right)
          Positioned(
            right: 40,
            top: 30,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F766E),
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(color: const Color(0xFF0F766E).withValues(alpha: 0.3), blurRadius: 8),
                    ],
                  ),
                  child: const Icon(LucideIcons.plus, color: Colors.white, size: 18),
                ),
                const SizedBox(height: 4),
                Text(
                  widget.hospitalName,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                ),
              ],
            ),
          ),

          // Animated Ambulance Marker along route curve
          AnimatedBuilder(
            animation: _ambProgress,
            builder: (ctx, _) {
              final progress = widget.trackingState.etaSeconds > 0
                  ? (1 - (widget.trackingState.etaSeconds / 300.0)).clamp(0.2, 0.85)
                  : _ambProgress.value;

              final width = MediaQuery.of(ctx).size.width;
              final x = 50 + (width - 120) * progress;
              final y = 150 - math.sin(progress * math.pi) * 85;

              return Positioned(
                left: x - 25,
                top: y - 35,
                child: Column(
                  children: [
                    // Tooltip Callout "En Route"
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 6, offset: const Offset(0, 2)),
                        ],
                      ),
                      child: const Text(
                        'En Route',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF0F766E)),
                      ),
                    ),
                    const SizedBox(height: 2),
                    // Ambulance Icon
                    Container(
                      width: 36,
                      height: 36,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: Color(0x330F766E), blurRadius: 10, spreadRadius: 2),
                        ],
                      ),
                      child: const Center(
                        child: Text('🚑', style: TextStyle(fontSize: 20)),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),

          // Floating Action Recenter Button
          Positioned(
            right: 16,
            bottom: 16,
            child: Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 2)),
                ],
              ),
              child: const Icon(LucideIcons.locate, size: 20, color: Color(0xFF0F172A)),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Light Map Background Canvas Painter ───────────────────────────────────────
class _LightMapCanvasPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Light map background
    final bgPaint = Paint()..color = const Color(0xFFF1F5F9);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    // Green parks
    final parkPaint = Paint()..color = const Color(0xFFE2F5EA);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.1, 20, 100, 60), const Radius.circular(16)),
      parkPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.6, 170, 120, 50), const Radius.circular(16)),
      parkPaint,
    );

    // Roads
    final roadPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 10
      ..style = PaintingStyle.stroke;

    final roadPath = Path();
    roadPath.moveTo(0, size.height * 0.5);
    roadPath.lineTo(size.width, size.height * 0.4);
    canvas.drawPath(roadPath, roadPaint);

    final roadPath2 = Path();
    roadPath2.moveTo(size.width * 0.3, 0);
    roadPath2.lineTo(size.width * 0.4, size.height);
    canvas.drawPath(roadPath2, roadPaint);

    // Blue river curve
    final riverPaint = Paint()
      ..color = const Color(0xFFBFDBFE).withValues(alpha: 0.6)
      ..strokeWidth = 18
      ..style = PaintingStyle.stroke;

    final riverPath = Path();
    riverPath.moveTo(size.width * 0.5, size.height);
    riverPath.quadraticBezierTo(size.width * 0.7, size.height * 0.5, size.width, size.height * 0.2);
    canvas.drawPath(riverPath, riverPaint);
  }

  @override
  bool shouldRepaint(_) => false;
}

// ── Teal Route Curve Painter ──────────────────────────────────────────────────
class _TealRoutePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final routePaint = Paint()
      ..color = const Color(0xFF0F766E)
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    path.moveTo(45, 155);
    path.quadraticBezierTo(
      size.width * 0.4, 50,
      size.width - 50, 45,
    );
    canvas.drawPath(path, routePaint);
  }

  @override
  bool shouldRepaint(_) => false;
}
