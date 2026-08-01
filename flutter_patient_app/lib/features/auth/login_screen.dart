import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/services/demo_triggers_service.dart';
import 'auth_provider.dart';

// WhatsApp sandbox code — matches website's DEMO_CONFIG.twilioSandboxCode
const _kWhatsAppSandboxCode = 'corn-length';
const _kWhatsAppNumber = '14155238886';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  // ── Step control ─────────────────────────────────────
  int _currentStep = 1; // 1=Phone, 2=OTP, 3=Details, 4=History, 5=Rx Upload, 6=Persona

  // ── Step 1: Phone ────────────────────────────────────
  final _phoneController = TextEditingController();
  bool _whatsappOptIn = true;
  String _step1Error = '';

  // ── Step 2: OTP ──────────────────────────────────────
  final List<TextEditingController> _otpControllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());
  String _generatedOtp = '';
  int _resendTimer = 30;
  Timer? _resendTimerRef;
  String _step2Error = '';
  bool _step2Loading = false;

  // ── Step 3: Patient Details ───────────────────────────
  final _nameController = TextEditingController();
  final _ageController = TextEditingController();
  final _cityController = TextEditingController();
  final _emailController = TextEditingController();
  String _gender = '';
  String _bloodGroup = '';
  String _step3Error = '';
  bool _step3Submitted = false;

  // ── Step 4: Medical History ─────────────────
  List<String> _selectedMedicalConditions = [];
  final _customConditionController = TextEditingController();

  // ── Step 5: Prescription Upload ──────────────────────
  String _prescriptionFileName = '';

  // ── Step 6: Persona & ABHA ────────────────────────────
  final _abhaController = TextEditingController();
  String _selectedPersona = 'working_professional';
  bool _step4Loading = false;

  // ── General ───────────────────────────────────────────
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 300));
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeIn);
    _fadeCtrl.forward();

    // Generate a demo OTP immediately for demo convenience
    _generatedOtp = _generateOtp();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    for (final c in _otpControllers) {
      c.dispose();
    }
    for (final f in _otpFocusNodes) {
      f.dispose();
    }
    _nameController.dispose();
    _ageController.dispose();
    _cityController.dispose();
    _emailController.dispose();
    _abhaController.dispose();
    _customConditionController.dispose();
    _resendTimerRef?.cancel();
    _fadeCtrl.dispose();
    super.dispose();
  }

  // ── Helpers ───────────────────────────────────────────
  String _generateOtp() {
    final r = (100000 + (DateTime.now().millisecondsSinceEpoch % 900000));
    return r.toString();
  }

  String get _rawPhone => _phoneController.text.replaceAll(RegExp(r'\D'), '');

  void _startResendTimer() {
    _resendTimerRef?.cancel();
    setState(() => _resendTimer = 30);
    _resendTimerRef = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() {
        _resendTimer--;
        if (_resendTimer <= 0) t.cancel();
      });
    });
  }

  void _animateStep() {
    _fadeCtrl.reset();
    _fadeCtrl.forward();
  }

  // ── Step 1 Logic ─────────────────────────────────────
  void _handleSendOtp() {
    if (_rawPhone.length != 10) {
      setState(() => _step1Error = 'Please enter a valid 10-digit number');
      return;
    }
    setState(() {
      _step1Error = '';
      _generatedOtp = _generateOtp();
      _currentStep = 2;
    });
    _startResendTimer();
    _animateStep();

    // Show demo OTP toast
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(LucideIcons.messageSquare, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Expanded(child: Text('Demo OTP: $_generatedOtp (sent via SMS)')),
          ],
        ),
        backgroundColor: AppColors.primaryTeal,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 8),
      ),
    );
  }

  void _selectDemoPatient(String phone) {
    setState(() {
      _phoneController.text = phone;
      _step1Error = '';
    });
  }

  // ── Step 2 Logic ─────────────────────────────────────
  String get _enteredOtp => _otpControllers.map((c) => c.text).join();

  Future<void> _handleVerifyOtp() async {
    if (_enteredOtp.length != 6) return;

    if (_enteredOtp != _generatedOtp) {
      setState(() => _step2Error = 'Incorrect OTP. Please check and try again.');
      return;
    }

    // Immediately open WhatsApp with 'join lose-sum' on direct user click gesture (bypasses popup blocker)
    _openWhatsApp();

    setState(() {
      _step2Error = '';
      _step2Loading = true;
    });

    await ref.read(authProvider.notifier).loginWithPhone(_rawPhone);
    if (!mounted) return;
    final patient = ref.read(authProvider).patient;

    if (patient != null && !patient.isNew) {
      if (patient.name.isNotEmpty) _nameController.text = patient.name;
      if (patient.age > 0) _ageController.text = patient.age.toString();
      if (patient.city.isNotEmpty) _cityController.text = patient.city;
      if (patient.email.isNotEmpty) _emailController.text = patient.email;
      if (patient.gender.isNotEmpty) _gender = patient.gender.toLowerCase();
      if (patient.bloodGroup.isNotEmpty) _bloodGroup = patient.bloodGroup;
      if (patient.abhaId.isNotEmpty) _abhaController.text = patient.abhaId;
      if (patient.persona.isNotEmpty) _selectedPersona = patient.persona;
      if (patient.medicalConditions.isNotEmpty) {
        _selectedMedicalConditions = List.from(patient.medicalConditions);
      }
      if (patient.prescriptionName.isNotEmpty) {
        _prescriptionFileName = patient.prescriptionName;
      }
    } else {
      _nameController.clear();
      _ageController.clear();
      _cityController.clear();
      _emailController.clear();
      _abhaController.clear();
      _gender = '';
      _bloodGroup = '';
      _selectedPersona = 'working_professional';
      _selectedMedicalConditions = [];
      _prescriptionFileName = '';
    }

    if (!mounted) return;
    setState(() {
      _step2Loading = false;
      _currentStep = 3;
    });
    _animateStep();
  }

  void _openWhatsApp() async {
    final whatsappUrl = Uri.parse(
        'https://wa.me/$_kWhatsAppNumber?text=${Uri.encodeComponent('join $_kWhatsAppSandboxCode')}');
    bool launched = false;
    try {
      launched = await launchUrl(
        whatsappUrl,
        mode: LaunchMode.externalApplication,
      );
    } catch (_) {
      launched = false;
    }

    // If WhatsApp couldn't be opened, show a helpful bottom sheet
    if (!launched && mounted) {
      _showWhatsAppFallbackSheet(whatsappUrl.toString());
    }
  }

  void _showWhatsAppFallbackSheet(String url) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: AppColors.borderCustom,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF25D366),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.chat_rounded,
                        color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Join Aayu WhatsApp',
                            style: AppTypography.bodyMedium.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppColors.textDark)),
                        const SizedBox(height: 2),
                        Text(
                          'Send "join $_kWhatsAppSandboxCode" to +$_kWhatsAppNumber',
                          style: AppTypography.bodySmall.copyWith(
                              color: AppColors.textMedium, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: () async {
                  Navigator.pop(context);
                  final webUrl = Uri.parse(url);
                  try {
                    await launchUrl(webUrl,
                        mode: LaunchMode.platformDefault);
                  } catch (_) {}
                },
                icon: const Icon(Icons.open_in_new, size: 18),
                label: const Text('Open WhatsApp Link'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF25D366),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Skip for now'),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _autoFillOtp() {
    for (int i = 0; i < 6 && i < _generatedOtp.length; i++) {
      _otpControllers[i].text = _generatedOtp[i];
    }
    setState(() => _step2Error = '');
    _otpFocusNodes[5].requestFocus();
  }

  void _handleOtpChange(int index, String value) {
    if (value.isNotEmpty && index < 5) {
      _otpFocusNodes[index + 1].requestFocus();
    }
    setState(() => _step2Error = '');
  }

  void _handleOtpBackspace(int index) {
    if (_otpControllers[index].text.isEmpty && index > 0) {
      _otpFocusNodes[index - 1].requestFocus();
    }
  }

  void _resendOtp() {
    if (_resendTimer > 0) return;
    setState(() {
      _generatedOtp = _generateOtp();
      for (final c in _otpControllers) {
        c.clear();
      }
      _step2Error = '';
    });
    _startResendTimer();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('New OTP: $_generatedOtp'),
        backgroundColor: AppColors.primaryTeal,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  // ── Step 3 Logic ─────────────────────────────────────
  void _handleProfileNext() {
    setState(() => _step3Submitted = true);

    if (_nameController.text.trim().isEmpty) {
      setState(() => _step3Error = 'Full name is required');
      return;
    }
    if (_ageController.text.trim().isEmpty) {
      setState(() => _step3Error = 'Age is required');
      return;
    }
    if (_gender.isEmpty) {
      setState(() => _step3Error = 'Please select your gender');
      return;
    }
    if (_cityController.text.trim().isEmpty) {
      setState(() => _step3Error = 'City is required');
      return;
    }
    if (_bloodGroup.isEmpty) {
      setState(() => _step3Error = 'Please select blood group');
      return;
    }

    setState(() {
      _step3Error = '';
      _currentStep = 4;
    });
    _animateStep();
  }

  // ── Step 4 Logic ─────────────────────────────────────
  Future<void> _handleCompleteProfile() async {
    if (_selectedPersona.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please select your profile type'),
          backgroundColor: AppColors.statusCancelledText,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    setState(() => _step4Loading = true);

    await ref.read(authProvider.notifier).completeProfile(
          name: _nameController.text.trim(),
          age: int.tryParse(_ageController.text.trim()) ?? 0,
          gender: _gender,
          city: _cityController.text.trim(),
          bloodGroup: _bloodGroup,
          email: _emailController.text.trim(),
          abhaId: _abhaController.text.trim(),
          persona: _selectedPersona,
          whatsappOptedIn: _whatsappOptIn,
          medicalConditions: _selectedMedicalConditions,
          prescriptionName: _prescriptionFileName,
        );

    // Trigger Registration Demo: Send Twilio WhatsApp Welcome using the filled user name
    final filledName = _nameController.text.trim().isNotEmpty
        ? _nameController.text.trim()
        : 'Patient';
    DemoTriggersService().triggerPatientRegistrationDemo(
      name: filledName,
      phone: _rawPhone,
    );

    if (!mounted) return;
    setState(() => _step4Loading = false);
    context.go('/home');
  }

  // ── UI ────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgMain,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildHeader(),
                const SizedBox(height: 24),
                _buildStepIndicator(),
                const SizedBox(height: 24),
                if (_currentStep == 1) _buildStep1(),
                if (_currentStep == 2) _buildStep2(),
                if (_currentStep == 3) _buildStep3(),
                if (_currentStep == 4) _buildStep4(),
                if (_currentStep == 5) _buildStep5(),
                if (_currentStep == 6) _buildStep6(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Header ────────────────────────────────────────────
  Widget _buildHeader() {
    return Row(
      children: [
        IconButton(
          onPressed: () {
            if (_currentStep > 1) {
              setState(() => _currentStep--);
            } else if (context.canPop()) {
              context.pop();
            } else {
              context.go('/landing');
            }
          },
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.bgSubtle,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.borderCustom),
            ),
            child: const Icon(LucideIcons.arrowLeft,
                color: AppColors.textDark, size: 18),
          ),
        ),
        Expanded(
          child: Center(
            child: Image.asset(
              'assets/images/Aayu_logo-removebg-preview.png',
              height: 44,
              fit: BoxFit.contain,
              errorBuilder: (ctx, err, stack) => Image.asset(
                'assets/Aayu_logo-removebg-preview.png',
                height: 44,
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
        const SizedBox(width: 40),
      ],
    );
  }

  Widget _buildStepIndicator() {
    final labels = ['Phone', 'OTP', 'Info', 'Health', 'Rx', 'Profile'];
    return Row(
      children: List.generate(6, (i) {
        final stepNum = i + 1;
        final isCompleted = _currentStep > stepNum;
        final isActive = _currentStep == stepNum;
        return Expanded(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? AppColors.emeraldGreen
                            : isActive
                                ? AppColors.primaryTeal
                                : AppColors.borderCustom,
                        shape: BoxShape.circle,
                        boxShadow: isActive
                            ? [
                                BoxShadow(
                                  color: AppColors.primaryTeal
                                      .withValues(alpha: 0.35),
                                  blurRadius: 6,
                                )
                              ]
                            : null,
                      ),
                      child: Center(
                        child: isCompleted
                            ? const Icon(Icons.check, color: Colors.white, size: 13)
                            : Text(
                                '$stepNum',
                                style: TextStyle(
                                  color: isActive
                                      ? Colors.white
                                      : AppColors.textLight,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        labels[i],
                        maxLines: 1,
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: isActive
                              ? FontWeight.w700
                              : FontWeight.w400,
                          color: isActive
                              ? AppColors.primaryTeal
                              : AppColors.textLight,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (i < 5)
                Expanded(
                  child: Container(
                    height: 2,
                    margin: const EdgeInsets.only(bottom: 16),
                    color: _currentStep > stepNum
                        ? AppColors.emeraldGreen
                        : AppColors.borderCustom,
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }



  // ══════════════════════════════════════════════════════
  // STEP 1 — Phone Number
  // ══════════════════════════════════════════════════════
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Welcome to Aayu',
                  style: AppTypography.displayMedium.copyWith(fontSize: 20)),
              const SizedBox(height: 6),
              Text(
                'Log in or sign up with your mobile number to manage appointments, prescriptions & health records.',
                style: AppTypography.bodyMedium,
              ),
              const SizedBox(height: 24),

              // Phone Input
              Text('Mobile Number',
                  style: AppTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textDark)),
              const SizedBox(height: 8),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(10),
                ],
                onChanged: (_) => setState(() => _step1Error = ''),
                decoration: InputDecoration(
                  prefixIcon: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 14),
                    child: Text(
                      '+91',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryTeal,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  hintText: 'Enter 10-digit number',
                  errorText: _step1Error.isNotEmpty ? _step1Error : null,
                ),
              ),
              const SizedBox(height: 16),

              // WhatsApp Opt-In
              _buildWhatsAppOptIn(),

              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _handleSendOtp,
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Get OTP Verification'),
                      SizedBox(width: 8),
                      Icon(LucideIcons.arrowRight, size: 18),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Demo Accounts
        Text('QUICK DEMO ACCOUNTS',
            style: AppTypography.labelSmall
                .copyWith(color: AppColors.textMedium)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            _buildDemoChip('Rahul Sharma', '9876543210', 'Demo Patient 1'),
            _buildDemoChip('Priya Singh', '9876543211', 'Demo Patient 2'),
            _buildDemoChip('Amit Patel', '9876543212', 'Demo Patient 3'),
          ],
        ),

        const SizedBox(height: 24),
        _buildTrustBadge(),
      ],
    );
  }

  Widget _buildWhatsAppOptIn() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: _whatsappOptIn
            ? const LinearGradient(
                colors: [Color(0xFFECFDF5), Color(0xFFD1FAE5)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : null,
        color: _whatsappOptIn ? null : AppColors.bgSubtle,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _whatsappOptIn
              ? const Color(0xFF25D366).withValues(alpha: 0.5)
              : AppColors.borderCustom,
          width: _whatsappOptIn ? 1.5 : 1,
        ),
        boxShadow: _whatsappOptIn
            ? [
                BoxShadow(
                  color: const Color(0xFF25D366).withValues(alpha: 0.12),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                )
              ]
            : null,
      ),
      child: InkWell(
        onTap: () => setState(() => _whatsappOptIn = !_whatsappOptIn),
        borderRadius: BorderRadius.circular(16),
        child: Row(
          children: [
            // WhatsApp icon circle
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _whatsappOptIn
                    ? const Color(0xFF25D366)
                    : AppColors.borderCustom,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.chat_rounded,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'WhatsApp Appointment Alerts',
                    style: AppTypography.bodySmall.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                        fontSize: 13),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Real-time OPD updates, reminders & delays on WhatsApp',
                    style: AppTypography.bodySmall
                        .copyWith(color: AppColors.textMedium, fontSize: 11),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Toggle
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 44,
              height: 26,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: _whatsappOptIn
                    ? const Color(0xFF25D366)
                    : AppColors.borderCustom,
                borderRadius: BorderRadius.circular(13),
              ),
              child: AnimatedAlign(
                duration: const Duration(milliseconds: 200),
                alignment: _whatsappOptIn
                    ? Alignment.centerRight
                    : Alignment.centerLeft,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDemoChip(String name, String phone, String subtitle) {
    final isSelected = _phoneController.text == phone;
    return InkWell(
      onTap: () => _selectDemoPatient(phone),
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryTeal : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color:
                isSelected ? AppColors.primaryTeal : AppColors.borderCustom,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primaryTeal.withValues(alpha: 0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  )
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(name,
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color:
                        isSelected ? Colors.white : AppColors.textDark)),
            Text(subtitle,
                style: TextStyle(
                    fontSize: 11,
                    color: isSelected
                        ? Colors.white70
                        : AppColors.textMedium)),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════
  // STEP 2 — OTP Verification
  // ══════════════════════════════════════════════════════
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Enter Verification Code',
                  style:
                      AppTypography.displayMedium.copyWith(fontSize: 20)),
              const SizedBox(height: 6),
              RichText(
                text: TextSpan(
                  style: AppTypography.bodyMedium,
                  children: [
                    const TextSpan(text: 'OTP sent to '),
                    TextSpan(
                      text: '+91 ${_phoneController.text}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryTeal),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Demo OTP Banner with Auto-fill button (Stays on screen)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.lightTeal,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primaryTeal.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.key, color: AppColors.primaryTeal, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: RichText(
                        text: TextSpan(
                          style: AppTypography.bodySmall.copyWith(color: AppColors.textDark),
                          children: [
                            const TextSpan(text: 'Demo OTP: '),
                            TextSpan(
                              text: _generatedOtp,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryTeal,
                                fontSize: 14,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    InkWell(
                      onTap: _autoFillOtp,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primaryTeal,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Auto-fill',
                          style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 6-box OTP Input
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (i) => _buildOtpBox(i)),
              ),

              if (_step2Error.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(_step2Error,
                    style: const TextStyle(
                        color: AppColors.statusCancelledText,
                        fontSize: 13)),
              ],

              const SizedBox(height: 20),

              // Verify Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _step2Loading ? null : _handleVerifyOtp,
                  child: _step2Loading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2.5),
                        )
                      : const Text('Verify & Continue'),
                ),
              ),

              const SizedBox(height: 16),

              // Resend + Change Number
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: () =>
                        setState(() => _currentStep = 1),
                    child: const Text('Change Number'),
                  ),
                  GestureDetector(
                    onTap: _resendOtp,
                    child: Text(
                      _resendTimer > 0
                          ? 'Resend in ${_resendTimer}s'
                          : 'Resend OTP',
                      style: TextStyle(
                        color: _resendTimer > 0
                            ? AppColors.textLight
                            : AppColors.primaryTeal,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),

              // WhatsApp notice
              if (_whatsappOptIn) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF075E54), Color(0xFF128C7E)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.chat_rounded,
                            color: Colors.white, size: 16),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'WhatsApp will open after verification to activate Aayu alerts',
                          style: AppTypography.bodySmall.copyWith(
                              fontSize: 11, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOtpBox(int index) {
    return SizedBox(
      width: 46,
      height: 54,
      child: TextField(
        controller: _otpControllers[index],
        focusNode: _otpFocusNodes[index],
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        maxLength: 1,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: AppColors.textDark,
        ),
        decoration: InputDecoration(
          counterText: '',
          contentPadding: EdgeInsets.zero,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.borderCustom),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide:
                const BorderSide(color: AppColors.primaryTeal, width: 2),
          ),
          filled: true,
          fillColor: Colors.white,
        ),
        onChanged: (v) => _handleOtpChange(index, v),
        onEditingComplete: () => _handleOtpBackspace(index),
      ),
    );
  }

  // ══════════════════════════════════════════════════════
  // STEP 3 — Patient Details
  // ══════════════════════════════════════════════════════
  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Your Health Details',
                  style:
                      AppTypography.displayMedium.copyWith(fontSize: 20)),
              const SizedBox(height: 6),
              Text(
                'Help us personalise your care experience. These details help Aayu doctors serve you better.',
                style: AppTypography.bodyMedium,
              ),
              const SizedBox(height: 24),

              // Phone Number (Verified)
              _buildFieldLabel('Phone Number (Verified)'),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.bgSubtle,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderCustom),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.phone, size: 18, color: AppColors.primaryTeal),
                    const SizedBox(width: 10),
                    Text(
                      '+91 ${_phoneController.text}',
                      style: AppTypography.bodyMedium.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textDark,
                      ),
                    ),
                    const Spacer(),
                    const Icon(LucideIcons.checkCircle2, size: 16, color: AppColors.emeraldGreen),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Full Name
              _buildFieldLabel('Full Name *'),
              const SizedBox(height: 8),
              TextField(
                controller: _nameController,
                textCapitalization: TextCapitalization.words,
                onChanged: (_) => setState(() => _step3Error = ''),
                decoration: InputDecoration(
                  hintText: 'e.g. Priya Sharma',
                  prefixIcon: const Icon(LucideIcons.user,
                      size: 18, color: AppColors.primaryTeal),
                  errorText:
                      _step3Submitted && _nameController.text.isEmpty
                          ? 'Required'
                          : null,
                ),
              ),
              const SizedBox(height: 16),

              // Age
              _buildFieldLabel('Age *'),
              const SizedBox(height: 8),
              TextField(
                controller: _ageController,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(3),
                ],
                onChanged: (_) => setState(() => _step3Error = ''),
                decoration: InputDecoration(
                  hintText: 'e.g. 29',
                  prefixIcon: const Icon(LucideIcons.cake,
                      size: 18, color: AppColors.primaryTeal),
                  errorText:
                      _step3Submitted && _ageController.text.isEmpty
                          ? 'Required'
                          : null,
                ),
              ),
              const SizedBox(height: 16),

              // Gender
              _buildFieldLabel('Gender *'),
              const SizedBox(height: 8),
              Row(
                children: [
                  _buildGenderChip('Male', LucideIcons.user),
                  const SizedBox(width: 10),
                  _buildGenderChip('Female', LucideIcons.user),
                  const SizedBox(width: 10),
                  _buildGenderChip('Other', LucideIcons.userCircle),
                ],
              ),
              if (_step3Submitted && _gender.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(top: 6),
                  child: Text('Please select gender',
                      style: TextStyle(
                          color: AppColors.statusCancelledText,
                          fontSize: 12)),
                ),
              const SizedBox(height: 16),

              // City
              _buildFieldLabel('City *'),
              const SizedBox(height: 8),
              TextField(
                controller: _cityController,
                textCapitalization: TextCapitalization.words,
                onChanged: (_) => setState(() => _step3Error = ''),
                decoration: InputDecoration(
                  hintText: 'e.g. Hyderabad, Delhi',
                  prefixIcon: const Icon(LucideIcons.mapPin,
                      size: 18, color: AppColors.primaryTeal),
                  errorText:
                      _step3Submitted && _cityController.text.trim().isEmpty
                          ? 'City is required'
                          : null,
                ),
              ),
              const SizedBox(height: 16),

              // Blood Group
              _buildFieldLabel('Blood Group *'),
              const SizedBox(height: 8),
              _buildBloodGroupPicker(),
              if (_step3Submitted && _bloodGroup.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(top: 6),
                  child: Text('Please select blood group',
                      style: TextStyle(
                          color: AppColors.statusCancelledText,
                          fontSize: 12)),
                ),
              const SizedBox(height: 16),

              // Email
              _buildFieldLabel('Email (Optional)'),
              const SizedBox(height: 8),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  hintText: 'e.g. priya@email.com',
                  prefixIcon: Icon(LucideIcons.mail,
                      size: 18, color: AppColors.primaryTeal),
                ),
              ),

              if (_step3Error.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(_step3Error,
                    style: const TextStyle(
                        color: AppColors.statusCancelledText, fontSize: 13)),
              ],

              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _handleProfileNext,
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Continue'),
                      SizedBox(width: 8),
                      Icon(LucideIcons.arrowRight, size: 18),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFieldLabel(String label) {
    return Text(label,
        style: AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600, color: AppColors.textDark));
  }

  Widget _buildGenderChip(String value, IconData icon) {
    final isSelected = _gender == value.toLowerCase();
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _gender = value.toLowerCase()),
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryTeal : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected
                  ? AppColors.primaryTeal
                  : AppColors.borderCustom,
            ),
          ),
          child: Column(
            children: [
              Icon(icon,
                  size: 18,
                  color:
                      isSelected ? Colors.white : AppColors.textMedium),
              const SizedBox(height: 4),
              Text(value,
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? Colors.white
                          : AppColors.textMedium)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBloodGroupPicker() {
    final groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: groups.map((g) {
        final isSelected = _bloodGroup == g;
        return InkWell(
          onTap: () => setState(() => _bloodGroup = g),
          borderRadius: BorderRadius.circular(10),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primaryTeal
                  : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isSelected
                    ? AppColors.primaryTeal
                    : AppColors.borderCustom,
              ),
            ),
            child: Text(g,
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isSelected
                        ? Colors.white
                        : AppColors.textDark)),
          ),
        );
      }).toList(),
    );
  }

  // ══════════════════════════════════════════════════════
  // STEP 4 — Pre-existing Medical History & Conditions
  // ══════════════════════════════════════════════════════
  Widget _buildStep4() {
    const commonConditions = [
      'Diabetes',
      'High BP / Hypertension',
      'Asthma / Respiratory',
      'Thyroid Disorder',
      'Heart Condition',
      'Kidney Disease',
      'Allergies',
      'Arthritis',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Medical History & Conditions',
                      style: AppTypography.displayMedium.copyWith(fontSize: 19)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.lightTeal,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('Optional',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primaryTeal)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Do you have any existing health conditions or medical history? Select from below or type custom ones.',
                style: AppTypography.bodyMedium,
              ),
              const SizedBox(height: 20),

              _buildFieldLabel('Common Conditions (Select Multiple)'),
              const SizedBox(height: 10),

              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ...commonConditions.map((cond) {
                    final isSelected = _selectedMedicalConditions.contains(cond);
                    return FilterChip(
                      selected: isSelected,
                      label: Text(cond),
                      selectedColor: AppColors.primaryTeal,
                      checkmarkColor: Colors.white,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : AppColors.textDark,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        fontSize: 12,
                      ),
                      backgroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: BorderSide(
                          color: isSelected ? AppColors.primaryTeal : AppColors.borderCustom,
                        ),
                      ),
                      onSelected: (selected) {
                        setState(() {
                          if (selected) {
                            _selectedMedicalConditions.add(cond);
                          } else {
                            _selectedMedicalConditions.remove(cond);
                          }
                        });
                      },
                    );
                  }),
                  FilterChip(
                    selected: _selectedMedicalConditions.isEmpty,
                    label: const Text('None / No Conditions'),
                    selectedColor: AppColors.emeraldGreen,
                    checkmarkColor: Colors.white,
                    labelStyle: TextStyle(
                      color: _selectedMedicalConditions.isEmpty ? Colors.white : AppColors.textDark,
                      fontWeight: _selectedMedicalConditions.isEmpty ? FontWeight.bold : FontWeight.w500,
                      fontSize: 12,
                    ),
                    backgroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(
                        color: _selectedMedicalConditions.isEmpty ? AppColors.emeraldGreen : AppColors.borderCustom,
                      ),
                    ),
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _selectedMedicalConditions.clear();
                        });
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 20),

              _buildFieldLabel('Other Condition / Medical Issue (Type below)'),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _customConditionController,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: const InputDecoration(
                        hintText: 'e.g. Migraine, PCOS, Eczema...',
                        prefixIcon: Icon(LucideIcons.activity, size: 18, color: AppColors.primaryTeal),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () {
                      final text = _customConditionController.text.trim();
                      if (text.isNotEmpty && !_selectedMedicalConditions.contains(text)) {
                        setState(() {
                          _selectedMedicalConditions.add(text);
                          _customConditionController.clear();
                        });
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Add'),
                  ),
                ],
              ),

              if (_selectedMedicalConditions.isNotEmpty) ...[
                const SizedBox(height: 16),
                _buildFieldLabel('Your Selected Conditions:'),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: _selectedMedicalConditions.map((cond) {
                    return Chip(
                      label: Text(cond, style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                      backgroundColor: AppColors.primaryTeal,
                      deleteIcon: const Icon(LucideIcons.x, size: 14, color: Colors.white),
                      onDeleted: () {
                        setState(() {
                          _selectedMedicalConditions.remove(cond);
                        });
                      },
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    );
                  }).toList(),
                ),
              ],

              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() => _currentStep = 5);
                    _animateStep();
                  },
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Next: Upload Prescription'),
                      SizedBox(width: 8),
                      Icon(LucideIcons.arrowRight, size: 18),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Center(
                child: TextButton(
                  onPressed: () {
                    setState(() => _currentStep = 5);
                    _animateStep();
                  },
                  child: const Text('Skip this step', style: TextStyle(color: AppColors.textMedium)),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════
  // STEP 5 — Upload Doctor Prescription
  // ══════════════════════════════════════════════════════
  Widget _buildStep5() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Previous Prescription',
                      style: AppTypography.displayMedium.copyWith(fontSize: 19)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.lightTeal,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('Optional',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primaryTeal)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Upload your previous doctor prescription or medical report. Doctors will review this before your OPD visit.',
                style: AppTypography.bodyMedium,
              ),
              const SizedBox(height: 24),

              if (_prescriptionFileName.isEmpty) ...[
                GestureDetector(
                  onTap: () {
                    setState(() {
                      _prescriptionFileName = 'Apollo_OPD_Prescription_2026.pdf';
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.primaryTeal.withValues(alpha: 0.4), width: 1.5),
                    ),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: const BoxDecoration(
                            color: AppColors.lightTeal,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(LucideIcons.uploadCloud, size: 28, color: AppColors.primaryTeal),
                        ),
                        const SizedBox(height: 12),
                        Text('Tap to Upload Prescription', style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('Supports PDF, JPG, PNG (Max 10MB)', style: AppTypography.bodySmall.copyWith(color: AppColors.textMedium, fontSize: 11)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text('Or select a sample prescription for demo:', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ActionChip(
                      avatar: const Icon(LucideIcons.fileText, size: 14, color: AppColors.primaryTeal),
                      label: const Text('Attach Demo_OPD_Rx.pdf'),
                      onPressed: () {
                        setState(() {
                          _prescriptionFileName = 'Demo_OPD_Rx_2026.pdf';
                        });
                      },
                    ),
                    ActionChip(
                      avatar: const Icon(LucideIcons.fileText, size: 14, color: AppColors.primaryTeal),
                      label: const Text('Attach Blood_Report.png'),
                      onPressed: () {
                        setState(() {
                          _prescriptionFileName = 'Blood_Test_Report_Jan2026.png';
                        });
                      },
                    ),
                  ],
                ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFA7F3D0)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.emeraldGreen,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.fileCheck, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _prescriptionFileName,
                              style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold, color: AppColors.textDark),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            const Text('Prescription Attached • 1.2 MB', style: TextStyle(fontSize: 11, color: AppColors.emeraldGreen, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.trash2, color: AppColors.statusCancelledText, size: 18),
                        onPressed: () {
                          setState(() {
                            _prescriptionFileName = '';
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() => _currentStep = 6);
                    _animateStep();
                  },
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Next: Persona Selection'),
                      SizedBox(width: 8),
                      Icon(LucideIcons.arrowRight, size: 18),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Center(
                child: TextButton(
                  onPressed: () {
                    setState(() => _currentStep = 6);
                    _animateStep();
                  },
                  child: const Text('Skip for now', style: TextStyle(color: AppColors.textMedium)),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════
  // STEP 6 — Persona / Profile Type
  // ══════════════════════════════════════════════════════
  Widget _buildStep6() {

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Your Health Profile',
                  style:
                      AppTypography.displayMedium.copyWith(fontSize: 20)),
              const SizedBox(height: 6),
              Text(
                'Aayu\'s AI uses your profile type and ABHA ID to personalise appointment scheduling and health reminders.',
                style: AppTypography.bodyMedium,
              ),
              const SizedBox(height: 24),

              // ABHA Health ID Field
              _buildFieldLabel('ABHA Health ID (Optional)'),
              const SizedBox(height: 4),
              Text(
                'Link your Ayushman Bharat Digital Health Account for seamless health records.',
                style: AppTypography.bodySmall,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _abhaController,
                decoration: const InputDecoration(
                  hintText: 'e.g. 14-8765-4321-9876',
                  prefixIcon: Icon(LucideIcons.shieldCheck,
                      size: 18, color: AppColors.primaryTeal),
                ),
              ),
              const SizedBox(height: 24),

              // Profession / Persona Selector
              _buildFieldLabel('How should we remind you? (Profession / Role) *'),
              const SizedBox(height: 4),
              Text(
                'Select your profession or role so Aayu AI sends optimal reminders.',
                style: AppTypography.bodySmall,
              ),
              const SizedBox(height: 14),

              _buildPersonaCard(
                persona: 'working_professional',
                title: 'Working Professional',
                subtitle:
                    'Busy schedule, prefer morning or evening OPD slots',
                icon: LucideIcons.briefcase,
                color: AppColors.lightTeal,
                iconColor: AppColors.primaryTeal,
              ),
              const SizedBox(height: 12),
              _buildPersonaCard(
                persona: 'senior_citizen',
                title: 'Senior / Elderly',
                subtitle:
                    'Regular health check-ups, need caretaker assistance',
                icon: LucideIcons.heartPulse,
                color: AppColors.mintGreen,
                iconColor: AppColors.emeraldGreen,
              ),
              const SizedBox(height: 12),
              _buildPersonaCard(
                persona: 'student',
                title: 'Student',
                subtitle:
                    'Flexible timing, health & wellness focused',
                icon: LucideIcons.graduationCap,
                color: AppColors.warmYellow,
                iconColor: AppColors.goldAmber,
              ),
              const SizedBox(height: 12),
              _buildPersonaCard(
                persona: 'caretaker',
                title: 'Caretaker / Guardian',
                subtitle:
                    'Booking appointments for family members',
                icon: LucideIcons.users,
                color: const Color(0xFFEDE9FE),
                iconColor: const Color(0xFF7C3AED),
              ),

              const SizedBox(height: 28),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _step4Loading ? null : _handleCompleteProfile,
                  child: _step4Loading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2.5),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.sparkles, size: 18),
                            SizedBox(width: 8),
                            Text('Complete Registration'),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPersonaCard({
    required String persona,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required Color iconColor,
  }) {
    final isSelected = _selectedPersona == persona;
    return InkWell(
      onTap: () => setState(() => _selectedPersona = persona),
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryTeal : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color:
                isSelected ? AppColors.primaryTeal : AppColors.borderCustom,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primaryTeal.withValues(alpha: 0.25),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  )
                ]
              : null,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isSelected
                    ? Colors.white.withValues(alpha: 0.2)
                    : color,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon,
                  color: isSelected ? Colors.white : iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: isSelected
                              ? Colors.white
                              : AppColors.textDark)),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: TextStyle(
                          fontSize: 12,
                          color: isSelected
                              ? Colors.white70
                              : AppColors.textMedium)),
                ],
              ),
            ),
            if (isSelected)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: AppColors.emeraldGreen,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Colors.white, size: 14),
              ),
          ],
        ),
      ),
    );
  }

  // ── Shared Widgets ────────────────────────────────────
  Widget _buildCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderCustom),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildTrustBadge() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.lightTeal,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: AppColors.primaryTeal.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.shieldCheck,
              color: AppColors.primaryTeal, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'HIPAA & ABDM Compliant Security',
                  style: AppTypography.bodyMedium.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryTeal),
                ),
                Text(
                  'Your health records & appointment data are encrypted and safe.',
                  style: AppTypography.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
