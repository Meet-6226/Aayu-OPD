// lib/shared/widgets/main_shell_scaffold.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/localization/language_provider.dart';

class MainShellScaffold extends ConsumerWidget {
  final Widget child;

  const MainShellScaffold({super.key, required this.child});

  int _getSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/appointments')) return 1;
    if (location.startsWith('/doctors') || location.startsWith('/records')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0; // /home
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/home');
        break;
      case 1:
        context.go('/appointments');
        break;
      case 2:
        context.push('/emergency');
        break;
      case 3:
        context.go('/doctors');
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }

  void _triggerGlobalEmergency(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.emergency, color: Colors.white, size: 20),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                '🚨 Long-Press SOS Triggered! Opening Emergency Report...',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        backgroundColor: Color(0xFFDC2626),
        duration: Duration(seconds: 2),
      ),
    );
    context.push('/emergency');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedIndex = _getSelectedIndex(context);
    final location = GoRouterState.of(context).matchedLocation;
    final isEmergency = location.startsWith('/emergency');

    ref.watch(languageProvider);
    final tr = ref.read(languageProvider.notifier).translate;

    Widget mainContent = child;

    // Wrap with global long press emergency listener if not on emergency screen
    if (!isEmergency) {
      mainContent = GestureDetector(
        behavior: HitTestBehavior.translucent,
        onLongPress: () => _triggerGlobalEmergency(context),
        child: child,
      );
    }

    return Scaffold(
      body: mainContent,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade200, width: 1)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(
                  context,
                  index: 0,
                  icon: LucideIcons.home,
                  label: tr('nav_home'),
                  isSelected: selectedIndex == 0,
                ),
                _buildNavItem(
                  context,
                  index: 1,
                  icon: LucideIcons.calendar,
                  label: tr('nav_appointments'),
                  isSelected: selectedIndex == 1,
                ),
                // Center Emergency SOS Button
                GestureDetector(
                  onTap: () => context.push('/emergency'),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFFDC2626),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFDC2626).withValues(alpha: 0.35),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(Icons.emergency_rounded, color: Colors.white, size: 24),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        tr('nav_emergency'),
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFDC2626),
                        ),
                      ),
                    ],
                  ),
                ),
                _buildNavItem(
                  context,
                  index: 3,
                  icon: LucideIcons.stethoscope,
                  label: tr('nav_doctors'),
                  isSelected: selectedIndex == 3,
                ),
                _buildNavItem(
                  context,
                  index: 4,
                  icon: LucideIcons.user,
                  label: tr('nav_profile'),
                  isSelected: selectedIndex == 4,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required int index,
    required IconData icon,
    required String label,
    required bool isSelected,
  }) {
    return InkWell(
      onTap: () => _onItemTapped(index, context),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected ? const Color(0xFF0F766E) : Colors.grey.shade400,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? const Color(0xFF0F766E) : Colors.grey.shade500,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                fontSize: 11,
              ),
            ),
            if (isSelected)
              Container(
                margin: const EdgeInsets.only(top: 3),
                width: 16,
                height: 2,
                decoration: BoxDecoration(
                  color: const Color(0xFF0F766E),
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
