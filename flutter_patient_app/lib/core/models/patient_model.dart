class PatientModel {
  final String uid;
  final String name;
  final String phone;
  final String email;
  final int age;
  final String gender;
  final String city;
  final String bloodGroup;
  final String abhaId;
  final String persona;
  final double trustScore;
  final int totalVisits;
  final int totalNoShows;
  final bool isNew;
  final bool whatsappOptedIn;
  final List<String> medicalConditions;
  final String prescriptionName;

  PatientModel({
    required this.uid,
    required this.name,
    required this.phone,
    this.email = '',
    this.age = 0,
    this.gender = '',
    this.city = '',
    this.bloodGroup = '',
    this.abhaId = '',
    this.persona = 'working_professional',
    this.trustScore = 95.0,
    this.totalVisits = 1,
    this.totalNoShows = 0,
    this.isNew = false,
    this.whatsappOptedIn = false,
    this.medicalConditions = const [],
    this.prescriptionName = '',
  });

  factory PatientModel.fromMap(String id, Map<String, dynamic> map) {
    List<String> conditions = [];
    if (map['medicalConditions'] != null) {
      conditions = List<String>.from(map['medicalConditions']);
    }

    return PatientModel(
      uid: id,
      name: map['name'] ?? '',
      phone: map['phone'] ?? '',
      email: map['email'] ?? '',
      age: (map['age'] as num?)?.toInt() ?? 0,
      gender: map['gender'] ?? '',
      city: map['city'] ?? '',
      bloodGroup: map['bloodGroup'] ?? '',
      abhaId: map['abhaId'] ?? '',
      persona: map['persona'] ?? 'working_professional',
      trustScore: (map['trustScore'] as num?)?.toDouble() ?? 95.0,
      totalVisits: (map['totalVisits'] as num?)?.toInt() ?? 1,
      totalNoShows: (map['totalNoShows'] as num?)?.toInt() ?? 0,
      isNew: false,
      whatsappOptedIn: map['whatsappOptedIn'] as bool? ?? false,
      medicalConditions: conditions,
      prescriptionName: map['prescriptionName'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'phone': phone,
      'email': email,
      'age': age,
      'gender': gender,
      'city': city,
      'bloodGroup': bloodGroup,
      'abhaId': abhaId,
      'persona': persona,
      'trustScore': trustScore,
      'totalVisits': totalVisits,
      'totalNoShows': totalNoShows,
      'whatsappOptedIn': whatsappOptedIn,
      'medicalConditions': medicalConditions,
      'prescriptionName': prescriptionName,
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }

  PatientModel copyWith({
    String? name,
    String? phone,
    String? email,
    int? age,
    String? gender,
    String? city,
    String? bloodGroup,
    String? abhaId,
    String? persona,
    double? trustScore,
    int? totalVisits,
    int? totalNoShows,
    bool? isNew,
    bool? whatsappOptedIn,
    List<String>? medicalConditions,
    String? prescriptionName,
  }) {
    return PatientModel(
      uid: uid,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      city: city ?? this.city,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      abhaId: abhaId ?? this.abhaId,
      persona: persona ?? this.persona,
      trustScore: trustScore ?? this.trustScore,
      totalVisits: totalVisits ?? this.totalVisits,
      totalNoShows: totalNoShows ?? this.totalNoShows,
      isNew: isNew ?? this.isNew,
      whatsappOptedIn: whatsappOptedIn ?? this.whatsappOptedIn,
      medicalConditions: medicalConditions ?? this.medicalConditions,
      prescriptionName: prescriptionName ?? this.prescriptionName,
    );
  }
}
