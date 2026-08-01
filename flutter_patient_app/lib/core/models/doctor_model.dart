class DoctorModel {
  final String id;
  final String name;
  final String initials;
  final String department;
  final String qualifications;
  final int experienceYears;
  final double consultationFee;
  final String phone;
  final String email;
  final double rating;
  final int reviewCount;
  final String hospital;
  final String bio;
  final List<String> specializations;
  final bool isAvailable;
  final String imagePath;

  DoctorModel({
    required this.id,
    required this.name,
    required this.initials,
    required this.department,
    required this.qualifications,
    required this.experienceYears,
    required this.consultationFee,
    required this.phone,
    required this.email,
    required this.rating,
    required this.reviewCount,
    required this.hospital,
    required this.bio,
    required this.specializations,
    this.isAvailable = true,
    this.imagePath = '',
  });

  factory DoctorModel.fromMap(String docId, Map<String, dynamic> map) {
    return DoctorModel(
      id: docId,
      name: map['name'] ?? '',
      initials: map['initials'] ?? '',
      department: map['department'] ?? 'General Medicine',
      qualifications: map['qualifications'] ?? 'MBBS, MD',
      experienceYears: (map['experienceYears'] as num?)?.toInt() ?? 10,
      consultationFee: (map['consultationFee'] as num?)?.toDouble() ?? 800.0,
      phone: map['phone'] ?? '',
      email: map['email'] ?? '',
      rating: (map['rating'] as num?)?.toDouble() ?? 4.8,
      reviewCount: (map['reviewCount'] as num?)?.toInt() ?? 120,
      hospital: map['hospital'] ?? 'Aayu Main Center, Chennai',
      bio: map['bio'] ?? '',
      specializations: List<String>.from(map['specializations'] ?? []),
      isAvailable: map['isAvailable'] ?? true,
      imagePath: map['imagePath'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'initials': initials,
      'department': department,
      'qualifications': qualifications,
      'experienceYears': experienceYears,
      'consultationFee': consultationFee,
      'phone': phone,
      'email': email,
      'rating': rating,
      'reviewCount': reviewCount,
      'hospital': hospital,
      'bio': bio,
      'specializations': specializations,
      'isAvailable': isAvailable,
      'imagePath': imagePath,
    };
  }
}
