import 'dart:io';
import 'dart:html' as html;
import 'dart:ui_web' as ui_web;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
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
  String _targetUrl = '';
  final TextEditingController _urlInputController = TextEditingController();
  bool _showDebugBar = false;
  final String _iframeViewId = 'nidaan-iframe-${DateTime.now().millisecondsSinceEpoch}';

  @override
  void initState() {
    super.initState();
    _targetUrl = 'http://localhost:5173';
    _urlInputController.text = _targetUrl;
    _registerIframe(_targetUrl);

    // Simulate loading completion after iframe initializes
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) setState(() => _isLoading = false);
    });
  }

  void _registerIframe(String url) {
    ui_web.platformViewRegistry.registerViewFactory(
      _iframeViewId,
      (int viewId) {
        final iframe = html.IFrameElement()
          ..src = url
          ..style.border = 'none'
          ..style.width = '100%'
          ..style.height = '100%'
          ..allow = 'fullscreen';
        return iframe;
      },
    );
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
    });
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) setState(() => _isLoading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    // Show phone mock frame on Web or Desktop targets to simulate mobile device view
    final bool useFrame = kIsWeb || !(Platform.isAndroid || Platform.isIOS);

    Widget webContent = Stack(
      children: [
        // iframe-based web view
        HtmlElementView(viewType: _iframeViewId),

        // Progress/Splash overlay on initial load
        if (_isLoading) _buildSplashOverlay(),
      ],
    );

    if (useFrame) {
      webContent = Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 420, maxHeight: 840),
          margin: const EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(40.0),
            border: Border.all(color: const Color(0xFF1E293B), width: 12.0),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.55),
                blurRadius: 32.0,
                spreadRadius: 4.0,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: webContent,
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
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
                        hintText: 'Enter URL (e.g. localhost:5173)',
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
                      style: GoogleFonts.inter(
                          fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFF64748B)),
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
      body: SafeArea(child: webContent),
    );
  }

  Widget _buildSplashOverlay() {
    return Container(
      color: const Color(0xFF0F172A),
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          GestureDetector(
            onDoubleTap: () => setState(() => _showDebugBar = !_showDebugBar),
            child: const BrandLogo(height: 48, textColor: Colors.white),
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
