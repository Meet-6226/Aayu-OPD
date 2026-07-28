import 'package:flutter/material.dart';

class ClinicalCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color backgroundColor;
  final double borderRadius;
  final Border? border;
  final VoidCallback? onTap;

  const ClinicalCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16.0),
    this.backgroundColor = Colors.white,
    this.borderRadius = 10.0,
    this.border,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cardDecoration = BoxDecoration(
      color: backgroundColor,
      borderRadius: BorderRadius.circular(borderRadius),
      border: border ?? Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.015),
          blurRadius: 10.0,
          offset: const Offset(0, 4),
        )
      ],
    );

    if (onTap != null) {
      return Container(
        decoration: cardDecoration,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(borderRadius),
            child: Padding(
              padding: padding,
              child: child,
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: cardDecoration,
      padding: padding,
      child: child,
    );
  }
}
