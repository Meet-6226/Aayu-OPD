class AppointmentModel {
  final String id;
  final String patientId;
  final String doctorId;
  final String doctorName;
  final String department;
  final String appointmentDate; // YYYY-MM-DD
  final String appointmentTime; // HH:MM AM/PM
  final String status; // pending, confirmed, cancelled, completed
  final double consultationFee;
  final double? riskScore;
  final String? riskLevel;
  final String persona;
  final bool familyNotified;
  final bool reminderSent24h;
  final bool patientConfirmed;
  final String bookingId;
  final String hospital;
  final String room;
  final String notes;
  final String cancelledReason;
  final DateTime createdAt;

  AppointmentModel({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.doctorName,
    required this.department,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.status,
    required this.consultationFee,
    this.riskScore,
    this.riskLevel,
    this.persona = 'working_professional',
    this.familyNotified = false,
    this.reminderSent24h = false,
    this.patientConfirmed = true,
    required this.bookingId,
    this.hospital = 'Aayu Center',
    this.room = 'OPD-102',
    this.notes = '',
    this.cancelledReason = '',
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory AppointmentModel.fromMap(String docId, Map<String, dynamic> map) {
    return AppointmentModel(
      id: docId,
      patientId: map['patientId'] ?? '',
      doctorId: map['doctorId'] ?? '',
      doctorName: map['doctorName'] ?? '',
      department: map['department'] ?? '',
      appointmentDate: map['appointmentDate'] ?? '',
      appointmentTime: map['appointmentTime'] ?? '',
      status: map['status'] ?? 'confirmed',
      consultationFee: (map['consultationFee'] as num?)?.toDouble() ?? 800.0,
      riskScore: (map['riskScore'] as num?)?.toDouble(),
      riskLevel: map['riskLevel'],
      persona: map['persona'] ?? 'working_professional',
      familyNotified: map['familyNotified'] ?? false,
      reminderSent24h: map['reminderSent24h'] ?? false,
      patientConfirmed: map['patientConfirmed'] ?? true,
      bookingId: map['bookingId'] ?? docId,
      hospital: map['hospital'] ?? 'Aayu Main Building',
      room: map['room'] ?? 'OPD Room 204',
      notes: map['notes'] ?? '',
      cancelledReason: map['cancelledReason'] ?? '',
      createdAt: map['createdAt'] != null
          ? (map['createdAt'] is String
              ? DateTime.parse(map['createdAt'])
              : DateTime.now())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'patientId': patientId,
      'doctorId': doctorId,
      'doctorName': doctorName,
      'department': department,
      'appointmentDate': appointmentDate,
      'appointmentTime': appointmentTime,
      'status': status,
      'consultationFee': consultationFee,
      'riskScore': riskScore,
      'riskLevel': riskLevel,
      'persona': persona,
      'familyNotified': familyNotified,
      'reminderSent24h': reminderSent24h,
      'patientConfirmed': patientConfirmed,
      'bookingId': bookingId,
      'hospital': hospital,
      'room': room,
      'notes': notes,
      'cancelledReason': cancelledReason,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
