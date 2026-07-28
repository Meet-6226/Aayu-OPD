import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../widgets/clinical_card.dart';

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key});

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  String _activeTab = 'Rx'; // 'Rx' for Prescriptions or 'Lab' for Lab Reports

  final List<Map<String, dynamic>> _mockPrescriptions = [
    {
      'id': 'rx_01',
      'doctorName': 'Dr. Rajesh Mehta',
      'department': 'General Medicine',
      'date': '12 Jun 2026',
      'diagnoses': 'Mild Seasonal Viral Fever',
      'meds': ['Paracetamol 650mg (TDS - 3 days)', 'Vitamin C 500mg (OD - 10 days)'],
    },
    {
      'id': 'rx_02',
      'doctorName': 'Dr. Priya Iyer',
      'department': 'Cardiology',
      'date': '28 May 2026',
      'diagnoses': 'Routine Cardiac Checkup',
      'meds': ['Telmisartan 40mg (OD - 30 days)'],
    }
  ];

  final List<Map<String, dynamic>> _mockLabReports = [
    {
      'id': 'report_01',
      'title': 'Complete Blood Count (CBC)',
      'lab': 'Nidaan Diagnostic Labs',
      'date': '15 Jun 2026',
      'status': 'normal',
      'biomarkers': 'Hemoglobin: 14.2 g/dL (Normal), WBC: 6,800 /cumm'
    },
    {
      'id': 'report_02',
      'title': 'Lipid Profile Panel',
      'lab': 'Nidaan Diagnostic Labs',
      'date': '10 May 2026',
      'status': 'attention',
      'biomarkers': 'Total Cholesterol: 220 mg/dL (Borderline High)'
    }
  ];

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final user = auth.currentUser;
    final abhaId = user?['abhaId']?.isNotEmpty == true ? user!['abhaId'] : '91-XXXX-XXXX-XXXX';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          'Health Locker',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: const Color(0xFFE2E8F0), height: 1.0),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ABHA Card
            _buildAbhaIdCard(abhaId, user?['name'] ?? 'Priya Sharma'),
            const SizedBox(height: 20),

            // Segmented tab switchers (Rx vs Lab Reports)
            _buildTabSwitcher(),
            const SizedBox(height: 16),

            // Records List
            _activeTab == 'Rx' ? _buildPrescriptionsList() : _buildLabReportsList(),
          ],
        ),
      ),
    );
  }

  Widget _buildAbhaIdCard(String id, String name) {
    return Container(
      padding: const EdgeInsets.all(20.0),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF062421), Color(0xFF0F3C38)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12.0),
        border: Border.all(color: const Color(0xFF0D9488).withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_outlined, color: Colors.tealAccent, size: 20),
              const SizedBox(width: 8),
              Text(
                'ABDM DIGITAL HEALTH LOCKER',
                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.tealAccent, letterSpacing: 0.8),
              ),
              const Spacer(),
              const Icon(Icons.verified_user, color: Color(0xFF10B981), size: 16),
            ],
          ),
          const SizedBox(height: 28),
          Text(
            id,
            style: GoogleFonts.sourceCodePro(
              fontSize: 18, 
              fontWeight: FontWeight.bold, 
              color: Colors.white,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            name.toUpperCase(),
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white.withValues(alpha: 0.8)),
          ),
        ],
      ),
    );
  }

  Widget _buildTabSwitcher() {
    return Container(
      padding: const EdgeInsets.all(4.0),
      decoration: BoxDecoration(
        color: const Color(0xFFFAFBFB),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(8.0),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildTabButton('Rx', 'Prescriptions'),
          ),
          Expanded(
            child: _buildTabButton('Lab', 'Lab Reports'),
          ),
        ],
      ),
    );
  }

  Widget _buildTabButton(String id, String label) {
    final isActive = _activeTab == id;
    return GestureDetector(
      onTap: () => setState(() => _activeTab = id),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10.0),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isActive ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(6.0),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 4.0,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
          border: isActive ? Border.all(color: const Color(0xFFE2E8F0)) : null,
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
            color: isActive ? const Color(0xFF0F172A) : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildPrescriptionsList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _mockPrescriptions.length,
      itemBuilder: (context, i) {
        final rx = _mockPrescriptions[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: ClinicalCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      rx['doctorName'],
                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                    ),
                    Text(
                      rx['date'],
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
                Text(
                  rx['department'],
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0F766E)),
                ),
                const SizedBox(height: 10),
                Text(
                  'Diagnosis: ${rx['diagnoses']}',
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF475569)),
                ),
                const SizedBox(height: 8),
                Text(
                  'Medicines Dispelled:',
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 0.5),
                ),
                const SizedBox(height: 4),
                ...List.generate(
                  (rx['meds'] as List).length,
                  (j) => Padding(
                    padding: const EdgeInsets.only(bottom: 2.0),
                    child: Text(
                      '• ${(rx['meds'] as List)[j]}',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF475569)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLabReportsList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _mockLabReports.length,
      itemBuilder: (context, i) {
        final rep = _mockLabReports[i];
        final isNormal = rep['status'] == 'normal';
        return Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: ClinicalCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      rep['title'],
                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: isNormal ? const Color(0xFFE8FAEE) : const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        isNormal ? 'NORMAL' : 'ATTENTION',
                        style: GoogleFonts.inter(
                          fontSize: 9, 
                          fontWeight: FontWeight.bold, 
                          color: isNormal ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                        ),
                      ),
                    ),
                  ],
                ),
                Text(
                  rep['lab'],
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0D9488)),
                ),
                const SizedBox(height: 10),
                Text(
                  rep['biomarkers'],
                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF475569)),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Text(
                      'Tested on ${rep['date']}',
                      style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500),
                    ),
                    const Spacer(),
                    Text(
                      'Download PDF',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0F766E)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
