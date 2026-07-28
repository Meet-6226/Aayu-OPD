import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../widgets/brand_logo.dart';
import '../widgets/clinical_card.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  int _currentStep = 1; // Step 1 to 4
  bool _isLoading = false;

  // Controllers
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _ageController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _abhaController = TextEditingController();
  final TextEditingController _caregiverNameController = TextEditingController();
  final TextEditingController _caregiverPhoneController = TextEditingController();

  String _selectedGender = 'Male';
  String _selectedPersona = 'Busy Professional';
  String _mockOtp = '';
  String? _errorMessage;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _nameController.dispose();
    _ageController.dispose();
    _cityController.dispose();
    _abhaController.dispose();
    _caregiverNameController.dispose();
    _caregiverPhoneController.dispose();
    super.dispose();
  }

  void _nextStep() {
    setState(() {
      _errorMessage = null;
      _currentStep++;
    });
  }

  void _prevStep() {
    setState(() {
      _errorMessage = null;
      _currentStep--;
    });
  }

  // Step 1: Request OTP
  Future<void> _handleRequestOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.length < 10) {
      setState(() => _errorMessage = 'Please enter a valid 10-digit mobile number');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final auth = Provider.of<AuthService>(context, listen: false);
      final otp = await auth.requestOtp(phone);
      setState(() {
        _mockOtp = otp;
        _isLoading = false;
      });
      _nextStep();
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to generate code. Please try again.';
        _isLoading = false;
      });
    }
  }

  // Step 2: Verify OTP
  Future<void> _handleVerifyOtp() async {
    final code = _otpController.text.trim();
    if (code != _mockOtp && code != '123456') {
      setState(() => _errorMessage = 'Incorrect OTP code. Try again.');
      return;
    }

    _nextStep();
  }

  // Step 3: Profile Info
  void _handleSaveProfile() {
    if (_nameController.text.trim().isEmpty) {
      setState(() => _errorMessage = 'Please enter your full name');
      return;
    }
    _nextStep();
  }

  // Step 4: Finalize Registration
  Future<void> _handleFinalize() async {
    setState(() => _isLoading = true);
    final phone = _phoneController.text.trim();

    final registerData = {
      'name': _nameController.text.trim(),
      'age': _ageController.text.trim().isEmpty ? '25' : _ageController.text.trim(),
      'gender': _selectedGender,
      'city': _cityController.text.trim().isEmpty ? 'Hyderabad' : _cityController.text.trim(),
      'abhaId': _abhaController.text.trim(),
      'persona': _selectedPersona,
    };

    if (_selectedPersona == 'Elderly / Need Help') {
      registerData['caregiverName'] = _caregiverNameController.text.trim();
      registerData['caregiverPhone'] = _caregiverPhoneController.text.trim();
    }

    try {
      final auth = Provider.of<AuthService>(context, listen: false);
      await auth.verifyOtpAndLogin(phone, registerData: registerData);
      // Main routing triggers navigation update automatically via isLoggedIn notifier listener
    } catch (e) {
      setState(() {
        _errorMessage = 'Registration failed. Try again.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // App Branding Logo
                  const Center(
                    child: BrandLogo(height: 36),
                  ),
                  const SizedBox(height: 32),

                  // Step indicator card
                  _buildStepHeader(),
                  const SizedBox(height: 16),

                  // Main content wizard step
                  ClinicalCard(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (_errorMessage != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12.0),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              border: Border.all(color: const Color(0xFFFCA5A5)),
                              borderRadius: BorderRadius.circular(6.0),
                            ),
                            child: Text(
                              _errorMessage!,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: const Color(0xFF991B1B),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                        _buildStepContent(),
                      ],
                    ),
                  ),

                  // Quick fill pill for testing
                  if (_currentStep == 1) ...[
                    const SizedBox(height: 24),
                    _buildDemoShortcut(),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStepHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Step $_currentStep of 4',
          style: GoogleFonts.inter(
            fontSize: 12,
            color: const Color(0xFF64748B),
            fontWeight: FontWeight.bold,
          ),
        ),
        Row(
          children: List.generate(4, (index) {
            final active = index + 1 == _currentStep;
            final completed = index + 1 < _currentStep;
            return Container(
              margin: const EdgeInsets.only(left: 4.0),
              height: 4.0,
              width: active ? 20.0 : 8.0,
              decoration: BoxDecoration(
                color: active || completed ? const Color(0xFF0F766E) : const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(2.0),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 1:
        return _buildStep1();
      case 2:
        return _buildStep2();
      case 3:
        return _buildStep3();
      case 4:
        return _buildStep4();
      default:
        return const SizedBox();
    }
  }

  // STEP 1: Phone Entry
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Enter Mobile Number',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        const SizedBox(height: 6),
        Text(
          'We will send a 6-digit OTP verification code to verify your profile details.',
          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
        ),
        const SizedBox(height: 20),
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          maxLength: 10,
          decoration: _inputDecoration('Mobile Number (10 digits)', prefixText: '+91 '),
          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        ElevatedButton(
          onPressed: _isLoading ? null : _handleRequestOtp,
          style: _buttonStyle(),
          child: _isLoading
              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : Text('Get Verification Code', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  // STEP 2: OTP Verification
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Helper OTP hint card
        Container(
          padding: const EdgeInsets.all(12.0),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(6.0),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.sms_outlined, color: Colors.tealAccent, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('MOCK SMS GATEWAY', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.tealAccent)),
                    const SizedBox(height: 2),
                    Text(
                      'Use verification code $_mockOtp to sign in to Nidaan One.',
                      style: GoogleFonts.inter(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'Enter 6-Digit OTP',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        const SizedBox(height: 20),
        TextField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          decoration: _inputDecoration('6-Digit Code'),
          style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 8.0),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _prevStep,
                style: _outlineButtonStyle(),
                child: Text('Back', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: _handleVerifyOtp,
                style: _buttonStyle(),
                child: Text('Verify Code', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // STEP 3: Register details
  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Personal Details',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _nameController,
          decoration: _inputDecoration('Full Name'),
          style: GoogleFonts.inter(fontSize: 14),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _ageController,
                keyboardType: TextInputType.number,
                decoration: _inputDecoration('Age'),
                style: GoogleFonts.inter(fontSize: 14),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DropdownButtonFormField<String>(
                initialValue: _selectedGender,
                items: ['Male', 'Female', 'Other']
                    .map((g) => DropdownMenuItem(value: g, child: Text(g, style: GoogleFonts.inter(fontSize: 13))))
                    .toList(),
                onChanged: (val) => setState(() => _selectedGender = val ?? 'Male'),
                decoration: _inputDecoration('Gender'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _cityController,
          decoration: _inputDecoration('City'),
          style: GoogleFonts.inter(fontSize: 14),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _abhaController,
          decoration: _inputDecoration('ABHA ID (Digital Health Card)'),
          style: GoogleFonts.inter(fontSize: 14),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _prevStep,
                style: _outlineButtonStyle(),
                child: Text('Back', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: _handleSaveProfile,
                style: _buttonStyle(),
                child: Text('Continue', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // STEP 4: Alert preferences & Caregiver
  Widget _buildStep4() {
    final showCaregiver = _selectedPersona == 'Elderly / Need Help';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Notification Profile',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        const SizedBox(height: 6),
        Text(
          'Choose how frequently you would like to receive reminders and waitlist updates.',
          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          initialValue: _selectedPersona,
          items: ['Busy Professional', 'Elderly / Need Help', 'Student']
              .map((p) => DropdownMenuItem(value: p, child: Text(p, style: GoogleFonts.inter(fontSize: 13))))
              .toList(),
          onChanged: (val) => setState(() => _selectedPersona = val ?? 'Busy Professional'),
          decoration: _inputDecoration('Alert Profile'),
        ),
        if (showCaregiver) ...[
          const SizedBox(height: 16),
          Text(
            'Caregiver Information',
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF0F766E)),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _caregiverNameController,
            decoration: _inputDecoration('Relative/Caregiver Name'),
            style: GoogleFonts.inter(fontSize: 13),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _caregiverPhoneController,
            keyboardType: TextInputType.phone,
            decoration: _inputDecoration('Caregiver Phone Number'),
            style: GoogleFonts.inter(fontSize: 13),
          ),
        ],
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _prevStep,
                style: _outlineButtonStyle(),
                child: Text('Back', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleFinalize,
                style: _buttonStyle(),
                child: _isLoading
                    ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text('Complete Setup', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDemoShortcut() {
    return Column(
      children: [
        Text(
          'Quick Demo Access',
          style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 0.8),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () {
            _phoneController.text = '9876543210';
            _nameController.text = 'Priya Sharma';
            _ageController.text = '28';
            _selectedGender = 'Female';
            _cityController.text = 'Hyderabad';
            _abhaController.text = '91-8765-4321-09';
            _selectedPersona = 'Busy Professional';
            _handleRequestOtp();
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: const Color(0xFFE2E8F0)),
              borderRadius: BorderRadius.circular(20.0),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.flash_on, color: Color(0xFF0F766E), size: 14),
                const SizedBox(width: 6),
                Text(
                  'Auto-fill Demo Patient (Priya Sharma)',
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0F766E)),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String labelText, {String? prefixText}) {
    return InputDecoration(
      labelText: labelText,
      labelStyle: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.w500),
      prefixText: prefixText,
      prefixStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 14.0),
      enabledBorder: OutlineInputBorder(
        borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.0),
        borderRadius: BorderRadius.circular(8.0),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: const BorderSide(color: Color(0xFF0F766E), width: 1.5),
        borderRadius: BorderRadius.circular(8.0),
      ),
      counterText: '',
    );
  }

  ButtonStyle _buttonStyle() {
    return ElevatedButton.styleFrom(
      backgroundColor: const Color(0xFF0F766E),
      foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 14.0),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8.0),
      ),
    );
  }

  ButtonStyle _outlineButtonStyle() {
    return OutlinedButton.styleFrom(
      foregroundColor: const Color(0xFF475569),
      side: const BorderSide(color: Color(0xFFE2E8F0)),
      padding: const EdgeInsets.symmetric(vertical: 14.0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8.0),
      ),
    );
  }
}
