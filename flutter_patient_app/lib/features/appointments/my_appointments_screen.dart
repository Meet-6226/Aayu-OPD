import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/services/firebase_service.dart';
import '../../core/models/appointment_model.dart';
import '../auth/auth_provider.dart';

class MyAppointmentsScreen extends ConsumerStatefulWidget {
  const MyAppointmentsScreen({super.key});

  @override
  ConsumerState<MyAppointmentsScreen> createState() => _MyAppointmentsScreenState();
}

class _MyAppointmentsScreenState extends ConsumerState<MyAppointmentsScreen> with SingleTickerProviderStateMixin {
  final FirebaseService _firebaseService = FirebaseService();
  late TabController _tabController;
  List<AppointmentModel> _appointments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    final patient = ref.read(authProvider).patient;
    final patientId = patient?.uid ?? '919876543210';
    final apts = await _firebaseService.getPatientAppointments(patientId);

    if (mounted) {
      setState(() {
        _appointments = apts;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final upcomingApts = _appointments.where((a) => a.status == 'confirmed' || a.status == 'pending').toList();
    final pastApts = _appointments.where((a) => a.status == 'completed').toList();
    final cancelledApts = _appointments.where((a) => a.status == 'cancelled').toList();

    return Scaffold(
      backgroundColor: AppColors.bgMain,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: InkWell(
            onTap: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/home');
              }
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.primaryTeal.withValues(alpha: 0.12),
                shape: BoxShape.circle,
                border: Border.all(
                    color: AppColors.primaryTeal.withValues(alpha: 0.25)),
              ),
              child: const Icon(LucideIcons.arrowLeft,
                  color: AppColors.primaryTeal, size: 20),
            ),
          ),
        ),
        title: Text('My OPD Visits', style: AppTypography.titleLarge),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primaryTeal,
          unselectedLabelColor: AppColors.textMedium,
          indicatorColor: AppColors.primaryTeal,
          indicatorWeight: 3,
          tabs: [
            Tab(text: 'Upcoming (${upcomingApts.length})'),
            Tab(text: 'Completed (${pastApts.length})'),
            Tab(text: 'Cancelled (${cancelledApts.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryTeal))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildAppointmentList(upcomingApts, emptyMsg: 'No upcoming OPD appointments.'),
                _buildAppointmentList(pastApts, emptyMsg: 'No completed appointments.'),
                _buildAppointmentList(cancelledApts, emptyMsg: 'No cancelled appointments.'),
              ],
            ),
    );
  }

  Widget _buildAppointmentList(List<AppointmentModel> list, {required String emptyMsg}) {
    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.calendarX, size: 48, color: AppColors.textLight),
            const SizedBox(height: 12),
            Text(emptyMsg, style: AppTypography.bodyMedium),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/doctors'),
              child: const Text('Book New Appointment'),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (context, index) {
        final apt = list[index];
        return _buildAppointmentCard(apt);
      },
    );
  }

  Widget _buildAppointmentCard(AppointmentModel apt) {
    Color statusBg = AppColors.statusConfirmedBg;
    Color statusText = AppColors.statusConfirmedText;

    if (apt.status == 'completed') {
      statusBg = AppColors.statusCompletedBg;
      statusText = AppColors.statusCompletedText;
    } else if (apt.status == 'cancelled') {
      statusBg = AppColors.statusCancelledBg;
      statusText = AppColors.statusCancelledText;
    }

    return InkWell(
      onTap: () => context.push('/appointment/${apt.id}'),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.borderCustom),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  apt.bookingId,
                  style: AppTypography.bodySmall.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textMedium,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    apt.status.toUpperCase(),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: statusText,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(apt.doctorName, style: AppTypography.titleMedium.copyWith(fontSize: 17)),
            Text(apt.department, style: AppTypography.bodySmall.copyWith(color: AppColors.primaryTeal, fontWeight: FontWeight.bold)),
            const SizedBox(height: 14),
            Row(
              children: [
                const Icon(LucideIcons.calendar, size: 16, color: AppColors.textMedium),
                const SizedBox(width: 6),
                Text(apt.appointmentDate, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(width: 16),
                const Icon(LucideIcons.clock, size: 16, color: AppColors.textMedium),
                const SizedBox(width: 6),
                Text(apt.appointmentTime, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Fee: ₹${apt.consultationFee.toInt()}',
                  style: AppTypography.bodyMedium.copyWith(color: AppColors.textDark, fontWeight: FontWeight.bold),
                ),
                const Icon(LucideIcons.chevronRight, size: 18, color: AppColors.primaryTeal),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
