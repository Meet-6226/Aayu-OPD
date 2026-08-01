import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgMain,
      appBar: AppBar(
        title: Image.asset(
          'assets/images/Aayu_logo-removebg-preview.png',
          height: 42,
          fit: BoxFit.contain,
          errorBuilder: (ctx, err, stack) => Image.asset(
            'assets/Aayu_logo-removebg-preview.png',
            height: 42,
            fit: BoxFit.contain,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Login', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Hero Section
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: AppColors.darkGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryDark.withValues(alpha: 0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.sparkles, color: AppColors.warmYellow, size: 14),
                        const SizedBox(width: 6),
                        Text(
                          'Next-Gen Smart OPD Care',
                          style: AppTypography.bodySmall.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Book OPD Appointments Instantly & Skip Long Queue Times',
                    style: AppTypography.displayMedium.copyWith(
                      color: Colors.white,
                      fontSize: 24,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Access top Aayu specialists, track live queue status, and manage your health records effortlessly.',
                    style: AppTypography.bodyMedium.copyWith(
                      color: Colors.white.withValues(alpha: 0.85),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => context.go('/login'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.emeraldGreen,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: const Text('Book Appointment'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => context.go('/seed'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white38),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: const Text('Seed Demo DB'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // Metrics Strip
            Row(
              children: [
                Expanded(child: _buildMetricTile('< 10 mins', 'Avg OPD Wait')),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricTile('99.4%', 'On-Time Consult')),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricTile('10k+', 'Patients Served')),
              ],
            ),

            const SizedBox(height: 32),

            Text(
              'Why Choose Aayu App?',
              style: AppTypography.titleLarge,
            ),
            const SizedBox(height: 16),

            // Features Grid
            _buildFeatureCard(
              icon: LucideIcons.calendarCheck,
              title: 'Instant OPD Slot Booking',
              description: 'Choose your preferred specialist, select convenient morning or evening slots, and confirm instantly.',
              color: AppColors.lightTeal,
              iconColor: AppColors.primaryTeal,
            ),
            const SizedBox(height: 12),
            _buildFeatureCard(
              icon: LucideIcons.brain,
              title: 'AI No-Show & Risk Assessment',
              description: 'Smart AI predictions help optimize doctor schedules and reduce patient waiting times.',
              color: AppColors.warmYellow,
              iconColor: AppColors.goldAmber,
            ),
            const SizedBox(height: 12),
            _buildFeatureCard(
              icon: LucideIcons.shieldCheck,
              title: 'ABHA Health Account Sync',
              description: 'Seamlessly link your Ayushman Bharat Health Account to access verified digital health records anywhere.',
              color: AppColors.mintGreen,
              iconColor: AppColors.emeraldGreen,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile(String value, String label) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderCustom),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: AppTypography.titleLarge.copyWith(
              color: AppColors.primaryTeal,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTypography.bodySmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCard({
    required IconData icon,
    required String title,
    required String description,
    required Color color,
    required Color iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderCustom),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.titleMedium.copyWith(fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: AppTypography.bodyMedium.copyWith(fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
