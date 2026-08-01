import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/app_colors.dart';
import 'core/router/app_router.dart';
import 'core/services/firebase_service.dart';
import 'features/auth/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await FirebaseService().initFirebase();
  } catch (e) {
    debugPrint("[main] Firebase init fallback: $e");
  }

  runApp(
    const ProviderScope(
      child: AayuPatientApp(),
    ),
  );
}

class AayuPatientApp extends ConsumerWidget {
  const AayuPatientApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    // Watch auth changes and notify GoRouter to run redirect() logic.
    ref.listen<AuthState>(authProvider, (previous, next) {
      router.refresh();
    });

    return MaterialApp.router(
      title: 'Aayu Patient Portal',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: router,
      builder: (context, child) {
        return ResponsiveMobileWrapper(child: child ?? const SizedBox());
      },
    );
  }
}

/// Responsive wrapper that centers the app in a phone frame when viewed on desktop browsers.
class ResponsiveMobileWrapper extends StatelessWidget {
  final Widget child;

  const ResponsiveMobileWrapper({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > 500) {
          return Scaffold(
            backgroundColor: const Color(0xFF0F172A), // Dark slate desktop background
            body: Center(
              child: Container(
                width: 440,
                height: constraints.maxHeight * 0.94,
                margin: const EdgeInsets.symmetric(vertical: 20),
                decoration: BoxDecoration(
                  color: AppColors.bgMain,
                  borderRadius: BorderRadius.circular(40),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      blurRadius: 30,
                      spreadRadius: 5,
                      offset: const Offset(0, 10),
                    ),
                  ],
                  border: Border.all(color: const Color(0xFF334155), width: 8),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(32),
                  child: child,
                ),
              ),
            ),
          );
        }
        return child;
      },
    );
  }
}
