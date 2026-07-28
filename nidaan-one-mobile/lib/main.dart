import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Conditional imports for cross-platform WebView support (prevents compilation failure on web/mobile)
import 'widgets/webview_platform_stub.dart'
    if (dart.library.html) 'widgets/webview_platform_web.dart'
    if (dart.library.io) 'widgets/webview_platform_mobile.dart';

import 'widgets/brand_logo.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const NidaanOneApp());
}

class NidaanOneApp extends StatelessWidget {
  const NidaanOneApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Nidaan One',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: const Color(0xFF0F766E),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F766E),
          primary: const Color(0xFF0F766E),
          secondary: const Color(0xFF0D9488),
          surface: Colors.white,
        ),
        textTheme: GoogleFonts.interTextTheme(Theme.of(context).textTheme),
      ),
      home: const PatientPortalWrapper(),
    );
  }
}

class PatientPortalWrapper extends StatefulWidget {
  const PatientPortalWrapper({super.key});

  @override
  State<PatientPortalWrapper> createState() => _PatientPortalWrapperState();
}

class _PatientPortalWrapperState extends State<PatientPortalWrapper> {
  bool _isLoading = true;
  double _loadingProgress = 0.0;
  String _targetUrl = '';
  final TextEditingController _urlInputController = TextEditingController();
  bool _showDebugBar = false;

  @override
  void initState() {
    super.initState();
    _resolveTargetUrl();
  }

  void _resolveTargetUrl() {
    // Determine local development URL based on platform
    if (kIsWeb) {
      _targetUrl = 'http://localhost:5173';
    } else if (Platform.isAndroid) {
      // 10.0.2.2 points to local machine loopback inside Android Emulator
      _targetUrl = 'http://10.0.2.2:5173';
    } else {
      // iOS Simulator and Desktop macOS
      _targetUrl = 'http://localhost:5173';
    }
    _urlInputController.text = _targetUrl;
  }

  void _updateUrl(String newUrl) {
    if (newUrl.trim().isEmpty) return;
    String formattedUrl = newUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'http://$formattedUrl';
    }
    setState(() {
      _targetUrl = formattedUrl;
      _isLoading = true;
      _loadingProgress = 0.0;
    });
  }

  @override
  Widget build(BuildContext context) {
    // Show phone mock frame on Web or Desktop targets to simulate mobile device view
    final bool useFrame = kIsWeb || !(Platform.isAndroid || Platform.isIOS);

    Widget mainContent = Stack(
      children: [
        // 1. The Dynamic Cross-Platform WebView Widget (registers HTML iframe on Web, Webview on Mobile)
        createWebView(_targetUrl, (isLoading) {
          setState(() {
            _isLoading = isLoading;
            _loadingProgress = isLoading ? 0.3 : 1.0;
          });
        }),

        // 2. Linear Progress Bar during loading
        if (_isLoading)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: LinearProgressIndicator(
              value: _loadingProgress,
              backgroundColor: Colors.transparent,
              color: const Color(0xFF0F766E),
              minHeight: 3,
            ),
          ),

        // 3. Premium Nidaan One Animated Splash Screen (shown on launch)
        if (_isLoading)
          _buildSplashOverlay(),
      ],
    );

    if (useFrame) {
      mainContent = Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 420, maxHeight: 840),
          margin: const EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(40.0), // Rounded iPhone-style bezel corners
            border: Border.all(color: const Color(0xFF1E293B), width: 12.0), // Phone bezel frame
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.55),
                blurRadius: 32.0,
                spreadRadius: 4.0,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: mainContent,
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Matches the dark Web theme
      appBar: _showDebugBar || kDebugMode
          ? AppBar(
              backgroundColor: Colors.white,
              elevation: 0,
              toolbarHeight: _showDebugBar ? 60.0 : 36.0,
              title: _showDebugBar
                  ? TextField(
                      controller: _urlInputController,
                      style: GoogleFonts.inter(fontSize: 12),
                      decoration: InputDecoration(
                        hintText: 'Enter React App URL (e.g. localhost:5173)',
                        hintStyle: GoogleFonts.inter(fontSize: 11, color: Colors.grey),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12.0),
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.arrow_forward, size: 16),
                          onPressed: () => _updateUrl(_urlInputController.text),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(6.0),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                      ),
                      onSubmitted: _updateUrl,
                    )
                  : Text(
                      'DEVELOPER SANDBOX MODE — double-click logo to change URL',
                      style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFF64748B)),
                    ),
              leading: _showDebugBar
                  ? IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () => setState(() => _showDebugBar = false),
                    )
                  : null,
              actions: [
                if (!_showDebugBar)
                  IconButton(
                    icon: const Icon(Icons.settings_outlined, size: 16),
                    onPressed: () => setState(() => _showDebugBar = true),
                  ),
              ],
            )
          : null,
      body: SafeArea(
        child: mainContent,
      ),
    );
  }

  Widget _buildSplashOverlay() {
    return Container(
      color: const Color(0xFF0F172A), // Premium Dark Slate base
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Glowing logo
          GestureDetector(
            onDoubleTap: () {
              setState(() {
                _showDebugBar = !_showDebugBar;
              });
            },
            child: const BrandLogo(
              height: 48,
              textColor: Colors.white,
            ),
          ),
          const SizedBox(height: 40),
          const SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              color: Color(0xFF0F766E),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Synchronizing clinical layers...',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF64748B),
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
