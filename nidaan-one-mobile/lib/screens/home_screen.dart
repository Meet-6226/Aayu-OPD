import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../widgets/brand_logo.dart';
import '../widgets/clinical_card.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onNavigateToDoctors;
  final VoidCallback onNavigateToRecords;
  final VoidCallback onTriggerOnboarding;

  const HomeScreen({
    super.key,
    required this.onNavigateToDoctors,
    required this.onNavigateToRecords,
    required this.onTriggerOnboarding,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();
  List<Map<String, dynamic>> _upcomingAppointments = [];
  bool _isLoadingAppts = false;

  @override
  void initState() {
    super.initState();
    _fetchUpcomingAppointments();
  }

  Future<void> _fetchUpcomingAppointments() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    if (!auth.isLoggedIn) return;

    setState(() => _isLoadingAppts = true);
    final phone = auth.currentUser?['phone'] ?? '';

    try {
      // Query appointments where patientPhone equals user's phone and status is upcoming
      final appts = await _apiService.getDocs(
        'appointments',
        clauses: [
          {'field': 'patientPhone', 'op': '==', 'value': phone},
          {'field': 'status', 'op': 'in', 'value': ['confirmed', 'checked-in']}
        ],
      );
      setState(() {
        _upcomingAppointments = appts;
        _isLoadingAppts = false;
      });
    } catch (e) {
      print('❌ [HomeScreen] Fetch appointments error: $e');
      setState(() => _isLoadingAppts = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final user = auth.currentUser;
    final name = user?['name'] ?? 'Guest';
    final persona = user?['persona'] ?? 'Busy Professional';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const BrandLogo(height: 28),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_outlined, color: Color(0xFF64748B), size: 20),
            onPressed: () => auth.logout(),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: const Color(0xFFE2E8F0), height: 1.0),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchUpcomingAppointments,
        color: const Color(0xFF0F766E),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Welcome greetings panel
              _buildGreetingsCard(name, persona, auth.isOnboardingDone),
              const SizedBox(height: 16),

              // ABDM Alert Banner (if onboarding not done)
              if (!auth.isOnboardingDone) ...[
                _buildAbdmAlertCard(),
                const SizedBox(height: 16),
              ],

              // Queue Status Section
              Text(
                'Live Consultation Queue',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF64748B),
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 10),
              _isLoadingAppts
                  ? const Center(child: Padding(padding: EdgeInsets.all(20.0), child: CircularProgressIndicator(color: Color(0xFF0F766E))))
                  : _buildQueueCard(),
              const SizedBox(height: 24),

              // Quick Actions grid
              Text(
                'Care Services & Locker',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF64748B),
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 10),
              _buildServicesGrid(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGreetingsCard(String name, String persona, bool isOnboarded) {
    return ClinicalCard(
      backgroundColor: const Color(0xFF0F172A),
      border: Border.all(color: const Color(0xFF1E293B)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.notifications_active_outlined, color: Colors.tealAccent, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      persona.toUpperCase(),
                      style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.tealAccent, letterSpacing: 0.5),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (isOnboarded)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF064E3B),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    'ABDM SYNCED',
                    style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.bold, color: const Color(0xFF10B981)),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Welcome back,',
            style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 2),
          Text(
            name,
            style: GoogleFonts.inter(fontSize: 24, color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: -0.5),
          ),
        ],
      ),
    );
  }

  Widget _buildAbdmAlertCard() {
    return ClinicalCard(
      backgroundColor: const Color(0xFFF0FDFA),
      border: Border.all(color: const Color(0xFFCCFBF1)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.medical_services_outlined, color: Color(0xFF0F766E), size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Link ABHA & Pre-Onboard',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                ),
                const SizedBox(height: 4),
                Text(
                  'Pre-calibrate symptoms, allergies, and scan medicine strips to help your doctor save 15 minutes.',
                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF475569), height: 1.4),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: widget.onTriggerOnboarding,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F766E),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    elevation: 0,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6.0)),
                  ),
                  child: Text('Start Onboarding', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQueueCard() {
    if (_upcomingAppointments.isEmpty) {
      return ClinicalCard(
        backgroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 32.0, horizontal: 16.0),
        child: Column(
          children: [
            const Icon(Icons.calendar_today_outlined, color: Color(0xFF94A3B8), size: 28),
            const SizedBox(height: 12),
            Text(
              'No active consultations today',
              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
            ),
            const SizedBox(height: 4),
            Text(
              'Search specialists and book a physical or video slot.',
              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: widget.onNavigateToDoctors,
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF0F766E),
                side: const BorderSide(color: Color(0xFF0F766E)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6.0)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              ),
              child: Text('Book Consultation', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
    }

    final nextAppt = _upcomingAppointments.first;
    final doctorName = nextAppt['doctorName'] ?? 'Attending Consultant';
    final dept = nextAppt['department'] ?? 'OPD General';
    final timeStr = nextAppt['time'] ?? '10:00 AM';
    final isOnline = nextAppt['consultationMode'] == 'online';
    final status = nextAppt['status'] ?? 'confirmed';

    // Simulated queue position calculations
    final queueIndex = status == 'checked-in' ? 2 : 1; // 1 = Confirmed, 2 = Checked In, 3 = With Doctor
    final waitMin = status == 'checked-in' ? '12 mins' : '28 mins';

    return ClinicalCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    doctorName,
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    dept,
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0F766E)),
                  ),
                ],
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isOnline ? const Color(0xFFEEF2FF) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isOnline ? 'VIDEO CONSULT' : 'IN-CLINIC VISIT',
                  style: GoogleFonts.inter(
                    fontSize: 9, 
                    fontWeight: FontWeight.w900, 
                    color: isOnline ? const Color(0xFF4F46E5) : const Color(0xFF475569),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: Color(0xFFF1F5F9), height: 1),
          const SizedBox(height: 16),

          // Live queue info
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'EST. WAIT TIME',
                    style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    waitMin,
                    style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A)),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'SCHEDULED TIME',
                    style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    timeStr,
                    style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A)),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Queue progress indicators
          _buildQueueProgressSteps(queueIndex),
        ],
      ),
    );
  }

  Widget _buildQueueProgressSteps(int activeIndex) {
    final steps = ['Booked', 'Lobby Check-in', 'Consulting'];
    return Row(
      children: List.generate(steps.length, (i) {
        final isCompleted = i + 1 < activeIndex;
        final isActive = i + 1 == activeIndex;
        return Expanded(
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 3,
                      color: i == 0 ? Colors.transparent : (isCompleted || isActive ? const Color(0xFF0F766E) : const Color(0xFFE2E8F0)),
                    ),
                  ),
                  Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? const Color(0xFF0F766E)
                          : (isActive ? const Color(0xFF0F766E) : Colors.white),
                      border: Border.all(
                        color: isCompleted || isActive ? const Color(0xFF0F766E) : const Color(0xFFE2E8F0),
                        width: isActive ? 4 : 2,
                      ),
                      shape: BoxShape.circle,
                    ),
                  ),
                  Expanded(
                    child: Container(
                      height: 3,
                      color: i == steps.length - 1 ? Colors.transparent : (isCompleted ? const Color(0xFF0F766E) : const Color(0xFFE2E8F0)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                steps[i],
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                  color: isActive || isCompleted ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildServicesGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _buildServiceTile(
          icon: Icons.search_outlined,
          title: 'Search Specialists',
          subtitle: 'Book OPD slots',
          color: const Color(0xFF0F766E),
          onTap: widget.onNavigateToDoctors,
        ),
        _buildServiceTile(
          icon: Icons.folder_shared_outlined,
          title: 'ABDM Locker',
          subtitle: 'View prescriptions',
          color: const Color(0xFF0D9488),
          onTap: widget.onNavigateToRecords,
        ),
      ],
    );
  }

  Widget _buildServiceTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ClinicalCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF64748B)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
