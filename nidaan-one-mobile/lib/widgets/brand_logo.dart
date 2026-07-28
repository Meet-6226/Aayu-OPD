import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class BrandLogo extends StatelessWidget {
  final double height;
  final bool showText;
  final Color? textColor;

  const BrandLogo({
    super.key,
    this.height = 36.0,
    this.showText = true,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final logoWidget = CustomPaint(
      size: Size(height * 1.2, height),
      painter: _CaduceusPainter(),
    );

    if (!showText) {
      return logoWidget;
    }

    final double titleSize = height >= 40 ? 18.0 : 15.0;
    final double subtitleSize = height >= 40 ? 8.5 : 7.0;

    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        logoWidget,
        const SizedBox(width: 8.0),
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Nidaan',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w900,
                    fontSize: titleSize,
                    color: textColor ?? const Color(0xFF0F172A),
                    letterSpacing: -0.5,
                  ),
                ),
                Text(
                  'One',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w900,
                    fontSize: titleSize,
                    color: const Color(0xFF0F766E),
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2.0),
            Text(
              'PREDICT. PREVENT. OPTIMIZE.',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w900,
                fontSize: subtitleSize,
                color: textColor?.withValues(alpha: 0.6) ?? const Color(0xFF64748B),
                letterSpacing: 1.0,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _CaduceusPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final Paint tealPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF0F766E), Color(0xFF0D9488)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final Paint lightTealPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF0D9488), Color(0xFF14B8A6)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..strokeWidth = 1.8
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final Paint fillPaint = Paint()
      ..color = const Color(0xFF0F766E)
      ..style = PaintingStyle.fill;

    // Draw central staff
    final double staffWidth = size.width * 0.05;
    final double staffHeight = size.height * 0.7;
    final double staffX = (size.width - staffWidth) / 2;
    final double staffY = size.height * 0.2;

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(staffX, staffY, staffWidth, staffHeight),
        const Radius.circular(1.0),
      ),
      fillPaint,
    );

    // Draw sphere at top of staff
    canvas.drawCircle(
      Offset(size.width / 2, staffY - 2.0),
      size.height * 0.08,
      fillPaint,
    );

    // Draw wings (Teal curves left and right)
    final double centerX = size.width / 2;
    final double wingsY = size.height * 0.35;

    // Left wings
    final Path leftWing1 = Path()
      ..moveTo(centerX, wingsY)
      ..cubicTo(centerX - 10, wingsY - 2, centerX - 18, wingsY - 8, centerX - 22, wingsY - 14)
      ..cubicTo(centerX - 16, wingsY - 14, centerX - 8, wingsY - 8, centerX, wingsY - 2);
    canvas.drawPath(leftWing1, tealPaint);

    final Path leftWing2 = Path()
      ..moveTo(centerX, wingsY + 4)
      ..cubicTo(centerX - 8, wingsY + 2, centerX - 16, wingsY - 2, centerX - 20, wingsY - 8)
      ..cubicTo(centerX - 15, wingsY - 8, centerX - 7, wingsY - 2, centerX, wingsY + 2);
    canvas.drawPath(leftWing2, tealPaint);

    // Right wings
    final Path rightWing1 = Path()
      ..moveTo(centerX, wingsY)
      ..cubicTo(centerX + 10, wingsY - 2, centerX + 18, wingsY - 8, centerX + 22, wingsY - 14)
      ..cubicTo(centerX + 16, wingsY - 14, centerX + 8, wingsY - 8, centerX, wingsY - 2);
    canvas.drawPath(rightWing1, lightTealPaint);

    final Path rightWing2 = Path()
      ..moveTo(centerX, wingsY + 4)
      ..cubicTo(centerX + 8, wingsY + 2, centerX + 16, wingsY - 2, centerX + 20, wingsY - 8)
      ..cubicTo(centerX + 15, wingsY - 8, centerX + 7, wingsY - 2, centerX, wingsY + 2);
    canvas.drawPath(rightWing2, lightTealPaint);

    // Draw winding snakes
    final Path snake1 = Path()
      ..moveTo(centerX - 8, size.height * 0.75)
      ..quadraticBezierTo(centerX - 12, size.height * 0.65, centerX, size.height * 0.58)
      ..quadraticBezierTo(centerX + 12, size.height * 0.5, centerX, size.height * 0.42)
      ..quadraticBezierTo(centerX - 12, size.height * 0.35, centerX, size.height * 0.3);
    canvas.drawPath(snake1, tealPaint);

    final Path snake2 = Path()
      ..moveTo(centerX + 8, size.height * 0.75)
      ..quadraticBezierTo(centerX + 12, size.height * 0.65, centerX, size.height * 0.58)
      ..quadraticBezierTo(centerX - 12, size.height * 0.5, centerX, size.height * 0.42)
      ..quadraticBezierTo(centerX + 12, size.height * 0.35, centerX, size.height * 0.3);
    canvas.drawPath(snake2, lightTealPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
