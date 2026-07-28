import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/clinical_card.dart';
import 'booking_screen.dart';

class DoctorsScreen extends StatefulWidget {
  const DoctorsScreen({super.key});

  @override
  State<DoctorsScreen> createState() => _DoctorsScreenState();
}

class _DoctorsScreenState extends State<DoctorsScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();

  List<Map<String, dynamic>> _allDoctors = [];
  List<Map<String, dynamic>> _filteredDoctors = [];
  bool _isLoading = false;
  String _selectedDept = 'All';

  final List<String> _departments = [
    'All',
    'General Medicine',
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Dermatology'
  ];

  @override
  void initState() {
    super.initState();
    _fetchDoctors();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchDoctors() async {
    setState(() => _isLoading = true);
    try {
      final docs = await _apiService.getDocs('doctors');
      setState(() {
        _allDoctors = docs;
        _filterDoctors();
        _isLoading = false;
      });
    } catch (e) {
      print('❌ [DoctorsScreen] Fetch doctors error: $e');
      setState(() => _isLoading = false);
    }
  }

  void _filterDoctors() {
    final query = _searchController.text.toLowerCase().trim();
    setState(() {
      _filteredDoctors = _allDoctors.where((doc) {
        final nameMatches = (doc['name'] ?? '').toString().toLowerCase().contains(query);
        final qualMatches = (doc['qualifications'] ?? '').toString().toLowerCase().contains(query);
        final deptMatches = _selectedDept == 'All' || doc['department'] == _selectedDept;
        return (nameMatches || qualMatches) && deptMatches;
      }).toList();
    });
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
          'Find Specialists',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: const Color(0xFFE2E8F0), height: 1.0),
        ),
      ),
      body: Column(
        children: [
          // Search & Filter header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                // Search bar
                TextField(
                  controller: _searchController,
                  onChanged: (_) => _filterDoctors(),
                  decoration: InputDecoration(
                    hintText: 'Search by doctor name or qualification...',
                    hintStyle: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                    prefixIcon: const Icon(Icons.search_outlined, color: Color(0xFF64748B), size: 20),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14.0),
                    enabledBorder: OutlineInputBorder(
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      borderRadius: BorderRadius.circular(8.0),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: const BorderSide(color: Color(0xFF0F766E), width: 1.5),
                      borderRadius: BorderRadius.circular(8.0),
                    ),
                  ),
                  style: GoogleFonts.inter(fontSize: 13),
                ),
                const SizedBox(height: 12),

                // Department horizontal list tabs
                SizedBox(
                  height: 32,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _departments.length,
                    itemBuilder: (context, i) {
                      final dept = _departments[i];
                      final isSelected = _selectedDept == dept;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6.0),
                        child: ChoiceChip(
                          label: Text(dept),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() {
                                _selectedDept = dept;
                                _filterDoctors();
                              });
                            }
                          },
                          labelStyle: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.medium,
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
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // Doctor Listings Area
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF0F766E)))
                : _filteredDoctors.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.all(16.0),
                        itemCount: _filteredDoctors.length,
                        itemBuilder: (context, i) {
                          final doc = _filteredDoctors[i];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12.0),
                            child: _buildDoctorCard(doc),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.person_search_outlined, color: Color(0xFF94A3B8), size: 36),
          const SizedBox(height: 12),
          Text(
            'No specialists found',
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
          ),
          const SizedBox(height: 2),
          Text(
            'Try adjusting your search query or filters.',
            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  Widget _buildDoctorCard(Map<String, dynamic> doc) {
    final name = doc['name'] ?? 'Attending Consultant';
    final dept = doc['department'] ?? 'General OPD';
    final qual = doc['qualifications'] ?? 'MBBS';
    final rating = doc['rating']?.toString() ?? '4.8';
    final exp = doc['experienceYears']?.toString() ?? '10';
    final fee = doc['consultationFee']?.toString() ?? '500';
    final offersOnline = doc['offersOnlineConsultation'] == true;

    // Doctor initials fallback
    final initials = name.split(' ').map((e) => e[0]).take(2).join('').toUpperCase();

    return ClinicalCard(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => BookingScreen(doctor: doc),
          ),
        );
      },
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Initials Avatar
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDFA),
              border: Border.all(color: const Color(0xFFCCFBF1)),
              borderRadius: BorderRadius.circular(6.0),
            ),
            alignment: Alignment.center,
            child: Text(
              initials,
              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F766E)),
            ),
          ),
          const SizedBox(width: 14),

          // Doctor details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            dept,
                            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0F766E)),
                          ),
                        ],
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Color(0xFFF59E0B), size: 14),
                        const SizedBox(width: 2),
                        Text(
                          rating,
                          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  qual,
                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                ),
                const SizedBox(height: 10),
                const Divider(color: Color(0xFFF1F5F9), height: 1),
                const SizedBox(height: 10),

                // Specs metadata footer
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '$exp years experience',
                      style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF94A3B8), fontWeight: FontWeight.medium),
                    ),
                    Row(
                      children: [
                        if (offersOnline) ...[
                          const Icon(Icons.videocam_outlined, color: Color(0xFF64748B), size: 14),
                          const SizedBox(width: 4),
                        ],
                        Text(
                          '₹$fee',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.black, color: const Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
