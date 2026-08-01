// lib/features/home/home_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/models/appointment_model.dart';
import '../../core/services/firebase_service.dart';
import '../../core/localization/language_provider.dart';
import '../auth/auth_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final FirebaseService _firebaseService = FirebaseService();
  AppointmentModel? _upcomingAppointment;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    try {
      final patient = ref.read(authProvider).patient;
      if (patient != null) {
        final apts = await _firebaseService.getPatientAppointments(patient.uid);
        if (apts.isNotEmpty) {
          _upcomingAppointment = apts.first;
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  String _getGreeting(WidgetRef ref) {
    final hour = DateTime.now().hour;
    final langNotifier = ref.read(languageProvider.notifier);
    if (hour >= 5 && hour < 12) return langNotifier.translate('good_morning');
    if (hour >= 12 && hour < 17) return langNotifier.translate('good_afternoon');
    if (hour >= 17 && hour < 21) return langNotifier.translate('good_evening');
    return langNotifier.translate('good_morning');
  }

  @override
  Widget build(BuildContext context) {
    final patient = ref.watch(authProvider).patient;
    ref.watch(languageProvider); // Watch language changes
    final tr = ref.read(languageProvider.notifier).translate;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        SystemNavigator.pop();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        body: SafeArea(
          top: true,
          bottom: false,
          child: Column(
            children: [
              // ── Top Horizontal Status Bar Separator ─────────────────────────
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 6),
                decoration: const BoxDecoration(
                  color: Color(0xFFF8FAFC),
                  border: Border(
                    bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
                  ),
                ),
                child: Center(
                  child: Container(
                    width: 50,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFF94A3B8),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator(color: Color(0xFF0F766E)))
                    : RefreshIndicator(
                        onRefresh: _loadDashboardData,
                        color: const Color(0xFF0F766E),
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                      const SizedBox(height: 8),

                      // ── Top Header / App Bar ────────────────────────────
                      Row(
                        children: [
                          Transform.translate(
                            offset: const Offset(-42, 0),
                            child: Image.asset(
                              'assets/images/Aayu_logo-removebg-preview.png',
                              height: 80,
                              fit: BoxFit.contain,
                              errorBuilder: (ctx, err, stack) => Image.asset(
                                'assets/Aayu_logo-removebg-preview.png',
                                height: 80,
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                          const Spacer(),
                          // Bell notification icon
                          GestureDetector(
                            onTap: () => context.push('/notifications'),
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                shape: BoxShape.circle,
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  const Icon(
                                    LucideIcons.bell,
                                    color: Color(0xFF64748B),
                                    size: 18,
                                  ),
                                  Positioned(
                                    right: 8,
                                    top: 8,
                                    child: Container(
                                      width: 7,
                                      height: 7,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFDC2626),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // User Initials Avatar
                          GestureDetector(
                            onTap: () => context.go('/profile'),
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                shape: BoxShape.circle,
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: Center(
                                child: Text(
                                  patient != null && patient.name.isNotEmpty
                                      ? patient.name.split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join()
                                      : 'PS',
                                  style: const TextStyle(
                                    color: Color(0xFF64748B),
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),

                      // ── Greeting Title ─────────────────────────────────
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _getGreeting(ref),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            patient?.name ?? 'Priya Sharma',
                            style: const TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            tr('health_tagline'),
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // ── Two Side-By-Side Stats Cards (ABHA ID & Blood Group) ──
                      Row(
                        children: [
                          // Left Card: ABHA ID
                          Expanded(
                            child: GestureDetector(
                              onTap: () => _showEditAbhaSheet(context, patient),
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.02),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: const BoxDecoration(
                                            color: Color(0xFFF0FDF4),
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(LucideIcons.shieldCheck, size: 18, color: Color(0xFF0F766E)),
                                        ),
                                        const Spacer(),
                                        const Icon(LucideIcons.pencil, size: 14, color: Color(0xFF0F766E)),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      tr('abha_id'),
                                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                                    ),
                                    const SizedBox(height: 2),
                                    Row(
                                      children: [
                                        Flexible(
                                          child: Text(
                                            patient?.abhaId != null && patient!.abhaId!.isNotEmpty ? patient.abhaId! : tr('verified'),
                                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        const Icon(Icons.check_circle, size: 14, color: Color(0xFF16A34A)),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      tr('last_synced_today'),
                                      style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Right Card: Blood Group
                          Expanded(
                            child: GestureDetector(
                              onTap: () => _showEditBloodGroupSheet(context, patient),
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.02),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: const BoxDecoration(
                                            color: Color(0xFFF0FDF4),
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(LucideIcons.mapPin, size: 18, color: Color(0xFF0F766E)),
                                        ),
                                        const Spacer(),
                                        const Icon(LucideIcons.pencil, size: 14, color: Color(0xFF0F766E)),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      tr('blood_group'),
                                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      patient?.bloodGroup ?? 'O+',
                                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      patient?.city != null ? '${patient!.city}, India' : 'Delhi, India',
                                      style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // ── Emergency Red Banner ("REPORT AN ACCIDENT") ──────
                      GestureDetector(
                        onTap: () => context.push('/emergency'),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFDC2626).withValues(alpha: 0.35),
                                blurRadius: 14,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              // Ambulance illustration
                              Container(
                                width: 58,
                                height: 58,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.15),
                                  shape: BoxShape.circle,
                                ),
                                child: const Center(
                                  child: Text('🚑', style: TextStyle(fontSize: 34)),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      tr('report_accident'),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 14,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      tr('witnessed_accident'),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    Text(
                                      tr('dispatch_ambulance_instantly'),
                                      style: const TextStyle(
                                        color: Color(0xFFFEE2E2),
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Circular right arrow button
                              Container(
                                width: 38,
                                height: 38,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(LucideIcons.chevronRight, color: Color(0xFFDC2626), size: 22),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // ── Quick Actions Section ────────────────────────────
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            tr('quick_actions'),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                          ),
                          GestureDetector(
                            onTap: () => context.go('/doctors'),
                            child: Text(
                              tr('view_all'),
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F766E)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildQuickActionItem(context, icon: LucideIcons.calendar, label: tr('book_appointment'), route: '/doctors'),
                          _buildQuickActionItem(context, icon: LucideIcons.fileText, label: tr('medical_records'), route: '/profile'),
                          _buildQuickActionItem(context, icon: LucideIcons.pill, label: tr('prescriptions'), route: '/profile'),
                          _buildQuickActionItem(context, icon: LucideIcons.flaskConical, label: tr('lab_reports'), route: '/profile'),
                          _buildQuickActionItem(context, icon: LucideIcons.user, label: tr('health_profile'), route: '/profile'),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // ── Upcoming Appointment Section ────────────────────
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            tr('upcoming_appointment'),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                          ),
                          GestureDetector(
                            onTap: () => context.go('/appointments'),
                            child: Text(
                              tr('view_all'),
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F766E)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _buildUpcomingAppointmentCard(context, tr),
                      const SizedBox(height: 24),

                      // ── Health Summary Section ───────────────────────────
                      Text(
                        tr('health_summary'),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.02),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildHealthSummaryCol(
                              icon: LucideIcons.heart,
                              iconColor: const Color(0xFF16A34A),
                              bgColor: const Color(0xFFF0FDF4),
                              val: '92%',
                              label: tr('health_score'),
                              subtext: tr('good'),
                              subtextColor: const Color(0xFF16A34A),
                            ),
                            _buildHealthSummaryCol(
                              icon: LucideIcons.shield,
                              iconColor: const Color(0xFF0F766E),
                              bgColor: const Color(0xFFF0FDF4),
                              val: '2',
                              label: tr('allergies'),
                            ),
                            _buildHealthSummaryCol(
                              icon: LucideIcons.fileText,
                              iconColor: const Color(0xFF0F766E),
                              bgColor: const Color(0xFFF0FDF4),
                              val: '18',
                              label: tr('reports'),
                            ),
                            _buildHealthSummaryCol(
                              icon: LucideIcons.pill,
                              iconColor: const Color(0xFF0F766E),
                              bgColor: const Color(0xFFF0FDF4),
                              val: '11',
                              label: tr('prescriptions'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
  }

  // ── Edit ABHA ID Sheet ────────────────────────────────────────────────────
  void _showEditAbhaSheet(BuildContext context, patient) {
    final ctrl = TextEditingController(text: patient?.abhaId ?? '');
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 20),
              const Row(children: [
                Icon(Icons.shield, color: Color(0xFF0F766E), size: 20),
                SizedBox(width: 8),
                Text('Edit ABHA ID', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
              ]),
              const SizedBox(height: 16),
              TextField(
                controller: ctrl,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: 'Enter your ABHA ID (e.g. 91-1234-5678-0001)',
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF0F766E), width: 2)),
                  prefixIcon: const Icon(Icons.badge_outlined, color: Color(0xFF0F766E)),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    if (patient == null) return;
                    final updated = patient.copyWith(abhaId: ctrl.text.trim());
                    await ref.read(authProvider.notifier).updateProfile(updated);
                    if (context.mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('ABHA ID updated!'), backgroundColor: Color(0xFF0F766E)));
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F766E),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Save ABHA ID', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  // ── Edit Blood Group Sheet ─────────────────────────────────────────────────
  void _showEditBloodGroupSheet(BuildContext context, patient) {
    final bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    String selected = patient?.bloodGroup ?? 'O+';
    final cityCtrl = TextEditingController(text: patient?.city ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)))),
                const SizedBox(height: 20),
                const Row(children: [
                  Icon(Icons.water_drop, color: Color(0xFF0F766E), size: 20),
                  SizedBox(width: 8),
                  Text('Edit Blood Group & City', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                ]),
                const SizedBox(height: 16),
                const Text('Blood Group', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: bloodGroups.map((bg) {
                    final isSelected = selected == bg;
                    return GestureDetector(
                      onTap: () => setState(() => selected = bg),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF0F766E) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isSelected ? const Color(0xFF0F766E) : const Color(0xFFE2E8F0)),
                        ),
                        child: Text(bg, style: TextStyle(fontWeight: FontWeight.w700, color: isSelected ? Colors.white : const Color(0xFF0F172A))),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                const Text('City', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                const SizedBox(height: 8),
                TextField(
                  controller: cityCtrl,
                  decoration: InputDecoration(
                    hintText: 'Your city (e.g. Mumbai)',
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF0F766E), width: 2)),
                    prefixIcon: const Icon(Icons.location_on_outlined, color: Color(0xFF0F766E)),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (patient == null) return;
                      final updated = patient.copyWith(bloodGroup: selected, city: cityCtrl.text.trim());
                      await ref.read(authProvider.notifier).updateProfile(updated);
                      if (context.mounted) {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Details updated!'), backgroundColor: Color(0xFF0F766E)));
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F766E),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Quick Action Item Widget ──────────────────────────────────────────────
  Widget _buildQuickActionItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String route,
  }) {
    return GestureDetector(
      onTap: () => context.go(route),
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: const Color(0xFF0F766E), size: 22),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Color(0xFF334155),
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  // ── Upcoming Appointment Card ─────────────────────────────────────────────
  Widget _buildUpcomingAppointmentCard(BuildContext context, String Function(String) tr) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Doctor photo
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.asset(
                  'assets/images/dr_arjun_deshmukh.png',
                  width: 50,
                  height: 50,
                  fit: BoxFit.cover,
                  errorBuilder: (ctx, err, stack) => Container(
                    width: 50, height: 50,
                    color: const Color(0xFFF0FDF4),
                    child: const Icon(LucideIcons.userCheck, color: Color(0xFF0F766E)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _upcomingAppointment?.doctorName ?? 'Dr. Arjun Deshmukh',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _upcomingAppointment?.department != null
                          ? '${_upcomingAppointment!.department} • 12+ Years Exp.'
                          : 'Cardiologist • 12+ Years Exp.',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              // Status Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'Confirmed',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF16A34A)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(LucideIcons.calendar, size: 13, color: Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Text(
                          _upcomingAppointment != null
                              ? '${_upcomingAppointment!.appointmentDate} • ${_upcomingAppointment!.appointmentTime}'
                              : '25 Jul 2026 • 10:30 AM',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(LucideIcons.mapPin, size: 13, color: Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            _upcomingAppointment?.hospital ?? 'Max Super Speciality Hospital, Delhi',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              OutlinedButton(
                onPressed: () {
                  if (_upcomingAppointment != null) {
                    context.push('/appointment/${_upcomingAppointment!.id}');
                  } else {
                    context.go('/appointments');
                  }
                },
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF0F766E)),
                  foregroundColor: const Color(0xFF0F766E),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                child: Text(tr('view_details'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Health Summary Column ─────────────────────────────────────────────────
  Widget _buildHealthSummaryCol({
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required String val,
    required String label,
    String? subtext,
    Color? subtextColor,
  }) {
    return Column(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: bgColor,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        const SizedBox(height: 8),
        Text(
          val,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
        ),
        if (subtext != null) ...[
          Text(
            subtext,
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: subtextColor ?? const Color(0xFF16A34A)),
          ),
        ],
      ],
    );
  }
}
