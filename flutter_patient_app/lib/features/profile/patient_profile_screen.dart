import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/models/patient_model.dart';
import '../auth/auth_provider.dart';

class PatientProfileScreen extends ConsumerWidget {
  const PatientProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final patient = ref.watch(authProvider).patient;

    return Scaffold(
      backgroundColor: AppColors.bgMain,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
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
        title: Text('My Patient Profile', style: AppTypography.titleLarge),
        actions: [
          IconButton(
            onPressed: () async {
              await ref.read(authProvider.notifier).signOut();
              if (context.mounted) {
                context.go('/login');
              }
            },
            icon: const Icon(LucideIcons.logOut, color: AppColors.statusCancelledText),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Profile Summary Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.borderCustom),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 32,
                    backgroundColor: AppColors.lightTeal,
                    child: Icon(LucideIcons.user, size: 32, color: AppColors.primaryTeal),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          patient?.name.isNotEmpty == true ? patient!.name : 'Priya Sharma',
                          style: AppTypography.titleLarge.copyWith(fontSize: 18),
                        ),
                        Text(
                          patient?.phone.isNotEmpty == true ? patient!.phone : '+91 98765 43210',
                          style: AppTypography.bodySmall,
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.mintGreen,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'Trust Score: ${patient?.trustScore ?? 96.5}%',
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.emeraldGreen,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ABHA Digital Health Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: AppColors.darkGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryDark.withValues(alpha: 0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(LucideIcons.shieldCheck, color: Colors.white, size: 22),
                          const SizedBox(width: 8),
                          Text(
                            'ABHA HEALTH CARD',
                            style: AppTypography.bodySmall.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.emeraldGreen,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('VERIFIED', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('ABHA Number', style: AppTypography.bodySmall.copyWith(color: Colors.white70)),
                          Text(
                            patient?.abhaId.isNotEmpty == true ? patient!.abhaId : '91-8087-0271-7890',
                            style: AppTypography.titleMedium.copyWith(color: Colors.white, letterSpacing: 1.0),
                          ),
                          const SizedBox(height: 12),
                          Text('Health Persona', style: AppTypography.bodySmall.copyWith(color: Colors.white70)),
                          Text(
                            (patient?.persona ?? 'working_professional').replaceAll('_', ' ').toUpperCase(),
                            style: AppTypography.bodyMedium.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: QrImageView(
                          data: patient?.abhaId.isNotEmpty == true ? patient!.abhaId : '91-8087-0271-7890',
                          size: 70,
                          foregroundColor: AppColors.primaryTeal,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Health & Personal Details Header with EDIT button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Health & Personal Details', style: AppTypography.titleMedium),
                TextButton.icon(
                  onPressed: () {
                    if (patient != null) {
                      _showEditProfileSheet(context, ref, patient);
                    }
                  },
                  icon: const Icon(LucideIcons.edit3, size: 16, color: AppColors.primaryTeal),
                  label: const Text('Edit Profile', style: TextStyle(color: AppColors.primaryTeal, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.borderCustom),
              ),
              child: Column(
                children: [
                  _buildProfileField('Age', patient?.age != null && patient!.age > 0 ? '${patient.age} Years' : '29 Years'),
                  const Divider(height: 20),
                  _buildProfileField('Gender', patient?.gender.isNotEmpty == true ? patient!.gender.toUpperCase() : 'MALE'),
                  const Divider(height: 20),
                  _buildProfileField('Blood Group', patient?.bloodGroup.isNotEmpty == true ? patient!.bloodGroup : 'O+'),
                  const Divider(height: 20),
                  _buildProfileField('City', patient?.city.isNotEmpty == true ? patient!.city : 'Delhi'),
                  const Divider(height: 20),
                  _buildProfileField('Total OPD Visits', '${patient?.totalVisits ?? 4} Visits'),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Pre-existing Medical History Card
            Text('Medical History & Pre-existing Conditions', style: AppTypography.titleMedium),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.borderCustom),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: AppColors.lightTeal,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(LucideIcons.activity, size: 18, color: AppColors.primaryTeal),
                      ),
                      const SizedBox(width: 10),
                      Text('Recorded Conditions', style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (patient != null && patient.medicalConditions.isNotEmpty) ...[
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: patient.medicalConditions.map((cond) {
                        return Chip(
                          avatar: const Icon(LucideIcons.checkCircle2, size: 14, color: AppColors.primaryTeal),
                          label: Text(cond, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textDark)),
                          backgroundColor: AppColors.lightTeal,
                          side: BorderSide(color: AppColors.primaryTeal.withValues(alpha: 0.3)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        );
                      }).toList(),
                    ),
                  ] else ...[
                    Text(
                      'No pre-existing medical conditions recorded.',
                      style: AppTypography.bodySmall.copyWith(color: AppColors.textLight),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Uploaded Prescription Card
            Text('Uploaded Prescription', style: AppTypography.titleMedium),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.borderCustom),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: const Icon(LucideIcons.fileText, size: 18, color: AppColors.emeraldGreen),
                      ),
                      const SizedBox(width: 10),
                      Text('Recent OPD Rx / Report', style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (patient != null && patient.prescriptionName.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFA7F3D0)),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.fileCheck, color: AppColors.emeraldGreen, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  patient.prescriptionName,
                                  style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold, color: AppColors.textDark),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const Text('Prescription Attached • Ready for Doctor Review', style: TextStyle(fontSize: 10, color: AppColors.emeraldGreen)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    Text(
                      'No prescription uploaded yet.',
                      style: AppTypography.bodySmall.copyWith(color: AppColors.textLight),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Sign Out Button
            SizedBox(
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () async {
                  await ref.read(authProvider.notifier).signOut();
                  if (context.mounted) {
                    context.go('/login');
                  }
                },
                icon: const Icon(LucideIcons.logOut, size: 18),
                label: const Text('Sign Out of Account'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.statusCancelledText,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileField(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTypography.bodySmall),
        Text(value, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold, color: AppColors.textDark)),
      ],
    );
  }

  void _showEditProfileSheet(BuildContext context, WidgetRef ref, PatientModel patient) {
    final nameCtrl = TextEditingController(text: patient.name);
    final ageCtrl = TextEditingController(text: patient.age > 0 ? patient.age.toString() : '');
    final cityCtrl = TextEditingController(text: patient.city);
    final customCondCtrl = TextEditingController();
    String gender = patient.gender;
    String bloodGroup = patient.bloodGroup;
    List<String> conditions = List<String>.from(patient.medicalConditions);
    String prescriptionName = patient.prescriptionName;

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

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.88,
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Edit Profile & Health Details', style: AppTypography.titleLarge.copyWith(fontSize: 18)),
                      IconButton(
                        icon: const Icon(LucideIcons.x, size: 20),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const Divider(),
                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 12),
                          // Full Name
                          Text('Full Name', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          TextField(
                            controller: nameCtrl,
                            decoration: const InputDecoration(hintText: 'Full Name'),
                          ),
                          const SizedBox(height: 14),

                          // Age & City Row
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Age', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 6),
                                    TextField(
                                      controller: ageCtrl,
                                      keyboardType: TextInputType.number,
                                      decoration: const InputDecoration(hintText: 'Age'),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('City', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 6),
                                    TextField(
                                      controller: cityCtrl,
                                      decoration: const InputDecoration(hintText: 'City'),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Gender
                          Text('Gender', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          Row(
                            children: ['male', 'female', 'other'].map((g) {
                              final isSel = gender.toLowerCase() == g;
                              return Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(right: 6),
                                  child: ChoiceChip(
                                    selected: isSel,
                                    label: Text(g.toUpperCase()),
                                    onSelected: (val) {
                                      if (val) setModalState(() => gender = g);
                                    },
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 14),

                          // Blood Group
                          Text('Blood Group', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            children: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'].map((bg) {
                              final isSel = bloodGroup == bg;
                              return ChoiceChip(
                                selected: isSel,
                                label: Text(bg),
                                onSelected: (val) {
                                  if (val) setModalState(() => bloodGroup = bg);
                                },
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 20),

                          // Medical History Section
                          Text('Pre-existing Medical History & Conditions', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: [
                              ...commonConditions.map((cond) {
                                final isSel = conditions.contains(cond);
                                return FilterChip(
                                  selected: isSel,
                                  label: Text(cond, style: TextStyle(fontSize: 11, color: isSel ? Colors.white : AppColors.textDark)),
                                  selectedColor: AppColors.primaryTeal,
                                  onSelected: (sel) {
                                    setModalState(() {
                                      if (sel) {
                                        conditions.add(cond);
                                      } else {
                                        conditions.remove(cond);
                                      }
                                    });
                                  },
                                );
                              }),
                            ],
                          ),
                          const SizedBox(height: 10),

                          // Custom condition input
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: customCondCtrl,
                                  decoration: const InputDecoration(hintText: 'Add custom condition...'),
                                ),
                              ),
                              const SizedBox(width: 8),
                              ElevatedButton(
                                onPressed: () {
                                  final txt = customCondCtrl.text.trim();
                                  if (txt.isNotEmpty && !conditions.contains(txt)) {
                                    setModalState(() {
                                      conditions.add(txt);
                                      customCondCtrl.clear();
                                    });
                                  }
                                },
                                child: const Text('Add'),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // Prescription Upload Section
                          Text('Upload Doctor Prescription', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          if (prescriptionName.isEmpty) ...[
                            OutlinedButton.icon(
                              onPressed: () {
                                setModalState(() {
                                  prescriptionName = 'Apollo_OPD_Prescription_2026.pdf';
                                });
                              },
                              icon: const Icon(LucideIcons.uploadCloud, size: 18),
                              label: const Text('Attach Prescription File (PDF/Image)'),
                            ),
                          ] else ...[
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFA7F3D0)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(LucideIcons.fileCheck, color: AppColors.emeraldGreen, size: 18),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(prescriptionName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                  ),
                                  IconButton(
                                    icon: const Icon(LucideIcons.trash2, color: Colors.red, size: 16),
                                    onPressed: () {
                                      setModalState(() {
                                        prescriptionName = '';
                                      });
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),

                  // Save Changes Button
                  SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () async {
                        final updated = patient.copyWith(
                          name: nameCtrl.text.trim(),
                          age: int.tryParse(ageCtrl.text.trim()) ?? patient.age,
                          gender: gender,
                          city: cityCtrl.text.trim(),
                          bloodGroup: bloodGroup,
                          medicalConditions: conditions,
                          prescriptionName: prescriptionName,
                        );

                        await ref.read(authProvider.notifier).updateProfile(updated);

                        if (context.mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Profile & Medical Details Updated Successfully!'),
                              backgroundColor: AppColors.primaryTeal,
                            ),
                          );
                        }
                      },
                      child: const Text('Save Profile Changes'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
