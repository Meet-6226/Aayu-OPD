// lib/features/doctors/browse_doctors_screen.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/services/firebase_service.dart';
import '../../core/models/doctor_model.dart';

class BrowseDoctorsScreen extends StatefulWidget {
  const BrowseDoctorsScreen({super.key});

  @override
  State<BrowseDoctorsScreen> createState() => _BrowseDoctorsScreenState();
}

class _BrowseDoctorsScreenState extends State<BrowseDoctorsScreen> {
  final FirebaseService _firebaseService = FirebaseService();
  List<DoctorModel> _allDoctors = [];
  List<DoctorModel> _filteredDoctors = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _selectedDepartment = 'All';
  final Set<String> _favoriteDoctors = {};

  final List<Map<String, dynamic>> _departments = [
    {'name': 'All', 'icon': LucideIcons.layoutGrid},
    {'name': 'Cardiology', 'icon': LucideIcons.heart},
    {'name': 'Pediatrics', 'icon': LucideIcons.baby},
    {'name': 'Orthopedics', 'icon': LucideIcons.activity},
    {'name': 'Neurology', 'icon': LucideIcons.brain},
    {'name': 'Dermatology', 'icon': LucideIcons.sparkles},
  ];

  @override
  void initState() {
    super.initState();
    _loadDoctors();
  }

  Future<void> _loadDoctors() async {
    final docs = await _firebaseService.getDoctors();
    if (mounted) {
      setState(() {
        _allDoctors = docs;
        _filteredDoctors = docs;
        _isLoading = false;
      });
    }
  }

  void _filterDoctors() {
    setState(() {
      _filteredDoctors = _allDoctors.where((doc) {
        final matchesQuery = doc.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            doc.department.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            doc.specializations.any((s) => s.toLowerCase().contains(_searchQuery.toLowerCase()));
        
        final matchesDept = _selectedDepartment == 'All' || doc.department == _selectedDepartment;

        return matchesQuery && matchesDept;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF8FAFC),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12, top: 8, bottom: 8),
          child: InkWell(
            onTap: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/home');
              }
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Icon(LucideIcons.arrowLeft, color: Color(0xFF0F766E), size: 18),
            ),
          ),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Text(
                  'Find ',
                  style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w800, fontSize: 18),
                ),
                Text(
                  'Aayu ',
                  style: TextStyle(color: Color(0xFF0F766E), fontWeight: FontWeight.w900, fontSize: 18),
                ),
                Text(
                  'Specialists',
                  style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w800, fontSize: 18),
                ),
              ],
            ),
            Text(
              'Expert care, near you.',
              style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(LucideIcons.slidersHorizontal, size: 14),
              label: const Text('Filter', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFE2E8F0)),
                foregroundColor: const Color(0xFF0F766E),
                backgroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF0F766E)))
          : CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ── Search Bar ─────────────────────────────────────
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: TextField(
                            onChanged: (val) {
                              _searchQuery = val;
                              _filterDoctors();
                            },
                            decoration: const InputDecoration(
                              icon: Icon(LucideIcons.search, color: Color(0xFF94A3B8), size: 20),
                              hintText: 'Search by doctor, department, or symptom...',
                              hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                              border: InputBorder.none,
                              suffixIcon: Icon(LucideIcons.mic, color: Color(0xFF334155), size: 20),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // ── Specialties Horizontal Category Chips ─────────
                        SizedBox(
                          height: 40,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: _departments.length,
                            itemBuilder: (context, index) {
                              final dept = _departments[index];
                              final isSelected = _selectedDepartment == dept['name'];
                              return GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _selectedDepartment = dept['name'] as String;
                                    _filterDoctors();
                                  });
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  margin: const EdgeInsets.only(right: 10),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isSelected ? const Color(0xFF0F766E) : Colors.white,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: isSelected ? const Color(0xFF0F766E) : const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        dept['icon'] as IconData,
                                        size: 15,
                                        color: isSelected ? Colors.white : const Color(0xFF64748B),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        dept['name'] as String,
                                        style: TextStyle(
                                          color: isSelected ? Colors.white : const Color(0xFF334155),
                                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 20),

                        // ── Section Title ──────────────────────────────────
                        const Row(
                          children: [
                            Icon(LucideIcons.shieldCheck, size: 18, color: Color(0xFF0F766E)),
                            SizedBox(width: 8),
                            Text(
                              'Verified & Experienced Specialists',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                      ],
                    ),
                  ),
                ),

                // ── Doctors Cards List ─────────────────────────────────────
                _filteredDoctors.isEmpty
                    ? const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.all(40),
                          child: Center(
                            child: Text(
                              'No specialists found.',
                              style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
                            ),
                          ),
                        ),
                      )
                    : SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final doctor = _filteredDoctors[index];
                              return _buildDoctorCard(doctor);
                            },
                            childCount: _filteredDoctors.length,
                          ),
                        ),
                      ),
                const SliverToBoxAdapter(child: SizedBox(height: 32)),
              ],
            ),
    );
  }

  // ── Doctor Card Item Widget ───────────────────────────────────────────────
  Widget _buildDoctorCard(DoctorModel doctor) {
    final isFav = _favoriteDoctors.contains(doctor.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar with verified green badge
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(35),
                    child: Image.asset(
                      doctor.imagePath,
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                      errorBuilder: (ctx, err, stack) => Container(
                        width: 70,
                        height: 70,
                        decoration: const BoxDecoration(
                          color: Color(0xFFF0FDF4),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(LucideIcons.userCheck, color: Color(0xFF0F766E), size: 32),
                      ),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 18),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doctor.name,
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${doctor.department}  •  ${doctor.qualifications}',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 16),
                        const SizedBox(width: 4),
                        Text(
                          doctor.rating.toStringAsFixed(1),
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '(${doctor.reviewCount} reviews)',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Sub-Specialty Tags Wrap
          if (doctor.specializations.isNotEmpty)
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: doctor.specializations.map((tag) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    tag,
                    style: const TextStyle(fontSize: 11, color: Color(0xFF475569), fontWeight: FontWeight.w500),
                  ),
                );
              }).toList(),
            ),
          const SizedBox(height: 14),

          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 12),

          // Bottom Fee & Book Slot Row
          Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Consultation Fee', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                  const SizedBox(height: 2),
                  Text(
                    '₹${doctor.consultationFee.toInt()}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F766E)),
                  ),
                ],
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: () => context.push('/doctor/${doctor.id}'),
                icon: const Icon(LucideIcons.calendar, size: 14),
                label: const Text('Book OPD Slot', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F766E),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () {
                  setState(() {
                    if (isFav) {
                      _favoriteDoctors.remove(doctor.id);
                    } else {
                      _favoriteDoctors.add(doctor.id);
                    }
                  });
                },
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Icon(
                    isFav ? Icons.favorite : Icons.favorite_border,
                    color: isFav ? const Color(0xFFDC2626) : const Color(0xFF64748B),
                    size: 18,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
