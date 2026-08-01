import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class DoctorAvatar extends StatelessWidget {
  final String imagePath;
  final String initials;
  final double radius;

  const DoctorAvatar({
    super.key,
    required this.imagePath,
    required this.initials,
    this.radius = 28,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: radius * 2,
      height: radius * 2,
      decoration: BoxDecoration(
        color: AppColors.lightTeal,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.primaryTeal.withValues(alpha: 0.15), width: 1.5),
      ),
      child: ClipOval(
        child: imagePath.isNotEmpty
            ? Image.asset(
                imagePath,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Center(
                    child: Text(
                      initials.isNotEmpty ? initials : 'DR',
                      style: TextStyle(
                        fontSize: radius * 0.7,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryTeal,
                      ),
                    ),
                  );
                },
              )
            : Center(
                child: Text(
                  initials.isNotEmpty ? initials : 'DR',
                  style: TextStyle(
                    fontSize: radius * 0.7,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryTeal,
                  ),
                ),
              ),
      ),
    );
  }
}
