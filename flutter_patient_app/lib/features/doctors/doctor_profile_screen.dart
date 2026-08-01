import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/services/firebase_service.dart';
import '../../core/models/doctor_model.dart';
import '../../shared/widgets/doctor_avatar.dart';

class DoctorProfileScreen extends StatefulWidget {
  final String doctorId;

  const DoctorProfileScreen({super.key, required this.doctorId});

  @override
  State<DoctorProfileScreen> createState() => _DoctorProfileScreenState();
}

class _DoctorProfileScreenState extends State<DoctorProfileScreen> {
  final FirebaseService _firebaseService = FirebaseService();
  DoctorModel? _doctor;
  bool _isLoading = true;

  late String _selectedDate;
  String _selectedTime = '10:30 AM';

  final List<String> _morningSlots = ['09:00 AM', '09:30 AM', '10:30 AM', '11:15 AM'];
  final List<String> _afternoonSlots = ['02:00 PM', '03:00 PM', '04:30 PM', '05:45 PM'];

  @override
  void initState() {
    super.initState();
    _selectedDate = DateFormat('yyyy-MM-dd').format(DateTime.now().add(const Duration(days: 1)));
    _loadDoctor();
  }

  Future<void> _loadDoctor() async {
    final docs = await _firebaseService.getDoctors();
    final doc = docs.firstWhere((d) => d.id == widget.doctorId, orElse: () => docs.first);
    if (mounted) {
      setState(() {
        _doctor = doc;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          leading: Padding(
            padding: const EdgeInsets.all(8.0),
            child: InkWell(
              onTap: () => context.canPop() ? context.pop() : context.go('/doctors'),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.primaryTeal.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: AppColors.primaryTeal.withValues(alpha: 0.25)),
                ),
                child: const Icon(LucideIcons.arrowLeft,
                    color: AppColors.primaryTeal, size: 20),
              ),
            ),
          ),
        ),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primaryTeal)),
      );
    }

    final doc = _doctor!;

    return Scaffold(
      backgroundColor: AppColors.bgMain,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: InkWell(
            onTap: () => context.canPop() ? context.pop() : context.go('/doctors'),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.primaryTeal.withValues(alpha: 0.12),
                shape: BoxShape.circle,
                border: Border.all(
                    color: AppColors.primaryTeal.withValues(alpha: 0.25)),
              ),
              child: const Icon(LucideIcons.arrowLeft,
                  color: AppColors.primaryTeal, size: 20),
            ),
          ),
        ),
        title: Text(doc.name, style: AppTypography.titleLarge.copyWith(fontSize: 18)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Doctor Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.borderCustom),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      DoctorAvatar(
                        imagePath: doc.imagePath,
                        initials: doc.initials,
                        radius: 36,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(doc.name, style: AppTypography.titleLarge.copyWith(fontSize: 18)),
                            Text(doc.department, style: AppTypography.bodyMedium.copyWith(color: AppColors.primaryTeal, fontWeight: FontWeight.bold)),
                            Text(doc.qualifications, style: AppTypography.bodySmall),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildInfoCol('Experience', '${doc.experienceYears} Years'),
                      _buildInfoCol('Rating', '${doc.rating} ★'),
                      _buildInfoCol('Fee', '₹${doc.consultationFee.toInt()}'),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Bio
            Text('About Specialist', style: AppTypography.titleMedium),
            const SizedBox(height: 8),
            Text(doc.bio, style: AppTypography.bodyMedium),

            const SizedBox(height: 24),

            // Date Picker
            Text('Select Date', style: AppTypography.titleMedium),
            const SizedBox(height: 12),
            SizedBox(
              height: 70,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: 5,
                itemBuilder: (context, index) {
                  final date = DateTime.now().add(Duration(days: index + 1));
                  final dateStr = DateFormat('yyyy-MM-dd').format(date);
                  final dayName = DateFormat('EEE').format(date);
                  final dayNum = DateFormat('dd MMM').format(date);
                  final isSelected = dateStr == _selectedDate;

                  return Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: InkWell(
                      onTap: () => setState(() => _selectedDate = dateStr),
                      borderRadius: BorderRadius.circular(16),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        width: 76,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primaryTeal : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isSelected ? AppColors.primaryTeal : AppColors.borderCustom),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(dayName, style: TextStyle(color: isSelected ? Colors.white70 : AppColors.textMedium, fontSize: 12)),
                            Text(dayNum, style: TextStyle(color: isSelected ? Colors.white : AppColors.textDark, fontWeight: FontWeight.bold, fontSize: 13)),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 24),

            // Slots Grid
            Text('Available Slots', style: AppTypography.titleMedium),
            const SizedBox(height: 12),
            Text('Morning Slots', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _morningSlots.map((slot) => _buildSlotChip(slot)).toList(),
            ),
            const SizedBox(height: 16),
            Text('Afternoon Slots', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _afternoonSlots.map((slot) => _buildSlotChip(slot)).toList(),
            ),

            const SizedBox(height: 32),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () {
                  context.push(
                    '/booking/confirm',
                    extra: {
                      'doctorId': doc.id,
                      'selectedDate': _selectedDate,
                      'selectedTime': _selectedTime,
                    },
                  );
                },
                icon: const Icon(LucideIcons.arrowRight, size: 18),
                label: const Text('Confirm Slot Selection'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCol(String label, String value) {
    return Column(
      children: [
        Text(value, style: AppTypography.titleMedium.copyWith(color: AppColors.primaryTeal)),
        const SizedBox(height: 2),
        Text(label, style: AppTypography.bodySmall),
      ],
    );
  }

  Widget _buildSlotChip(String slot) {
    final isSelected = slot == _selectedTime;
    return InkWell(
      onTap: () => setState(() => _selectedTime = slot),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryTeal : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? AppColors.primaryTeal : AppColors.borderCustom),
        ),
        child: Text(
          slot,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.textDark,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
