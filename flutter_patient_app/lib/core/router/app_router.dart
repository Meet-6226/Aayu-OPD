import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/auth_provider.dart';
import '../../features/auth/login_screen.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/home/landing_screen.dart';
import '../../features/doctors/browse_doctors_screen.dart';
import '../../features/doctors/doctor_profile_screen.dart';
import '../../features/booking/booking_confirmation_screen.dart';
import '../../features/appointments/my_appointments_screen.dart';
import '../../features/appointments/appointment_detail_screen.dart';
import '../../features/profile/patient_profile_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/seed/seed_db_screen.dart';
import '../../shared/widgets/main_shell_scaffold.dart';
import '../../features/emergency/presentation/screens/emergency_screen.dart';
import '../../features/emergency/presentation/screens/ambulance_tracking_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuth = authState.isAuthenticated;
      final isSplash = state.matchedLocation == '/splash';
      final isLogin = state.matchedLocation == '/login';
      final isLanding = state.matchedLocation == '/landing';
      final isSeed = state.matchedLocation == '/seed';

      // Never interrupt splash, landing, or seed
      if (isSplash || isSeed || isLanding) return null;

      // Redirect unauthenticated users to login
      if (!isAuth && !isLogin) {
        return '/login';
      }

      // Redirect authenticated users away from login
      if (isAuth && isLogin) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/landing',
        builder: (context, state) => const LandingScreen(),
      ),
      GoRoute(
        path: '/seed',
        builder: (context, state) => const SeedDbScreen(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/emergency',
        name: 'emergency',
        builder: (context, state) => const EmergencyScreen(),
      ),
      GoRoute(
        path: '/emergency/tracking/:reportId',
        name: 'ambulanceTracking',
        builder: (context, state) {
          final reportId = state.pathParameters['reportId'] ?? '';
          return AmbulanceTrackingScreen(reportId: reportId);
        },
      ),
      GoRoute(
        path: '/doctor/:id',
        builder: (context, state) {
          final docId = state.pathParameters['id'] ?? '';
          return DoctorProfileScreen(doctorId: docId);
        },
      ),
      GoRoute(
        path: '/booking/confirm',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return BookingConfirmationScreen(
            doctorId: extra['doctorId'] as String? ?? '',
            selectedDate: extra['selectedDate'] as String? ?? '',
            selectedTime: extra['selectedTime'] as String? ?? '',
          );
        },
      ),
      GoRoute(
        path: '/appointment/:id',
        builder: (context, state) {
          final aptId = state.pathParameters['id'] ?? '';
          return AppointmentDetailScreen(appointmentId: aptId);
        },
      ),
      ShellRoute(
        builder: (context, state, child) {
          return MainShellScaffold(child: child);
        },
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/doctors',
            builder: (context, state) => const BrowseDoctorsScreen(),
          ),
          GoRoute(
            path: '/appointments',
            builder: (context, state) => const MyAppointmentsScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const PatientProfileScreen(),
          ),
        ],
      ),
    ],
  );
});
