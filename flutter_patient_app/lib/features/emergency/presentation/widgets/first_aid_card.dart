// lib/features/emergency/presentation/widgets/first_aid_card.dart

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../data/models/emergency_report_model.dart';

class FirstAidStep {
  final IconData icon;
  final String text;
  const FirstAidStep({required this.icon, required this.text});
}

class DosDonts {
  final List<String> dos;
  final List<String> donts;
  const DosDonts({required this.dos, required this.donts});
}

// ── First Aid Data per emergency type ─────────────────────────────────────────
final Map<EmergencyType, List<FirstAidStep>> kFirstAidByType = {
  EmergencyType.roadAccident: [
    FirstAidStep(icon: LucideIcons.alertTriangle, text: 'Ensure your own safety first. Stay away from traffic and oncoming vehicles.'),
    FirstAidStep(icon: LucideIcons.phone, text: 'Stay on the line if emergency dispatch calls back for more information.'),
    FirstAidStep(icon: LucideIcons.hand, text: 'Apply firm pressure to visible bleeding wounds using a clean cloth or clothing.'),
    FirstAidStep(icon: LucideIcons.accessibility, text: 'Do NOT move the victim unless there is immediate danger (fire, flood, gas leak).'),
    FirstAidStep(icon: LucideIcons.wind, text: 'Check if the victim is breathing. If not breathing and you are trained — begin CPR.'),
    FirstAidStep(icon: LucideIcons.flame, text: 'Turn off vehicle ignition if safely accessible to reduce fire risk.'),
    FirstAidStep(icon: LucideIcons.thermometer, text: 'Keep the victim warm using a jacket or blanket if available.'),
  ],
  EmergencyType.fire: [
    FirstAidStep(icon: LucideIcons.alertTriangle, text: 'Alert everyone nearby immediately and move them away from the fire.'),
    FirstAidStep(icon: LucideIcons.doorOpen, text: 'Do NOT re-enter a burning building under any circumstances.'),
    FirstAidStep(icon: LucideIcons.wind, text: 'Keep low if in a smoke-filled area — smoke rises, clean air is closer to the floor.'),
    FirstAidStep(icon: LucideIcons.droplets, text: 'Cool minor burns with cool (NOT cold or iced) running water for 10+ minutes.'),
    FirstAidStep(icon: LucideIcons.ban, text: 'Do NOT use a blanket or clothing to smother flames on a person — roll them on the ground.'),
    FirstAidStep(icon: LucideIcons.phone, text: 'Stay at a safe distance and direct the ambulance crew to the victim\'s location.'),
  ],
  EmergencyType.medicalEmergency: [
    FirstAidStep(icon: LucideIcons.heartPulse, text: 'Check if the victim is conscious — call their name and tap shoulders gently.'),
    FirstAidStep(icon: LucideIcons.wind, text: 'Check for breathing. If absent and you are trained — begin CPR immediately.'),
    FirstAidStep(icon: LucideIcons.accessibility, text: 'Place the victim in recovery position (on their side) if unconscious but breathing.'),
    FirstAidStep(icon: LucideIcons.ban, text: 'Do NOT give food, water, or any medication to an unconscious person.'),
    FirstAidStep(icon: LucideIcons.hand, text: 'Loosen any tight clothing around the neck or chest to aid breathing.'),
    FirstAidStep(icon: LucideIcons.calendar, text: 'Note the time symptoms began — this is critical information for doctors.'),
  ],
  EmergencyType.fallInjury: [
    FirstAidStep(icon: LucideIcons.alertTriangle, text: 'Do NOT move the victim if they fell from height — assume spinal injury until proven otherwise.'),
    FirstAidStep(icon: LucideIcons.hand, text: 'If moving is necessary (imminent danger), keep the head, neck, and spine aligned as one unit.'),
    FirstAidStep(icon: LucideIcons.heartPulse, text: 'Check pulse and breathing. Call out to the victim to assess consciousness.'),
    FirstAidStep(icon: LucideIcons.thermometer, text: 'Cover the victim to prevent shock — keep them warm and calm.'),
    FirstAidStep(icon: LucideIcons.eye, text: 'Look for signs of fractures: abnormal limb angles, swelling, or deformity.'),
    FirstAidStep(icon: LucideIcons.activity, text: 'For limb fractures, immobilise the limb using a rolled cloth or rigid object.'),
  ],
  EmergencyType.other: [
    FirstAidStep(icon: LucideIcons.shieldAlert, text: 'Ensure the area around the victim is safe before approaching.'),
    FirstAidStep(icon: LucideIcons.heartPulse, text: 'Check for breathing and consciousness.'),
    FirstAidStep(icon: LucideIcons.hand, text: 'Control any visible bleeding by applying pressure with a clean cloth.'),
    FirstAidStep(icon: LucideIcons.thermometer, text: 'Keep the victim comfortable and warm until help arrives.'),
    FirstAidStep(icon: LucideIcons.phone, text: 'Reassure the victim that help is on the way.'),
  ],
};

// ── Dos & Don'ts Data per emergency type ─────────────────────────────────────
const Map<EmergencyType, DosDonts> kDosDontsByType = {
  EmergencyType.roadAccident: DosDonts(
    dos: [
      'Keep the victim calm and reassure them help is on the way',
      'Stay with the victim until the ambulance arrives',
      'Keep bystanders at a safe distance from the vehicle',
      'Note the victim\'s level of consciousness and breathing',
      'Turn on your hazard lights to warn other drivers',
    ],
    donts: [
      'DO NOT move someone with a suspected neck or spinal injury',
      'DO NOT remove a helmet unless the victim is not breathing',
      'DO NOT give food, water, or any medication to the victim',
      'DO NOT leave the victim alone until ambulance arrives',
      'DO NOT attempt to pull someone from a crushed vehicle',
      'DO NOT apply tourniquet unless you are trained to do so',
    ],
  ),
  EmergencyType.fire: DosDonts(
    dos: [
      'Alert all people in the area and help evacuate if safe',
      'Direct ambulance and fire crew to the exact location',
      'Keep a safe distance from the fire at all times',
      'Account for all people — tell crews if someone is missing',
    ],
    donts: [
      'DO NOT re-enter a burning building',
      'DO NOT use a lift/elevator during a fire emergency',
      'DO NOT use water on electrical or chemical fires',
      'DO NOT delay — fire spreads within minutes',
      'DO NOT let anyone stay in the building to collect belongings',
    ],
  ),
  EmergencyType.medicalEmergency: DosDonts(
    dos: [
      'Stay calm and keep the victim calm',
      'Loosen tight clothing around neck and chest',
      'Place in recovery position if unconscious but breathing',
      'Record the time when symptoms started',
      'Be ready to tell the doctor their known medical history',
    ],
    donts: [
      'DO NOT give anything by mouth to an unconscious person',
      'DO NOT leave the person alone',
      'DO NOT give aspirin without knowing if victim has drug allergies',
      'DO NOT shake or slap someone who is unconscious',
      'DO NOT assume the person is sleeping if unresponsive',
    ],
  ),
  EmergencyType.fallInjury: DosDonts(
    dos: [
      'Keep the victim still — especially head, neck, spine',
      'Cover the victim to keep them warm and prevent shock',
      'Talk to the victim to keep them calm and conscious',
      'Immobilise suspected fractures with cloth or a rigid object',
    ],
    donts: [
      'DO NOT move someone who fell from height without checking for spinal injury',
      'DO NOT attempt to straighten a broken limb',
      'DO NOT give anything to eat or drink',
      'DO NOT remove embedded objects from wounds',
      'DO NOT leave the victim unattended',
    ],
  ),
  EmergencyType.other: DosDonts(
    dos: [
      'Keep yourself and bystanders safe',
      'Reassure the victim that help is coming',
      'Stay on the phone with emergency dispatch',
      'Keep the area clear for ambulance access',
    ],
    donts: [
      'DO NOT move the victim unnecessarily',
      'DO NOT give food, water, or medicines',
      'DO NOT leave the victim alone',
      'DO NOT crowd around the victim — give space',
    ],
  ),
};

// ── First Aid Card Widget ─────────────────────────────────────────────────────

class FirstAidCard extends StatefulWidget {
  final EmergencyType? emergencyType;
  const FirstAidCard({super.key, this.emergencyType});

  @override
  State<FirstAidCard> createState() => _FirstAidCardState();
}

class _FirstAidCardState extends State<FirstAidCard> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final type = widget.emergencyType ?? EmergencyType.other;
    final steps = kFirstAidByType[type] ?? kFirstAidByType[EmergencyType.other]!;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFA7F3D0)),
        boxShadow: [
          BoxShadow(
            color: AppColors.emeraldGreen.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Color(0xFFECFDF5),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(LucideIcons.heartPulse, size: 20, color: AppColors.emeraldGreen),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '🩺 First Aid While You Wait',
                          style: AppTypography.titleMedium.copyWith(fontSize: 15),
                        ),
                        Text(
                          'Ambulance is on the way — do this now',
                          style: AppTypography.bodySmall.copyWith(color: AppColors.emeraldGreen),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    _expanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                    size: 18,
                    color: AppColors.textLight,
                  ),
                ],
              ),
            ),
          ),

          if (_expanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: steps.asMap().entries.map((entry) {
                  final i = entry.key;
                  final step = entry.value;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: const BoxDecoration(
                            color: Color(0xFFECFDF5),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '${i + 1}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: AppColors.emeraldGreen,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            step.text,
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.textDark,
                              fontSize: 12.5,
                              height: 1.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
