import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notifications = [
      {
        'title': 'Appointment Confirmed',
        'desc': 'Your OPD consultation with Dr. Arjun Deshmukh is confirmed for July 25 at 10:30 AM.',
        'time': '2 hours ago',
        'icon': LucideIcons.calendarCheck,
        'color': AppColors.emeraldGreen,
      },
      {
        'title': '24-Hour OPD Reminder',
        'desc': 'Reminder: Please reach Aayu OPD Counter B 10 minutes prior for queue pass verification.',
        'time': 'Yesterday',
        'icon': LucideIcons.bellRing,
        'color': AppColors.primaryTeal,
      },
      {
        'title': 'ABHA Health Card Verified',
        'desc': 'Your ABHA digital health account (91-8087-0271-7890) has been linked successfully.',
        'time': '3 days ago',
        'icon': LucideIcons.shieldCheck,
        'color': AppColors.goldAmber,
      },
    ];

    return Scaffold(
      backgroundColor: AppColors.bgMain,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: InkWell(
            onTap: () => context.canPop() ? context.pop() : context.go('/home'),
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
        title: Text('Notifications', style: AppTypography.titleLarge.copyWith(fontSize: 18)),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: notifications.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final item = notifications[index];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderCustom),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: (item['color'] as Color).withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(item['icon'] as IconData, color: item['color'] as Color, size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(item['title'] as String, style: AppTypography.bodyLarge.copyWith(fontSize: 14, fontWeight: FontWeight.bold)),
                          Text(item['time'] as String, style: AppTypography.bodySmall),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(item['desc'] as String, style: AppTypography.bodySmall.copyWith(color: AppColors.textMedium)),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
