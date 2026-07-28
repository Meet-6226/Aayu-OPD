import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../widgets/clinical_card.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _currentStep = 0;

  // Answers State
  final List<String> _selectedConditions = [];
  final TextEditingController _symptomsController = TextEditingController();
  final TextEditingController _allergiesController = TextEditingController();
  final TextEditingController _medicationsController = TextEditingController();
  String _selectedBloodGroup = 'O+';
  bool _isScanningStrips = false;
  List<String> _scannedMedsList = [];

  final List<String> _chronicConditions = [
    'Diabetes',
    'Hypertension',
    'Kidney Disease',
    'Thyroid',
    'Asthma',
    'None of these'
  ];

  @override
  void dispose() {
    _symptomsController.dispose();
    _allergiesController.dispose();
    _medicationsController.dispose();
    super.dispose();
  }

  void _nextStep() {
    setState(() => _currentStep++);
  }

  void _prevStep() {
    setState(() => _currentStep--);
  }

  // Simulate scanning medicine strips using phone camera
  Future<void> _simulateMedicineScan() async {
    setState(() => _isScanningStrips = true);
    await Future.delayed(const Duration(seconds: 2)); // Simulate AI processing
    setState(() {
      _isScanningStrips = false;
      _scannedMedsList = ['Metformin 500mg', 'Amlodipine 5mg'];
      _medicationsController.text = 'Metformin 500mg (OD), Amlodipine 5mg (OD)';
    });
  }

  void _handleSaveOnboarding() {
    final auth = Provider.of<AuthService>(context, listen: false);
    
    final medicalData = {
      'chronicConditions': _selectedConditions,
      'symptoms': _symptomsController.text.trim(),
      'allergies': _allergiesController.text.trim().isEmpty ? 'None' : _allergiesController.text.trim(),
      'bloodGroup': _selectedBloodGroup,
      'regularMedications': _medicationsController.text.trim(),
      'scannedMeds': _scannedMedsList,
    };

    auth.saveMedicalProfile(medicalData);
    Navigator.pop(context); // Close onboarding screen
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          'Medical Onboarding',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: const Color(0xFFE2E8F0), height: 1.0),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Header progress indicator
            _buildProgressIndicator(),

            // Main onboarding content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20.0),
                child: ClinicalCard(
                  child: _buildStepContent(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: Row(
        children: List.generate(4, (index) {
          final isCurrent = index == _currentStep;
          final isDone = index < _currentStep;
          return Expanded(
            child: Container(
              margin: const EdgeInsets.only(right: 6.0),
              height: 4.0,
              decoration: BoxDecoration(
                color: isCurrent || isDone ? const Color(0xFF0F766E) : const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(2.0),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildConditionsStep();
      case 1:
        return _buildSymptomsAllergiesStep();
      case 2:
        return _buildMedsScannerStep();
      case 3:
        return _buildReviewStep();
      default:
        return const SizedBox();
    }
  }

  // STEP 0: Chronic Conditions
  Widget _buildConditionsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Chronic Medical Conditions',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        const SizedBox(height: 6),
        Text(
          'Select any conditions you have been diagnosed with.',
          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8.0,
          runSpacing: 8.0,
          children: _chronicConditions.map((cond) {
            final isSelected = _selectedConditions.contains(cond);
            return FilterChip(
              label: Text(cond),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    if (cond == 'None of these') {
                      _selectedConditions.clear();
                    } else {
                      _selectedConditions.remove('None of these');
                    }
                    _selectedConditions.add(cond);
                  } else {
                    _selectedConditions.remove(cond);
                  }
                });
              },
              labelStyle: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? const Color(0xFF0F766E) : const Color(0xFF475569),
              ),
              selectedColor: const Color(0xFFF0FDFA),
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                side: BorderSide(
                  color: isSelected ? const Color(0xFFCCFBF1) : const Color(0xFFE2E8F0),
                  width: 1.0,
                ),
                borderRadius: BorderRadius.circular(6.0),
              ),
              showCheckmark: false,
            );
          }).toList(),
        ),
        const SizedBox(height: 28),
        ElevatedButton(
          onPressed: _nextStep,
          style: _buttonStyle(),
          child: Text('Next Question', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  // STEP 1: Symptoms & Allergies & Blood Group
  Widget _buildSymptomsAllergiesStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Symptoms & Allergies',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          initialValue: _selectedBloodGroup,
          items: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
              .map((bg) => DropdownMenuItem(value: bg, child: Text(bg, style: GoogleFonts.inter(fontSize: 13))))
              .toList(),
          onChanged: (val) => setState(() => _selectedBloodGroup = val ?? 'O+'),
          decoration: _inputDecoration('Blood Group'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _symptomsController,
          maxLines: 2,
          decoration: _inputDecoration('Current Symptoms (e.g., headache, body ache)'),
          style: GoogleFonts.inter(fontSize: 13),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _allergiesController,
          decoration: _inputDecoration('Known Drug Allergies (e.g., Penicillin)'),
          style: GoogleFonts.inter(fontSize: 13),
        ),
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
                onPressed: _nextStep,
                style: _buttonStyle(),
                child: Text('Next Question', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // STEP 2: Medications & Camera Strip Scanner
  Widget _buildMedsScannerStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Regular Medications',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        const SizedBox(height: 6),
        Text(
          'List any medications you take regularly or upload a scan of your medicine strip.',
          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _medicationsController,
          maxLines: 2,
          decoration: _inputDecoration('List Regular Medications'),
          style: GoogleFonts.inter(fontSize: 13),
        ),
        const SizedBox(height: 16),

        // AI Strip scanner button card
        ClinicalCard(
          backgroundColor: const Color(0xFFF8FAFC),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          child: Column(
            children: [
              Row(
                children: [
                  const Icon(Icons.document_scanner_outlined, color: Color(0xFF0F766E), size: 20),
                  const SizedBox(width: 10),
                  Text(
                    'AI MEDICINE STRIP SCANNER',
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0F766E)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Upload a photo of your current medicine strip. Our clinical OCR will automatically parse the composition and dose details.',
                style: GoogleFonts.inter(fontSize: 10.5, color: const Color(0xFF64748B), height: 1.4),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: _isScanningStrips ? null : _simulateMedicineScan,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF0F766E),
                  side: const BorderSide(color: Color(0xFF0F766E)),
                  elevation: 0,
                  minimumSize: const Size.fromHeight(40),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6.0)),
                ),
                icon: _isScanningStrips
                    ? const SizedBox(height: 14, width: 14, child: CircularProgressIndicator(color: Color(0xFF0F766E), strokeWidth: 2))
                    : const Icon(Icons.camera_alt_outlined, size: 16),
                label: Text(
                  _isScanningStrips ? 'Analyzing composition...' : 'Scan Medicine Strip',
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
              if (_scannedMedsList.isNotEmpty) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.check, color: Color(0xFF16A34A), size: 14),
                    const SizedBox(width: 4),
                    Text(
                      'Successfully parsed ${_scannedMedsList.length} medications!',
                      style: GoogleFonts.inter(fontSize: 10.5, color: const Color(0xFF16A34A), fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
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
                onPressed: _nextStep,
                style: _buttonStyle(),
                child: Text('Next Question', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // STEP 3: Review and save details
  Widget _buildReviewStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Verify Clinical Profile',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        const SizedBox(height: 6),
        Text(
          'Please review the clinical metadata that will be shared securely with your attending doctor.',
          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
        ),
        const SizedBox(height: 16),

        _buildReviewRow('Blood Group', _selectedBloodGroup),
        _buildReviewRow('Conditions', _selectedConditions.isEmpty ? 'None' : _selectedConditions.join(', ')),
        _buildReviewRow('Symptoms', _symptomsController.text.trim().isEmpty ? 'None declared' : _symptomsController.text.trim()),
        _buildReviewRow('Allergies', _allergiesController.text.trim().isEmpty ? 'None declared' : _allergiesController.text.trim()),
        _buildReviewRow('Medications', _medicationsController.text.trim().isEmpty ? 'None declared' : _medicationsController.text.trim()),

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
                onPressed: _handleSaveOnboarding,
                style: _buttonStyle(),
                child: Text('Save & Sync Profile', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildReviewRow(String title, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 0.5),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF0F172A), fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String labelText) {
    return InputDecoration(
      labelText: labelText,
      labelStyle: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B), fontWeight: FontWeight.w500),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
      enabledBorder: OutlineInputBorder(
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(6.0),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: const BorderSide(color: Color(0xFF0F766E), width: 1.5),
        borderRadius: BorderRadius.circular(6.0),
      ),
    );
  }

  ButtonStyle _buttonStyle() {
    return ElevatedButton.styleFrom(
      backgroundColor: const Color(0xFF0F766E),
      foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 14.0),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(6.0),
      ),
    );
  }

  ButtonStyle _outlineButtonStyle() {
    return OutlinedButton.styleFrom(
      foregroundColor: const Color(0xFF475569),
      side: const BorderSide(color: Color(0xFFE2E8F0)),
      padding: const EdgeInsets.symmetric(vertical: 14.0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(6.0),
      ),
    );
  }
}
