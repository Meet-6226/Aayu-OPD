import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/services/firebase_service.dart';
import '../../core/models/appointment_model.dart';

class AppointmentDetailScreen extends StatefulWidget {
  final String appointmentId;

  const AppointmentDetailScreen({super.key, required this.appointmentId});

  @override
  State<AppointmentDetailScreen> createState() => _AppointmentDetailScreenState();
}

class _AppointmentDetailScreenState extends State<AppointmentDetailScreen>
    with SingleTickerProviderStateMixin {
  final FirebaseService _firebaseService = FirebaseService();
  AppointmentModel? _appointment;
  bool _isLoading = true;
  late AnimationController _carController;

  @override
  void initState() {
    super.initState();
    _carController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();
    _loadAppointment();
  }

  @override
  void dispose() {
    _carController.dispose();
    super.dispose();
  }

  Future<void> _loadAppointment() async {
    final apt = await _firebaseService.getAppointmentById(widget.appointmentId);
    if (mounted) {
      setState(() {
        _appointment = apt;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleCancel() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cancel Appointment?'),
        content: const Text(
            'Are you sure you want to cancel this OPD appointment? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep Appointment'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.statusCancelledText),
            child: const Text('Cancel Visit'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _firebaseService.cancelAppointment(
          widget.appointmentId, 'Cancelled by patient');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Appointment Cancelled')),
        );
        context.go('/appointments');
      }
    }
  }

  Future<void> _openMaps(String hospital) async {
    final encoded = Uri.encodeComponent('$hospital, Hyderabad');
    final url = Uri.parse(
        'https://www.google.com/maps/dir/?api=1&destination=$encoded');
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          leading: _backButton(),
          title: const Text('Appointment Details'),
        ),
        body:
            const Center(child: CircularProgressIndicator(color: AppColors.primaryTeal)),
      );
    }

    final apt = _appointment!;
    final isActive =
        apt.status == 'confirmed' || apt.status == 'pending';
    final isCancelled = apt.status == 'cancelled';

    Color statusBg = AppColors.statusConfirmedBg;
    Color statusFg = AppColors.statusConfirmedText;
    if (apt.status == 'completed') {
      statusBg = AppColors.statusCompletedBg;
      statusFg = AppColors.statusCompletedText;
    } else if (isCancelled) {
      statusBg = AppColors.statusCancelledBg;
      statusFg = AppColors.statusCancelledText;
    }

    return Scaffold(
      backgroundColor: AppColors.bgMain,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: _backButton(),
        title: Text('Appointment Details',
            style: AppTypography.titleLarge.copyWith(fontSize: 18)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Status + Booking ID banner ────────────────────────────────
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: AppColors.darkGradient,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryDark.withValues(alpha: 0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AAYU CLINIC',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.6),
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        apt.bookingId,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusBg,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          apt.status.toUpperCase(),
                          style: TextStyle(
                            color: statusFg,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.15)),
                    ),
                    child: Icon(
                      isActive
                          ? LucideIcons.calendarCheck
                          : isCancelled
                              ? LucideIcons.calendarX
                              : LucideIcons.checkCircle,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ── Appointment Info Card ─────────────────────────────────────
            _infoCard(
              children: [
                _detailRow(LucideIcons.user, 'Doctor', apt.doctorName),
                const SizedBox(height: 14),
                _detailRow(LucideIcons.stethoscope, 'Department', apt.department),
                const SizedBox(height: 14),
                _detailRow(LucideIcons.calendar, 'Date', apt.appointmentDate),
                const SizedBox(height: 14),
                _detailRow(LucideIcons.clock, 'Time', apt.appointmentTime),
                const SizedBox(height: 14),
                _detailRow(LucideIcons.mapPin, 'Room', apt.room),
                const SizedBox(height: 14),
                _detailRow(LucideIcons.building2, 'Hospital', apt.hospital),
                if (apt.notes.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  _detailRow(LucideIcons.fileText, 'Notes', apt.notes),
                ],
                const SizedBox(height: 14),
                _detailRow(LucideIcons.creditCard, 'Consultation Fee',
                    '₹${apt.consultationFee.toInt()}'),
              ],
            ),
            const SizedBox(height: 20),

            // ── Live Route Map ────────────────────────────────────────────
            if (isActive) ...[
              _infoCard(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.lightTeal,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(LucideIcons.navigation,
                            size: 18, color: AppColors.primaryTeal),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text('Route to Hospital',
                            style: AppTypography.bodyMedium
                                .copyWith(fontWeight: FontWeight.bold)),
                      ),
                      GestureDetector(
                        onTap: () => _openMaps(apt.hospital),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 5),
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
                  // SVG Route Map
                  GestureDetector(
                    onTap: () => _openMaps(apt.hospital),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: SizedBox(
                        height: 180,
                        width: double.infinity,
                        child: _RouteMapWidget(
                            carController: _carController,
                            isPeak: _isPeakHour(apt.appointmentTime)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  // Distance + time row
                  Row(
                    children: [
                      const Icon(LucideIcons.mapPin,
                          size: 14, color: AppColors.textMedium),
                      const SizedBox(width: 6),
                      Text('12 km from your area',
                          style: AppTypography.bodySmall),
                      const SizedBox(width: 16),
                      const Icon(LucideIcons.clock,
                          size: 14, color: AppColors.textMedium),
                      const SizedBox(width: 6),
                      Text('~36 mins',
                          style: AppTypography.bodySmall
                              .copyWith(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],

            // ── Cancel Button ─────────────────────────────────────────────
            if (isActive) ...[
              SizedBox(
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: _handleCancel,
                  icon: const Icon(LucideIcons.calendarX,
                      color: AppColors.statusCancelledText, size: 18),
                  label: const Text('Cancel Appointment',
                      style:
                          TextStyle(color: AppColors.statusCancelledText)),
                  style: OutlinedButton.styleFrom(
                    side:
                        const BorderSide(color: AppColors.statusCancelledText),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // ── Cancelled notice ─────────────────────────────────────────
            if (isCancelled)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.statusCancelledBg,
                  borderRadius: BorderRadius.circular(14),
                  border:
                      Border.all(color: AppColors.statusCancelledText.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.info,
                        size: 18, color: AppColors.statusCancelledText),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'This appointment has been cancelled.',
                        style: AppTypography.bodySmall.copyWith(
                            color: AppColors.statusCancelledText,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  bool _isPeakHour(String time) {
    final lower = time.toLowerCase();
    return lower.contains('8:') ||
        lower.contains('9:') ||
        lower.contains('10:00') ||
        lower.contains('5:') ||
        lower.contains('6:') ||
        lower.contains('7:00');
  }

  Widget _backButton() {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: InkWell(
        onTap: () =>
            context.canPop() ? context.pop() : context.go('/appointments'),
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
    );
  }

  Widget _infoCard({required List<Widget> children}) {
    return Container(
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
        children: children,
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.textMedium),
        const SizedBox(width: 10),
        SizedBox(
          width: 110,
          child: Text(label, style: AppTypography.bodySmall),
        ),
        Expanded(
          child: Text(
            value,
            style: AppTypography.bodyMedium.copyWith(
                fontWeight: FontWeight.bold, color: AppColors.textDark),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }
}

// ── Route Map Widget ───────────────────────────────────────────────────────────
class _RouteMapWidget extends StatelessWidget {
  final AnimationController carController;
  final bool isPeak;

  const _RouteMapWidget(
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
                // Map background
                Container(
                  color: const Color(0xFFF1F5F9),
                  child: CustomPaint(
                    size: Size(w, h),
                    painter: _MapPainter(isPeak: isPeak),
                  ),
                ),

                // Home marker (at route start w*0.24, h*0.72)
                Positioned(
                  left: (w * 0.24) - 14,
                  top: (h * 0.72) - 14,
                  child: _mapMarker(
                    icon: LucideIcons.home,
                    color: const Color(0xFF0D9488),
                    label: 'Home',
                    size: 28,
                  ),
                ),

                // Hospital marker (at route end w*0.80, h*0.28)
                Positioned(
                  left: (w * 0.80) - 16,
                  top: (h * 0.28) - 16,
                  child: _pulsingMarker(),
                ),

                // Animated car along path with rotation
                Positioned(
                  left: carPos.dx - 12,
                  top: carPos.dy - 12,
                  child: Transform.rotate(
                    angle: carAngle,
                    child: Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.borderCustom),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: const Icon(LucideIcons.car,
                          size: 13, color: AppColors.primaryTeal),
                    ),
                  ),
                ),

                // Traffic overlay
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.92),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.borderCustom),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.07),
                          blurRadius: 6,
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: isPeak
                                ? const Color(0xFFEF4444)
                                : const Color(0xFF22C55E),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          isPeak
                              ? 'Heavy traffic — leave 30m early'
                              : 'Clear flow along route',
                          style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E293B)),
                        ),
                      ],
                    ),
                  ),
                ),

                // Bottom-right chip
                Positioned(
                  bottom: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      children: [
                        Text('12 km · 36 mins',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.bold)),
                        SizedBox(width: 6),
                        Text('MAPS ↗',
                            style: TextStyle(
                                color: Color(0xFF2DD4BF),
                                fontSize: 8,
                                fontWeight: FontWeight.bold)),
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

  Widget _mapMarker(
      {required IconData icon,
      required Color color,
      required String label,
      double size = 28}) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.4),
                blurRadius: 6,
              ),
            ],
          ),
          child: Icon(icon, size: size * 0.5, color: Colors.white),
        ),
        const SizedBox(height: 2),
        Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.95),
            borderRadius: BorderRadius.circular(4),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 2,
              ),
            ],
          ),
          child: Text(label,
              style: const TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B))),
        ),
      ],
    );
  }

  Widget _pulsingMarker() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.8, end: 1.1),
          duration: const Duration(seconds: 1),
          curve: Curves.easeInOut,
          builder: (_, v, child) => Transform.scale(scale: v, child: child),
          child: Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppColors.primaryTeal,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primaryTeal.withValues(alpha: 0.5),
                  blurRadius: 8,
                ),
              ],
            ),
            child: const Icon(LucideIcons.mapPin,
                size: 16, color: Colors.white),
          ),
        ),
        const SizedBox(height: 2),
        Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.95),
            borderRadius: BorderRadius.circular(4),
          ),
          child: const Text('Apollo Hospital',
              style: TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryTeal)),
        ),
      ],
    );
  }
}

// ── Custom Painter for map roads/route ────────────────────────────────────────
class _MapPainter extends CustomPainter {
  final bool isPeak;
  const _MapPainter({required this.isPeak});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Background
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFFF1F5F9));

    // Park area
    final parkPaint = Paint()
      ..color = const Color(0xFFDCFCE7)
      ..style = PaintingStyle.fill;
    final parkPath = Path()
      ..moveTo(w * 0.30, h * 0.60)
      ..quadraticBezierTo(w * 0.35, h * 0.55, w * 0.42, h * 0.58)
      ..quadraticBezierTo(w * 0.48, h * 0.70, w * 0.40, h * 0.80)
      ..quadraticBezierTo(w * 0.30, h * 0.82, w * 0.30, h * 0.60);
    canvas.drawPath(parkPath, parkPaint);
    canvas.drawPath(
        parkPath,
        Paint()
          ..color = const Color(0xFFBBF7D0)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1);

    // Grid roads (white casing)
    final roadCasing = Paint()
      ..color = Colors.white
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;
    final roadLine = Paint()
      ..color = const Color(0xFFCBD5E1)
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    for (final y in [0.19, 0.42, 0.64, 0.86]) {
      canvas.drawLine(Offset(0, h * y), Offset(w, h * y), roadCasing);
      canvas.drawLine(Offset(0, h * y), Offset(w, h * y), roadLine);
    }
    for (final x in [0.18, 0.38, 0.58, 0.78]) {
      canvas.drawLine(Offset(w * x, 0), Offset(w * x, h), roadCasing);
      canvas.drawLine(Offset(w * x, 0), Offset(w * x, h), roadLine);
    }

    // Metro line (dashed blue)
    final metroPaint = Paint()
      ..color = const Color(0xFF60A5FA)
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    _drawDashedLine(canvas, Offset(0, h * 0.54), Offset(w, h * 0.54),
        metroPaint, 6, 4);

    // Route shadow/casing
    final routeCasing = Paint()
      ..color = isPeak
          ? const Color(0xFFFEF3C7)
          : const Color(0xFFD1FAE5)
      ..strokeWidth = 12
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    final routeMain = Paint()
      ..color =
          isPeak ? const Color(0xFFF59E0B) : const Color(0xFF10B981)
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final routePath = Path()
      ..moveTo(w * 0.24, h * 0.72)
      ..cubicTo(w * 0.32, h * 0.72, w * 0.38, h * 0.72, w * 0.46,
          h * 0.50)
      ..lineTo(w * 0.64, h * 0.50)
      ..cubicTo(w * 0.70, h * 0.50, w * 0.74, h * 0.28, w * 0.80,
          h * 0.28);

    canvas.drawPath(routePath, routeCasing);
    canvas.drawPath(routePath, routeMain);

    // Animated dashes on route (white)
    final whiteDash = Paint()
      ..color = Colors.white
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    _drawDashedPath(canvas, routePath, whiteDash, 6, 6);
  }

  void _drawDashedLine(Canvas canvas, Offset start, Offset end,
      Paint paint, double dashLen, double gapLen) {
    final dx = end.dx - start.dx;
    final dy = end.dy - start.dy;
    final dist = math.sqrt(dx * dx + dy * dy);
    final stepX = dx / dist * (dashLen + gapLen);
    final stepY = dy / dist * (dashLen + gapLen);
    var cx = start.dx;
    var cy = start.dy;
    while (math.sqrt((cx - start.dx) * (cx - start.dx) +
            (cy - start.dy) * (cy - start.dy)) <
        dist) {
      canvas.drawLine(
        Offset(cx, cy),
        Offset(cx + dx / dist * dashLen, cy + dy / dist * dashLen),
        paint,
      );
      cx += stepX;
      cy += stepY;
    }
  }

  void _drawDashedPath(
      Canvas canvas, Path path, Paint paint, double dash, double gap) {
    final metrics = path.computeMetrics();
    for (final metric in metrics) {
      double dist = 0;
      while (dist < metric.length) {
        final end = (dist + dash).clamp(0.0, metric.length);
        canvas.drawPath(metric.extractPath(dist, end), paint);
        dist += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _MapPainter old) => old.isPeak != isPeak;
}
