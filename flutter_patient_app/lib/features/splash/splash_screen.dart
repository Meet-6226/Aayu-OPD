import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../core/theme/app_colors.dart';
import '../auth/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  // Phase 1 – logo drops + bounces in
  late AnimationController _logoCtrl;
  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  late Animation<Offset> _logoSlide;

  // Phase 2 – glow pulse around logo
  late AnimationController _glowCtrl;
  late Animation<double> _glowRadius;

  // Phase 3 – name + tagline fade in
  late AnimationController _textCtrl;
  late Animation<double> _textOpacity;
  late Animation<Offset> _textSlide;

  // Phase 4 – loading bar fills
  late AnimationController _barCtrl;
  late Animation<double> _barProgress;

  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();

    // ── Logo drop-in ──────────────────────────────────────
    _logoCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));

    _logoScale = TweenSequence<double>([
      TweenSequenceItem(
          tween: Tween(begin: 0.3, end: 1.12)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 60),
      TweenSequenceItem(
          tween: Tween(begin: 1.12, end: 0.95)
              .chain(CurveTween(curve: Curves.easeInOut)),
          weight: 20),
      TweenSequenceItem(
          tween: Tween(begin: 0.95, end: 1.0)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 20),
    ]).animate(_logoCtrl);

    _logoOpacity = CurvedAnimation(
      parent: _logoCtrl,
      curve: const Interval(0.0, 0.35, curve: Curves.easeIn),
    );

    _logoSlide = Tween<Offset>(
      begin: const Offset(0, -0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _logoCtrl, curve: Curves.easeOut));

    // ── Glow pulse ───────────────────────────────────────
    _glowCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1200));
    _glowRadius = Tween<double>(begin: 20, end: 50).animate(
      CurvedAnimation(parent: _glowCtrl, curve: Curves.easeInOut),
    );

    // ── Text fade in ─────────────────────────────────────
    _textCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500));
    _textOpacity =
        CurvedAnimation(parent: _textCtrl, curve: Curves.easeIn);
    _textSlide = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut));

    // ── Loading bar ───────────────────────────────────────
    _barCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1800));
    _barProgress = CurvedAnimation(parent: _barCtrl, curve: Curves.easeInOut);

    _runSequence();
  }

  Future<void> _runSequence() async {
    if (!mounted) return;

    // Start logo drop-in and glow animation
    _logoCtrl.forward();
    _glowCtrl.repeat(reverse: true);

    // Wait a bit, then fade in app name/tagline and fill the progress bar
    await Future.delayed(const Duration(milliseconds: 450));
    if (!mounted) return;
    _textCtrl.forward();
    _barCtrl.forward();

    // Minimum preloader display time to show full loading experience (4 seconds)
    await Future.delayed(const Duration(milliseconds: 4000));

    // Wait for auth session to be resolved
    int waited = 0;
    while (mounted && ref.read(authProvider).isLoading && waited < 1000) {
      await Future.delayed(const Duration(milliseconds: 100));
      waited += 100;
    }

    if (mounted && !_hasNavigated) _navigate();
  }

  void _navigate() {
    if (_hasNavigated) return;
    _hasNavigated = true;

    final authState = ref.read(authProvider);
    if (authState.isAuthenticated && authState.patient != null) {
      context.go('/home');
    } else {
      context.go('/login');
    }
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _glowCtrl.dispose();
    _textCtrl.dispose();
    _barCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: AppColors.primaryDark,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF0D2E2B),
              Color(0xFF133B38),
              Color(0xFF1B504C),
            ],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // Background decorative circles
              Positioned(
                top: -60,
                right: -60,
                child: _DecorCircle(size: 220, opacity: 0.06),
              ),
              Positioned(
                bottom: -40,
                left: -40,
                child: _DecorCircle(size: 180, opacity: 0.05),
              ),
              Positioned(
                top: 100,
                left: -30,
                child: _DecorCircle(size: 100, opacity: 0.04),
              ),

              // Main content
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // ── LOGO ────────────────────────────────────
                    AnimatedBuilder(
                      animation: Listenable.merge(
                          [_logoCtrl, _glowCtrl]),
                      builder: (context, child) {
                        return FadeTransition(
                          opacity: _logoOpacity,
                          child: SlideTransition(
                            position: _logoSlide,
                            child: ScaleTransition(
                              scale: _logoScale,
                              child: child,
                            ),
                          ),
                        );
                      },
                      child: _LogoWidget(
                        glowRadiusAnim: _glowRadius,
                        glowCtrl: _glowCtrl,
                      ),
                    ),

                    const SizedBox(height: 32),

                    // ── APP NAME + TAGLINE ───────────────────────
                    AnimatedBuilder(
                      animation: _textCtrl,
                      builder: (context, child) {
                        return FadeTransition(
                          opacity: _textOpacity,
                          child: SlideTransition(
                            position: _textSlide,
                            child: child,
                          ),
                        );
                      },
                      child: Column(
                        children: [
                          // App name
                          RichText(
                            text: const TextSpan(
                              children: [
                                TextSpan(
                                  text: 'AAYU',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 34,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 6,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 5),
                            decoration: BoxDecoration(
                              color:
                                  Colors.white.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.15),
                              ),
                            ),
                            child: Text(
                              'Patient Portal',
                              style: TextStyle(
                                color:
                                    Colors.white.withValues(alpha: 0.75),
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                letterSpacing: 2.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 56),

                    // ── LOADING BAR ──────────────────────────────
                    AnimatedBuilder(
                      animation: _barCtrl,
                      builder: (context, _) {
                        return Column(
                          children: [
                            SizedBox(
                              width: 200,
                              child: Column(
                                children: [
                                  // Label
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        _getLoadingLabel(
                                            _barProgress.value),
                                        style: TextStyle(
                                          color: Colors.white
                                              .withValues(alpha: 0.5),
                                          fontSize: 10,
                                          letterSpacing: 1.0,
                                        ),
                                      ),
                                      Text(
                                        '${(_barProgress.value * 100).toInt()}%',
                                        style: TextStyle(
                                          color: AppColors.emeraldGreen
                                              .withValues(alpha: 0.9),
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  // Track
                                  ClipRRect(
                                    borderRadius:
                                        BorderRadius.circular(4),
                                    child: Container(
                                      height: 3,
                                      color: Colors.white
                                          .withValues(alpha: 0.12),
                                      child: Align(
                                        alignment: Alignment.centerLeft,
                                        child: FractionallySizedBox(
                                          widthFactor:
                                              _barProgress.value,
                                          child: Container(
                                            decoration: BoxDecoration(
                                              gradient:
                                                  const LinearGradient(
                                                colors: [
                                                  AppColors.emeraldGreen,
                                                  Color(0xFF34D399),
                                                ],
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(
                                                      4),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),

              // Bottom branding
              Positioned(
                bottom: 24,
                left: 0,
                right: 0,
                child: AnimatedBuilder(
                  animation: _textCtrl,
                  builder: (_, child) {
                    return Opacity(
                      opacity: _textOpacity.value * 0.5,
                      child: child,
                    );
                  },
                  child: Column(
                    children: [
                      Text(
                        'Powered by Aayu Intelligence',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.4),
                          fontSize: 11,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'HIPAA & ABDM Compliant',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppColors.emeraldGreen.withValues(alpha: 0.6),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getLoadingLabel(double progress) {
    if (progress < 0.35) return 'CONNECTING...';
    if (progress < 0.65) return 'LOADING DATA...';
    if (progress < 0.90) return 'SECURING SESSION...';
    return 'READY';
  }
}

// ── Logo Widget ───────────────────────────────────────────────────────────────
class _LogoWidget extends StatelessWidget {
  final Animation<double> glowRadiusAnim;
  final AnimationController glowCtrl;

  const _LogoWidget({
    required this.glowRadiusAnim,
    required this.glowCtrl,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Image.asset(
        'assets/images/new_logo-removebg-preview.png',
        width: 260,
        height: 130,
        fit: BoxFit.contain,
        errorBuilder: (ctx, err, stack) => Image.asset(
          'assets/new_logo-removebg-preview.png',
          width: 260,
          height: 130,
          fit: BoxFit.contain,
        ),
      ),
    );
  }
}

// ── Decorative background circle ─────────────────────────────────────────────
class _DecorCircle extends StatelessWidget {
  final double size;
  final double opacity;

  const _DecorCircle({required this.size, required this.opacity});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: Colors.white.withValues(alpha: opacity),
          width: 1.5,
        ),
      ),
    );
  }
}
