import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/services/firebase_service.dart';
import '../../core/services/ml_api_service.dart';
import '../../core/services/demo_triggers_service.dart';
import '../../core/models/doctor_model.dart';
import '../../core/models/appointment_model.dart';
import '../../shared/widgets/doctor_avatar.dart';
import '../auth/auth_provider.dart';

// ── Persona options (matches website) ─────────────────────────────────────────
const _kPersonas = [
  (icon: '💼', label: 'Professional', value: 'working_professional'),
  (icon: '👴', label: 'Senior', value: 'elderly'),
  (icon: '🎓', label: 'Student', value: 'student'),
  (icon: '🤝', label: 'Caretaker', value: 'caretaker'),
];

// ── Simulated travel details (demo-friendly) ───────────────────────────────
const _kSimulatedDistanceKm = 12.0;
const _kSimulatedTraffic = 'Moderate'; // Low | Moderate | High

String _getTravelTime(String appointmentTime) {
  // 12 km city commute at ~30 km/h + moderate delay ~12 mins
  final int delayMins = _kSimulatedTraffic == 'High'
      ? 25
      : _kSimulatedTraffic == 'Moderate'
          ? 12
          : 3;
  final int travelMins = ((_kSimulatedDistanceKm / 30) * 60).round() + delayMins;
  final String formatted = travelMins > 60
      ? '${travelMins ~/ 60}h ${travelMins % 60}m'
      : '$travelMins mins';

  // Calculate departure time
  String departureStr = 'Calculate on day';
  try {
    final parts = appointmentTime.trim().split(' ');
    if (parts.length == 2) {
      final timeParts = parts[0].split(':');
      int h = int.parse(timeParts[0]);
      final int m = int.parse(timeParts[1]);
      final String mer = parts[1].toUpperCase();
      if (mer == 'PM' && h != 12) h += 12;
      if (mer == 'AM' && h == 12) h = 0;
      int apptTotal = h * 60 + m;
      int depTotal = apptTotal - 15 - travelMins;
      if (depTotal < 0) depTotal += 24 * 60;
      final int dh = depTotal ~/ 60;
      final int dm = depTotal % 60;
      final String dm2 = dm.toString().padLeft(2, '0');
      final String depMer = dh >= 12 ? 'PM' : 'AM';
      final int displayH = dh % 12 == 0 ? 12 : dh % 12;
      departureStr = '$displayH:$dm2 $depMer';
    }
  } catch (_) {}

  return '$formatted · Depart by $departureStr';
}

bool _isPeakHour(String time) {
  final lower = time.toLowerCase();
  return lower.contains('8:30') ||
      lower.contains('9:00') ||
      lower.contains('9:30') ||
      lower.contains('10:00') ||
      lower.contains('5:00') ||
      lower.contains('5:30') ||
      lower.contains('6:00') ||
      lower.contains('7:00');
}

class BookingConfirmationScreen extends ConsumerStatefulWidget {
  final String doctorId;
  final String selectedDate;
  final String selectedTime;

  const BookingConfirmationScreen({
    super.key,
    required this.doctorId,
    required this.selectedDate,
    required this.selectedTime,
  });

  @override
  ConsumerState<BookingConfirmationScreen> createState() =>
      _BookingConfirmationScreenState();
}

class _BookingConfirmationScreenState
    extends ConsumerState<BookingConfirmationScreen>
    with SingleTickerProviderStateMixin {
  final FirebaseService _firebaseService = FirebaseService();
  final MlApiService _mlApiService = MlApiService();
  late AnimationController _carController;

  DoctorModel? _doctor;
  MlPredictionResult? _mlPrediction;
  bool _isLoading = true;
  bool _isBooking = false;

  // Cab booking
  String _selectedCab = 'ubergo';
  String _cabStatus = 'idle'; // idle | booking | confirmed
  Map<String, String>? _driverInfo;

  // Persona selection
  String _selectedPersona = 'working_professional';

  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _carController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();
    _loadDataAndRunPrediction();
  }

  @override
  void dispose() {
    _carController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadDataAndRunPrediction() async {
    final docs = await _firebaseService.getDoctors();
    final doc = docs.firstWhere((d) => d.id == widget.doctorId,
        orElse: () => docs.first);
    final patient = ref.read(authProvider).patient;

    // Sync persona from patient if not manually chosen
    if (patient?.persona != null && patient!.persona.isNotEmpty) {
      _selectedPersona = patient.persona;
    }

    // Open screen INSTANTLY without waiting for network ML prediction
    if (mounted) {
      setState(() {
        _doctor = doc;
        _isLoading = false;
      });
    }

    // Fetch ML prediction in background without blocking UI
    _mlApiService.predictNoShowRisk({
      'patientNoShows': patient?.totalNoShows ?? 0,
      'patientVisits': patient?.totalVisits ?? 1,
      'appointmentDate': widget.selectedDate,
      'appointmentTime': widget.selectedTime,
      'department': doc.department,
      'persona': _selectedPersona,
      'patientAge': patient?.age ?? 30,
      'patientGender': patient?.gender ?? 'male',
      'consultationType': 'new',
    }).then((prediction) {
      if (mounted) {
        setState(() {
          _mlPrediction = prediction;
        });
      }
    }).catchError((_) {});
  }

  Future<void> _handleConfirmBooking() async {
    setState(() => _isBooking = true);

    final patient = ref.read(authProvider).patient;
    final patientId = patient?.uid ?? '919876543210';
    final randomId = (100000 + math.Random().nextInt(900000)).toString();
    final aptId = 'apt_$randomId';

    final appointment = AppointmentModel(
      id: aptId,
      patientId: patientId,
      doctorId: _doctor!.id,
      doctorName: _doctor!.name,
      department: _doctor!.department,
      appointmentDate: widget.selectedDate,
      appointmentTime: widget.selectedTime,
      status: 'confirmed',
      consultationFee: _doctor!.consultationFee,
      riskScore: _mlPrediction?.riskScore ?? 20.0,
      riskLevel: _mlPrediction?.riskLevel ?? 'LOW',
      persona: _selectedPersona,
      bookingId: 'AP-$randomId',
      hospital: _doctor!.hospital,
      room: 'OPD Room 102',
      notes: _notesController.text.trim(),
    );

    await _firebaseService.createAppointment(appointment);

    // Trigger Appointment Booking Demo in non-blocking background task
    final userPhone = patient?.phone != null && patient!.phone.isNotEmpty 
        ? patient.phone 
        : '9876543210';

    Future.microtask(() {
      DemoTriggersService().triggerAppointmentBookingDemo(
        name: patient?.name ?? 'Sahil Pandey',
        phone: userPhone,
        doctorName: _doctor!.name,
        appointmentDate: widget.selectedDate,
        appointmentTime: widget.selectedTime,
        bookingId: appointment.bookingId,
      );
    });

    if (mounted) {
      setState(() => _isBooking = false);
      _showBookingConfirmedDialog(appointment);
    }
  }

  void _showBookingConfirmedDialog(AppointmentModel apt) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        backgroundColor: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Green checkmark circle
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.emeraldGreen.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  LucideIcons.checkCircle,
                  color: AppColors.emeraldGreen,
                  size: 40,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'Booking Confirmed!',
                style: AppTypography.titleLarge.copyWith(
                    fontSize: 22, color: AppColors.textDark),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Your OPD appointment has been successfully booked. Check your WhatsApp for reminders.',
                style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textMedium, height: 1.5),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              // Booking ID chip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.lightTeal,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.primaryTeal.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.ticket,
                        size: 16, color: AppColors.primaryTeal),
                    const SizedBox(width: 8),
                    Text(
                      apt.bookingId,
                      style: AppTypography.bodyMedium.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.primaryTeal),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              // Doctor + date row
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.user,
                      size: 14, color: AppColors.textMedium),
                  const SizedBox(width: 6),
                  Text(apt.doctorName,
                      style: AppTypography.bodySmall
                          .copyWith(fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.calendar,
                      size: 14, color: AppColors.textMedium),
                  const SizedBox(width: 6),
                  Text(
                    '${apt.appointmentDate}  •  ${apt.appointmentTime}',
                    style: AppTypography.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    context.go('/appointment/${apt.id}');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryTeal,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('View Appointment',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
              const SizedBox(height: 10),
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  context.go('/home');
                },
                child: Text('Back to Home',
                    style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textMedium)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          leading: Padding(
            padding: const EdgeInsets.all(8.0),
            child: InkWell(
              onTap: () => context.canPop() ? context.pop() : context.go('/doctors'),
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
          title: const Text('Review Booking'),
        ),
        body: const Center(
            child: CircularProgressIndicator(color: AppColors.primaryTeal)),
      );
    }

    final doc = _doctor!;
    final patient = ref.watch(authProvider).patient;

    return Scaffold(
      backgroundColor: AppColors.bgMain,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: InkWell(
            onTap: () => context.canPop() ? context.pop() : context.go('/doctors'),
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
        title: Text('Confirm OPD Appointment',
            style: AppTypography.titleLarge.copyWith(fontSize: 18)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Appointment Summary Card ─────────────────────────────────
            Container(
              padding: const EdgeInsets.all(18),
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
                      DoctorAvatar(
                          imagePath: doc.imagePath,
                          initials: doc.initials,
                          radius: 28),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(doc.name,
                                style: AppTypography.titleMedium
                                    .copyWith(fontSize: 16)),
                            Text(doc.department,
                                style: AppTypography.bodySmall.copyWith(
                                    color: AppColors.primaryTeal,
                                    fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(),
                  const SizedBox(height: 10),
                  _buildSummaryRow(
                      LucideIcons.calendar, 'Date', widget.selectedDate),
                  const SizedBox(height: 8),
                  _buildSummaryRow(
                      LucideIcons.clock, 'Time Slot', widget.selectedTime),
                  const SizedBox(height: 8),
                  _buildSummaryRow(
                      LucideIcons.mapPin, 'Hospital', doc.hospital),
                  const SizedBox(height: 8),
                  _buildSummaryRow(LucideIcons.creditCard, 'Fee',
                      '₹${doc.consultationFee.toInt()}'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ── AI Risk Card ─────────────────────────────────────────────
            if (_mlPrediction != null) ...[
              _buildAiRiskCard(),
              const SizedBox(height: 20),
            ],

            // ── Travel Time Card (simulated) ─────────────────────────────
            _buildTravelCard(),
            const SizedBox(height: 20),

            // ── Cab Booking Card ─────────────────────────────────────────
            _buildCabBookingCard(),
            const SizedBox(height: 20),

            // ── Persona Selector ─────────────────────────────────────────
            Text('Your Persona', style: AppTypography.titleMedium),
            const SizedBox(height: 4),
            Text(
              'Helps us personalise reminders and risk alerts for you.',
              style: AppTypography.bodySmall,
            ),
            const SizedBox(height: 12),
            _buildPersonaSelector(),
            const SizedBox(height: 20),

            // ── Patient Info Card ────────────────────────────────────────
            Text('Patient Information', style: AppTypography.titleMedium),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderCustom),
              ),
              child: Column(
                children: [
                  _buildPatientRow(
                      'Patient Name', patient?.name ?? 'Priya Sharma'),
                  const SizedBox(height: 8),
                  _buildPatientRow(
                      'Phone', patient?.phone ?? '+91 80870 27178'),
                  const SizedBox(height: 8),
                  _buildPatientRow(
                    'Age / Gender',
                    '${patient?.age ?? 29} Yrs / ${patient?.gender ?? 'Female'}',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ── Notes ────────────────────────────────────────────────────
            Text('Symptom / Notes (Optional)',
                style: AppTypography.bodySmall
                    .copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextField(
              controller: _notesController,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'e.g. Mild headache for 2 days, routine follow-up...',
              ),
            ),
            const SizedBox(height: 32),

            // ── Confirm Button ───────────────────────────────────────────
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isBooking ? null : _handleConfirmBooking,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.emeraldGreen,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                ),
                child: _isBooking
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(
                        'Confirm Appointment (₹${doc.consultationFee.toInt()})',
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // ── AI Risk Card ───────────────────────────────────────────────────────────
  Widget _buildAiRiskCard() {
    final risk = _mlPrediction!;
    final isHighRisk = risk.riskLevel == 'HIGH';
    final bgColor =
        isHighRisk ? const Color(0xFFFFF7ED) : AppColors.lightTeal;
    final borderColor =
        isHighRisk ? const Color(0xFFFED7AA) : AppColors.primaryTeal.withValues(alpha: 0.2);
    final labelColor =
        isHighRisk ? AppColors.goldAmber : AppColors.emeraldGreen;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.brain, color: AppColors.primaryTeal, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'AI Schedule Confidence',
                      style: AppTypography.bodyMedium.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryTeal),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: labelColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        risk.riskLevel,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(risk.summary, style: AppTypography.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Travel Time Card ───────────────────────────────────────────────────────
  Widget _buildTravelCard() {
    final travelStr = _getTravelTime(widget.selectedTime);
    final isPeak = _isPeakHour(widget.selectedTime);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderCustom),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.lightTeal,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(LucideIcons.car,
                        size: 18, color: AppColors.primaryTeal),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Travel & Commute',
                    style: AppTypography.bodyMedium
                        .copyWith(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () async {
                  final url = Uri.parse(
                      'https://www.google.com/maps/dir/?api=1&destination=Apollo+Hospitals+Jubilee+Hills');
                  try {
                    await launchUrl(url, mode: LaunchMode.externalApplication);
                  } catch (_) {}
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    children: [
                      Text('Maps',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold)),
                      SizedBox(width: 4),
                      Icon(LucideIcons.externalLink,
                          size: 11, color: Color(0xFF2DD4BF)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _buildTravelRow(
              LucideIcons.mapPin, 'Distance', '${_kSimulatedDistanceKm.toInt()} km from your area'),
          const SizedBox(height: 8),
          _buildTravelRow(
              LucideIcons.clock, 'Travel Time', travelStr),
          const SizedBox(height: 8),
          _buildTravelRow(
              LucideIcons.activity, 'Traffic',
              _kSimulatedTraffic),
          const SizedBox(height: 14),
          // ── Route Map ──────────────────────────────────────────────
          GestureDetector(
            onTap: () async {
              final url = Uri.parse(
                  'https://www.google.com/maps/dir/?api=1&destination=Apollo+Hospitals+Jubilee+Hills');
              try {
                await launchUrl(url, mode: LaunchMode.externalApplication);
              } catch (_) {}
            },
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: SizedBox(
                height: 180,
                width: double.infinity,
                child: _BookingRouteMapWidget(
                    carController: _carController, isPeak: isPeak),
              ),
            ),
          ),
          if (isPeak) ...[
            const SizedBox(height: 12),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: const Color(0xFFFED7AA)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.alertTriangle,
                      size: 16, color: Color(0xFFD97706)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Peak traffic hour — consider leaving 30 mins earlier.',
                      style: AppTypography.bodySmall
                          .copyWith(color: const Color(0xFF92400E), fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTravelRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 15, color: AppColors.textMedium),
        const SizedBox(width: 8),
        Text('$label: ',
            style:
                AppTypography.bodySmall.copyWith(color: AppColors.textMedium)),
        Expanded(
          child: Text(
            value,
            style: AppTypography.bodySmall
                .copyWith(fontWeight: FontWeight.w600, color: AppColors.textDark),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  // ── Cab Booking Card ───────────────────────────────────────────────────────
  Widget _buildCabBookingCard() {
    const cabOptions = [
      (id: 'ubergo', name: 'Uber Go', price: '₹180', eta: '3 min away', desc: 'Standard sedan, fast response'),
      (id: 'uberauto', name: 'Uber Auto', price: '₹110', eta: '5 min away', desc: 'Convenient 3-wheeler commute'),
      (id: 'apolloassist', name: 'Apollo Care Cab', price: '₹290', eta: '4 min away', desc: 'Wheelchair & oxygen assist, priority entry'),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderCustom),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.lightTeal,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(LucideIcons.car, size: 18, color: AppColors.primaryTeal),
                  ),
                  const SizedBox(width: 10),
                  Text('Integrated Ride Services',
                      style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFD1FAE5)),
                ),
                child: const Text('Transit Partner',
                    style: TextStyle(
                        fontSize: 9, fontWeight: FontWeight.w700,
                        color: Color(0xFF065F46), letterSpacing: 0.5)),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (_cabStatus == 'idle') ...[
            Text('Pre-book your ride to ensure on-time arrival:',
                style: AppTypography.bodySmall.copyWith(color: AppColors.textMedium)),
            const SizedBox(height: 12),
            ...cabOptions.map((opt) {
              final isSelected = _selectedCab == opt.id;
              return GestureDetector(
                onTap: () => setState(() => _selectedCab = opt.id),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.lightTeal : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected ? AppColors.primaryTeal : AppColors.borderCustom,
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primaryTeal : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(LucideIcons.car, size: 16,
                            color: isSelected ? Colors.white : AppColors.textMedium),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(opt.name,
                                    style: AppTypography.bodySmall.copyWith(
                                        fontWeight: FontWeight.bold, color: AppColors.textDark)),
                                const SizedBox(width: 6),
                                Text('(${opt.eta})',
                                    style: AppTypography.bodySmall.copyWith(
                                        fontSize: 10, color: AppColors.textLight)),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(opt.desc,
                                style: AppTypography.bodySmall.copyWith(
                                    fontSize: 10, color: AppColors.textMedium)),
                          ],
                        ),
                      ),
                      Text(opt.price,
                          style: AppTypography.bodyMedium.copyWith(
                              fontWeight: FontWeight.w800, color: AppColors.primaryTeal)),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                onPressed: () {
                  setState(() => _cabStatus = 'booking');
                  Future.delayed(const Duration(seconds: 2), () {
                    if (mounted) {
                      setState(() {
                        _cabStatus = 'confirmed';
                        _driverInfo = {
                          'name': 'Rajan Kumar',
                          'rating': '⭐ 4.8',
                          'vehicle': 'Toyota Etios · DL 3C AB 1234',
                        };
                      });
                    }
                  });
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Pre-book Ride',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    SizedBox(width: 6),
                    Icon(LucideIcons.arrowRight, size: 16),
                  ],
                ),
              ),
            ),
          ],
          if (_cabStatus == 'booking') ...[
            Container(
              padding: const EdgeInsets.all(20),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderCustom),
              ),
              child: Column(
                children: [
                  const CircularProgressIndicator(
                      color: AppColors.primaryTeal, strokeWidth: 2.5),
                  const SizedBox(height: 10),
                  Text('Connecting to drivers...',
                      style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Assigning the closest partner cab to your location',
                      style: AppTypography.bodySmall.copyWith(
                          color: AppColors.textLight, fontSize: 11),
                      textAlign: TextAlign.center),
                ],
              ),
            ),
          ],
          if (_cabStatus == 'confirmed' && _driverInfo != null) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFD1FAE5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 8, height: 8,
                            decoration: const BoxDecoration(
                                color: Color(0xFF22C55E), shape: BoxShape.circle),
                          ),
                          const SizedBox(width: 6),
                          const Text('Ride Confirmed',
                              style: TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.w700,
                                  color: Color(0xFF15803D), letterSpacing: 0.5)),
                        ],
                      ),
                      const Text('Dispatched on Appointment Day',
                          style: TextStyle(
                              fontSize: 9, fontWeight: FontWeight.bold,
                              color: Color(0xFF166534))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: const Color(0xFF16A34A),
                            child: Text(
                              _driverInfo!['name']!
                                  .split(' ').map((n) => n[0]).join(''),
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(_driverInfo!['name']!,
                                      style: AppTypography.bodySmall
                                          .copyWith(fontWeight: FontWeight.bold)),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(
                                            color: const Color(0xFFBBF7D0))),
                                    child: Text(_driverInfo!['rating']!,
                                        style: const TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF15803D))),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(_driverInfo!['vehicle']!,
                                  style: AppTypography.bodySmall.copyWith(
                                      fontSize: 10, color: AppColors.textMedium)),
                            ],
                          ),
                        ],
                      ),
                      TextButton(
                        onPressed: () => setState(() {
                          _cabStatus = 'idle';
                          _driverInfo = null;
                        }),
                        style: TextButton.styleFrom(
                            foregroundColor: Colors.red,
                            padding: EdgeInsets.zero,
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                        child: const Text('Cancel Ride',
                            style: TextStyle(
                                fontSize: 11, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Persona Selector ───────────────────────────────────────────────────────
  Widget _buildPersonaSelector() {

    return Row(
      children: _kPersonas.map((p) {
        final isSelected = _selectedPersona == p.value;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => setState(() => _selectedPersona = p.value),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.lightTeal : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.primaryTeal
                        : AppColors.borderCustom,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Column(
                  children: [
                    Text(p.icon, style: const TextStyle(fontSize: 18)),
                    const SizedBox(height: 4),
                    Text(
                      p.label,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: isSelected
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: isSelected
                            ? AppColors.primaryTeal
                            : AppColors.textMedium,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  Widget _buildSummaryRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textMedium),
        const SizedBox(width: 8),
        Text('$label: ', style: AppTypography.bodySmall),
        Expanded(
          child: Text(
            value,
            style: AppTypography.bodyMedium.copyWith(
                fontWeight: FontWeight.bold, color: AppColors.textDark),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildPatientRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTypography.bodySmall),
        Text(value,
            style: AppTypography.bodyMedium
                .copyWith(fontWeight: FontWeight.bold)),
      ],
    );
  }
}

// ── Booking Route Map Widget ───────────────────────────────────────────────────
class _BookingRouteMapWidget extends StatelessWidget {
  final AnimationController carController;
  final bool isPeak;

  const _BookingRouteMapWidget(
      {required this.carController, required this.isPeak});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight;

        final routePath = Path()
          ..moveTo(w * 0.24, h * 0.72)
          ..cubicTo(w * 0.32, h * 0.72, w * 0.38, h * 0.72, w * 0.46, h * 0.50)
          ..lineTo(w * 0.64, h * 0.50)
          ..cubicTo(w * 0.70, h * 0.50, w * 0.74, h * 0.28, w * 0.80, h * 0.28);

        return AnimatedBuilder(
          animation: carController,
          builder: (context, _) {
            final t = carController.value;
            final metrics = routePath.computeMetrics().toList();
            Offset carPos = Offset(w * 0.24, h * 0.72);
            double carAngle = 0.0;
            if (metrics.isNotEmpty) {
              final metric = metrics.first;
              final tangent = metric.getTangentForOffset(metric.length * t);
              if (tangent != null) {
                carPos = tangent.position;
                carAngle = tangent.angle;
              }
            }

            return Stack(
              children: [
                Container(
                  color: const Color(0xFFF1F5F9),
                  child: CustomPaint(
                    size: Size(w, h),
                    painter: _BookingMapPainter(isPeak: isPeak),
                  ),
                ),
                Positioned(
                  left: (w * 0.24) - 14,
                  top: (h * 0.72) - 14,
                  child: _marker(LucideIcons.home, const Color(0xFF0D9488), 'Home', 28),
                ),
                Positioned(
                  left: (w * 0.80) - 16,
                  top: (h * 0.28) - 16,
                  child: _hospitalMarker(),
                ),
                Positioned(
                  left: carPos.dx - 12,
                  top: carPos.dy - 12,
                  child: Transform.rotate(
                    angle: carAngle,
                    child: Container(
                      width: 24, height: 24,
                      decoration: BoxDecoration(
                        color: Colors.white, shape: BoxShape.circle,
                        border: Border.all(color: AppColors.borderCustom),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 4)],
                      ),
                      child: const Icon(LucideIcons.car, size: 13, color: AppColors.primaryTeal),
                    ),
                  ),
                ),
                Positioned(
                  top: 10, left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.92),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.borderCustom),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.07), blurRadius: 6)],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6, height: 6,
                          decoration: BoxDecoration(
                            color: isPeak ? const Color(0xFFEF4444) : const Color(0xFF22C55E),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          isPeak ? 'Heavy traffic — leave 30m early' : 'Clear flow along route',
                          style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                        ),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  bottom: 10, right: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      children: [
                        Text('12 km · 36 mins',
                            style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                        SizedBox(width: 6),
                        Text('MAPS ↗',
                            style: TextStyle(color: Color(0xFF2DD4BF), fontSize: 8, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _marker(IconData icon, Color color, String label, double size) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size, height: size,
          decoration: BoxDecoration(
            color: color, shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [BoxShadow(color: color.withValues(alpha: 0.4), blurRadius: 6)],
          ),
          child: Icon(icon, size: size * 0.5, color: Colors.white),
        ),
        const SizedBox(height: 2),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.95), borderRadius: BorderRadius.circular(4)),
          child: Text(label, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
        ),
      ],
    );
  }

  Widget _hospitalMarker() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.85, end: 1.1),
          duration: const Duration(milliseconds: 900),
          curve: Curves.easeInOut,
          builder: (_, v, child) => Transform.scale(scale: v, child: child),
          child: Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: AppColors.primaryTeal, shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: [BoxShadow(color: AppColors.primaryTeal.withValues(alpha: 0.5), blurRadius: 8)],
            ),
            child: const Icon(LucideIcons.mapPin, size: 16, color: Colors.white),
          ),
        ),
        const SizedBox(height: 2),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.95), borderRadius: BorderRadius.circular(4)),
          child: const Text('Apollo Hospital',
              style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppColors.primaryTeal)),
        ),
      ],
    );
  }
}

class _BookingMapPainter extends CustomPainter {
  final bool isPeak;
  const _BookingMapPainter({required this.isPeak});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFFF1F5F9));

    final parkPath = Path()
      ..moveTo(w*0.30, h*0.60)
      ..quadraticBezierTo(w*0.35, h*0.55, w*0.42, h*0.58)
      ..quadraticBezierTo(w*0.48, h*0.70, w*0.40, h*0.80)
      ..quadraticBezierTo(w*0.30, h*0.82, w*0.30, h*0.60);
    canvas.drawPath(parkPath, Paint()..color = const Color(0xFFDCFCE7)..style = PaintingStyle.fill);
    canvas.drawPath(parkPath, Paint()..color = const Color(0xFFBBF7D0)..style = PaintingStyle.stroke..strokeWidth = 1);

    for (final y in [0.19, 0.42, 0.64, 0.86]) {
      canvas.drawLine(Offset(0, h*y), Offset(w, h*y), Paint()..color = Colors.white..strokeWidth = 5..strokeCap = StrokeCap.round);
      canvas.drawLine(Offset(0, h*y), Offset(w, h*y), Paint()..color = const Color(0xFFCBD5E1)..strokeWidth = 1.5);
    }
    for (final x in [0.18, 0.38, 0.58, 0.78]) {
      canvas.drawLine(Offset(w*x, 0), Offset(w*x, h), Paint()..color = Colors.white..strokeWidth = 5..strokeCap = StrokeCap.round);
      canvas.drawLine(Offset(w*x, 0), Offset(w*x, h), Paint()..color = const Color(0xFFCBD5E1)..strokeWidth = 1.5);
    }

    _drawDashed(canvas, Offset(0, h*0.54), Offset(w, h*0.54),
        Paint()..color = const Color(0xFF60A5FA)..strokeWidth = 2.5..strokeCap = StrokeCap.round, 6, 4);

    final routePath = Path()
      ..moveTo(w*0.24, h*0.72)
      ..cubicTo(w*0.32, h*0.72, w*0.38, h*0.72, w*0.46, h*0.50)
      ..lineTo(w*0.64, h*0.50)
      ..cubicTo(w*0.70, h*0.50, w*0.74, h*0.28, w*0.80, h*0.28);

    canvas.drawPath(routePath,
        Paint()..color = (isPeak ? const Color(0xFFFEF3C7) : const Color(0xFFD1FAE5))
            ..strokeWidth = 12..strokeCap = StrokeCap.round..style = PaintingStyle.stroke);
    canvas.drawPath(routePath,
        Paint()..color = (isPeak ? const Color(0xFFF59E0B) : const Color(0xFF10B981))
            ..strokeWidth = 6..strokeCap = StrokeCap.round..style = PaintingStyle.stroke);
    _drawDashedPath(canvas, routePath,
        Paint()..color = Colors.white..strokeWidth = 2..strokeCap = StrokeCap.round..style = PaintingStyle.stroke, 6, 6);
  }

  void _drawDashed(Canvas c, Offset s, Offset e, Paint p, double dash, double gap) {
    final dx = e.dx - s.dx; final dy = e.dy - s.dy;
    final dist = math.sqrt(dx*dx + dy*dy);
    final stepX = dx/dist*(dash+gap); final stepY = dy/dist*(dash+gap);
    var cx = s.dx; var cy = s.dy;
    while (math.sqrt((cx-s.dx)*(cx-s.dx)+(cy-s.dy)*(cy-s.dy)) < dist) {
      c.drawLine(Offset(cx, cy), Offset(cx+dx/dist*dash, cy+dy/dist*dash), p);
      cx += stepX; cy += stepY;
    }
  }

  void _drawDashedPath(Canvas c, Path path, Paint p, double dash, double gap) {
    for (final m in path.computeMetrics()) {
      var d = 0.0;
      while (d < m.length) {
        c.drawPath(m.extractPath(d, (d+dash).clamp(0, m.length)), p);
        d += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _BookingMapPainter old) => old.isPeak != isPeak;
}
