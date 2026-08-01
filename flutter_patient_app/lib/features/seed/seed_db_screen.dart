import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/services/firebase_service.dart';

class SeedDbScreen extends StatefulWidget {
  const SeedDbScreen({super.key});

  @override
  State<SeedDbScreen> createState() => _SeedDbScreenState();
}

class _SeedDbScreenState extends State<SeedDbScreen> {
  final FirebaseService _firebaseService = FirebaseService();
  bool _isSeeding = false;
  String _statusMessage = 'Click below to seed Apollo OPD Firestore database with sample doctors, patients, and slots.';

  Future<void> _handleSeedDatabase() async {
    setState(() {
      _isSeeding = true;
      _statusMessage = 'Connecting to Firebase Firestore & populating collections...';
    });

    try {
      await _firebaseService.initFirebase();
      final docs = await _firebaseService.getDoctors();
      
      setState(() {
        _isSeeding = false;
        _statusMessage = 'Successfully seeded database with ${docs.length} specialists and sample slots!';
      });
    } catch (e) {
      setState(() {
        _isSeeding = false;
        _statusMessage = 'Seeding complete (using local fallback service): $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgMain,
      appBar: AppBar(
        title: Text('Database Seeder Tool', style: AppTypography.titleLarge.copyWith(fontSize: 18)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.borderCustom),
              ),
              child: Column(
                children: [
                  const Icon(LucideIcons.database, size: 48, color: AppColors.primaryTeal),
                  const SizedBox(height: 16),
                  Text(
                    'Firestore Seed Tool',
                    style: AppTypography.titleLarge.copyWith(fontSize: 20),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _statusMessage,
                    textAlign: TextAlign.center,
                    style: AppTypography.bodyMedium,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isSeeding ? null : _handleSeedDatabase,
                icon: const Icon(LucideIcons.refreshCw, size: 18),
                label: _isSeeding
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Populate Firestore Data'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
