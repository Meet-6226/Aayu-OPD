import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../widgets/clinical_card.dart';

class BookingScreen extends StatefulWidget {
  final Map<String, dynamic> doctor;

  const BookingScreen({super.key, required this.doctor});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final ApiService _apiService = ApiService();
  final DateFormat _dayFormat = DateFormat('EEE');
  final DateFormat _dateNumberFormat = DateFormat('d');
  final DateFormat _monthFormat = DateFormat('MMM');

  late List<DateTime> _datesList;
  late DateTime _selectedDate;
  String _selectedSlot = '';
  String _consultationMode = 'in_person'; // 'in_person' or 'online'
  bool _isBooking = false;

  final List<String> _slots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  @override
  void initState() {
    super.initState();
    // Compute next 7 days starting from today
    _datesList = List.generate(7, (i) => DateTime.now().add(Duration(days: i)));
    _selectedDate = _datesList.first;
    _selectedSlot = _slots.first;
  }

  Future<void> _handleConfirmBooking() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    if (!auth.isLoggedIn) return;

    setState(() => _isBooking = true);
    final user = auth.currentUser!;
    final doc = widget.doctor;

    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final appointmentId = 'appt_${Random().nextInt(1000000)}_${DateTime.now().millisecondsSinceEpoch}';

    // Video session urls if online mode is chosen
    String? videoRoomUrl;
    String? videoRoomName;
    if (_consultationMode == 'online') {
      videoRoomName = 'nidaan-consult-$appointmentId';
      videoRoomUrl = 'https://nidaan-one-test.daily.co/$videoRoomName';
    }

    final fee = _consultationMode == 'online'
        ? (doc['onlineConsultationFee'] ?? 450)
        : (doc['consultationFee'] ?? 800);

    final appointmentData = {
      '_id': appointmentId,
      'id': appointmentId,
      'patientId': user['_id'] ?? user['id'],
      'patientName': user['name'] ?? 'Priya Sharma',
      'patientPhone': user['phone'] ?? '9876543210',
      'doctorId': doc['_id'] ?? doc['id'],
      'doctorName': doc['name'] ?? 'Attending Consultant',
      'department': doc['department'] ?? 'OPD General',
      'hospital': doc['hospital'] ?? 'Nidaan One Clinic, Jubilee Hills',
      'date': dateStr,
      'time': _selectedSlot,
      'consultationMode': _consultationMode,
      'consultationFee': fee,
      'status': 'confirmed',
      'callStatus': 'not_started',
      if (_consultationMode == 'online') ...{
        'videoRoomUrl': videoRoomUrl,
        'videoRoomName': videoRoomName,
      },
      'createdAt': DateTime.now().toIso8601String(),
    };

    try {
      // Set appointment document in MongoDB Atlas database
      final success = await _apiService.setDoc('appointments', appointmentId, appointmentData);
      
      setState(() => _isBooking = false);
      if (success) {
        _showSuccessDialog();
      } else {
        _showErrorSnackBar('Booking failed. Please try again.');
      }
    } catch (e) {
      print('❌ [BookingScreen] Confirm booking error: $e');
      setState(() => _isBooking = false);
      _showErrorSnackBar('Network error. Check server and try again.');
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
        title: const Icon(Icons.check_circle_outline, color: Color(0xFF0F766E), size: 48),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Booking Confirmed!',
              style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Your OPD appointment has been scheduled successfully. You will receive a WhatsApp confirmation shortly.',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), height: 1.4),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          Center(
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Go back to doctors list
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F766E),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6.0)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                elevation: 0,
              ),
              child: Text('Done', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.redAccent,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final doc = widget.doctor;
    final name = doc['name'] ?? 'Consultant';
    final dept = doc['department'] ?? 'General OPD';
    final standardFee = doc['consultationFee'] ?? 800;
    final onlineFee = doc['onlineConsultationFee'] ?? 450;
    final offersOnline = doc['offersOnlineConsultation'] == true;

    final currentFee = _consultationMode == 'online' ? onlineFee : standardFee;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          'Select Slot',
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
            // Doctor metadata recap card
            _buildDoctorRecapHeader(name, dept),
            const SizedBox(height: 20),

            // Consultation Mode Switcher
            if (offersOnline) ...[
              Text(
                'CONSULTATION MODE',
                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 0.8),
              ),
              const SizedBox(height: 8),
              _buildModeToggle(standardFee, onlineFee),
              const SizedBox(height: 20),
            ],

            // Date picker title
            Text(
              'SELECT DATE',
              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 0.8),
            ),
            const SizedBox(height: 8),

            // Date picker list
            _buildDatePickerList(),
            const SizedBox(height: 20),

            // Time slots title
            Text(
              'SELECT TIME SLOT',
              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 0.8),
            ),
            const SizedBox(height: 8),

            // Time slots grid
            _buildTimeSlotsGrid(),
            const SizedBox(height: 32),

            // Sticky booking checkout card
            _buildCheckoutCard(currentFee),
          ],
        ),
      ),
    );
  }

  Widget _buildDoctorRecapHeader(String name, String dept) {
    final initials = name.split(' ').map((e) => e[0]).take(2).join('').toUpperCase();

    return ClinicalCard(
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDFA),
              border: Border.all(color: const Color(0xFFCCFBF1)),
              borderRadius: BorderRadius.circular(6.0),
            ),
            alignment: Alignment.center,
            child: Text(
              initials,
              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0F766E)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                const SizedBox(height: 1),
                Text(dept, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B), fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModeToggle(dynamic standardFee, dynamic onlineFee) {
    return Row(
      children: [
        Expanded(
          child: _buildModeCard(
            id: 'in_person',
            title: 'In-Clinic',
            subtitle: 'Room 302 visit',
            price: '₹$standardFee',
            icon: Icons.store_outlined,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildModeCard(
            id: 'online',
            title: 'Video Consult',
            subtitle: 'Secure WebRTC call',
            price: '₹$onlineFee',
            icon: Icons.videocam_outlined,
          ),
        ),
      ],
    );
  }

  Widget _buildModeCard({
    required String id,
    required String title,
    required String subtitle,
    required String price,
    required IconData icon,
  }) {
    final isSelected = _consultationMode == id;

    return ClinicalCard(
      onTap: () => setState(() => _consultationMode = id),
      border: Border.all(
        color: isSelected ? const Color(0xFF0F766E) : const Color(0xFFE2E8F0),
        width: isSelected ? 1.5 : 1.0,
      ),
      backgroundColor: isSelected ? const Color(0xFFF0FDFA) : Colors.white,
      padding: const EdgeInsets.all(14.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: isSelected ? const Color(0xFF0F766E) : const Color(0xFF64748B), size: 18),
              if (isSelected)
                const Icon(Icons.check_circle, color: Color(0xFF0F766E), size: 14),
            ],
          ),
          const SizedBox(height: 12),
          Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
          const SizedBox(height: 1),
          Text(subtitle, style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF64748B))),
          const SizedBox(height: 8),
          Text(price, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A))),
        ],
      ),
    );
  }

  Widget _buildDatePickerList() {
    return SizedBox(
      height: 64,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _datesList.length,
        itemBuilder: (context, i) {
          final date = _datesList[i];
          final isSelected = DateFormat('yyyy-MM-dd').format(_selectedDate) == DateFormat('yyyy-MM-dd').format(date);
          return Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: GestureDetector(
              onTap: () => setState(() => _selectedDate = date),
              child: Container(
                width: 62,
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFF0FDFA) : Colors.white,
                  border: Border.all(
                    color: isSelected ? const Color(0xFF0F766E) : const Color(0xFFE2E8F0),
                    width: isSelected ? 1.5 : 1.0,
                  ),
                  borderRadius: BorderRadius.circular(6.0),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _dayFormat.format(date).toUpperCase(),
                      style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _dateNumberFormat.format(date),
                      style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: isSelected ? const Color(0xFF0F766E) : const Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      _monthFormat.format(date),
                      style: GoogleFonts.inter(fontSize: 9, color: const Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTimeSlotsGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 2.2,
      ),
      itemCount: _slots.length,
      itemBuilder: (context, i) {
        final slot = _slots[i];
        final isSelected = _selectedSlot == slot;
        return GestureDetector(
          onTap: () => setState(() => _selectedSlot = slot),
          child: Container(
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFFF0FDFA) : Colors.white,
              border: Border.all(
                color: isSelected ? const Color(0xFF0F766E) : const Color(0xFFE2E8F0),
                width: isSelected ? 1.5 : 1.0,
              ),
              borderRadius: BorderRadius.circular(6.0),
            ),
            child: Text(
              slot,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? const Color(0xFF0F766E) : const Color(0xFF475569),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildCheckoutCard(dynamic fee) {
    return ClinicalCard(
      backgroundColor: const Color(0xFFF8FAFC),
      border: Border.all(color: const Color(0xFFE2E8F0)),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'TOTAL FEES due',
                    style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '₹$fee',
                    style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A)),
                  ),
                ],
              ),
              Text(
                _consultationMode == 'online' ? 'Video Consult' : 'Pay at Clinic',
                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0F766E)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _isBooking ? null : _handleConfirmBooking,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F766E),
              foregroundColor: Colors.white,
              elevation: 0,
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
            ),
            child: _isBooking
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text('Confirm Slot Booking', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
