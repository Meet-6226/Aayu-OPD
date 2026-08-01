import 'package:flutter/material.dart';

/// Design system color constants extracted from Apollo OPD Web App (`index.css`).
class AppColors {
  AppColors._();

  // Primary Brand Colors
  static const Color primaryTeal = Color(0xFF1B504C);
  static const Color primaryDark = Color(0xFF133B38);
  static const Color lightTeal = Color(0xFFE5F9F8);
  
  // Accent & Status Colors
  static const Color emeraldGreen = Color(0xFF10B981);
  static const Color mintGreen = Color(0xFFE8FAEE);
  static const Color warmYellow = Color(0xFFFFF3D6);
  static const Color goldAmber = Color(0xFFD97706);
  static const Color lightAmber = Color(0xFFF59E0B);
  
  // Status Indicator Colors
  static const Color statusPendingBg = Color(0xFFFEF3C7);
  static const Color statusPendingText = Color(0xFF92400E);
  static const Color statusConfirmedBg = Color(0xFFD1FAE5);
  static const Color statusConfirmedText = Color(0xFF065F46);
  static const Color statusCancelledBg = Color(0xFFFEE2E2);
  static const Color statusCancelledText = Color(0xFF991B1B);
  static const Color statusCompletedBg = Color(0xFFE0E7FF);
  static const Color statusCompletedText = Color(0xFF3730A3);

  // Neutral Colors
  static const Color textDark = Color(0xFF111827);
  static const Color textMedium = Color(0xFF4B5563);
  static const Color textLight = Color(0xFF9CA3AF);
  static const Color borderCustom = Color(0xFFE5E7EB);
  static const Color borderLight = Color(0xFFF3F4F6);
  static const Color bgSubtle = Color(0xFFF9FAFB);
  static const Color bgMain = Color(0xFFF8FAFC);
  static const Color surfaceWhite = Colors.white;

  // Glassmorphism Overlay Colors
  static final Color glassPanelBg = Colors.white.withValues(alpha: 0.85);
  static final Color glassPanelBorder = Colors.white.withValues(alpha: 0.5);
  static final Color glassDarkBg = primaryDark.withValues(alpha: 0.90);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryTeal, emeraldGreen],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient goldGradient = LinearGradient(
    colors: [goldAmber, lightAmber],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkGradient = LinearGradient(
    colors: [primaryDark, primaryTeal],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
