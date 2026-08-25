class StudentProfileDto {
  final String id;
  final String userId;
  final int classLevel;
  final String medium;
  final int curriculumYear;
  final String? schoolName;
  final String? district;
  final String? upazila;
  final String? board;
  final String? academicStream;
  final String? guardianPhone;
  final List<String> preferredSubjects;
  final List<String> learningGoals;
  final String? dateOfBirth;

  const StudentProfileDto({
    required this.id,
    required this.userId,
    required this.classLevel,
    required this.medium,
    this.curriculumYear = 2026,
    this.schoolName,
    this.district,
    this.upazila,
    this.board,
    this.academicStream,
    this.guardianPhone,
    this.preferredSubjects = const [],
    this.learningGoals = const [],
    this.dateOfBirth,
  });

  factory StudentProfileDto.fromJson(Map<String, dynamic> json) {
    return StudentProfileDto(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      userId: (json['userId'] ?? '').toString(),
      classLevel: (json['classLevel'] as num?)?.toInt() ?? 8,
      medium: (json['medium'] as String?) ?? 'bangla',
      curriculumYear: (json['curriculumYear'] as num?)?.toInt() ?? 2026,
      schoolName: json['schoolName'] as String?,
      district: json['district'] as String?,
      upazila: json['upazila'] as String?,
      board: json['board'] as String?,
      academicStream: json['academicStream'] as String?,
      guardianPhone: json['guardianPhone'] as String?,
      preferredSubjects: (json['preferredSubjects'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      learningGoals: (json['learningGoals'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      dateOfBirth: json['dateOfBirth'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'userId': userId,
        'classLevel': classLevel,
        'medium': medium,
        'curriculumYear': curriculumYear,
        if (schoolName != null) 'schoolName': schoolName,
        if (district != null) 'district': district,
        if (upazila != null) 'upazila': upazila,
        if (board != null) 'board': board,
        if (academicStream != null) 'academicStream': academicStream,
        if (guardianPhone != null) 'guardianPhone': guardianPhone,
        'preferredSubjects': preferredSubjects,
        'learningGoals': learningGoals,
        if (dateOfBirth != null) 'dateOfBirth': dateOfBirth,
      };
}
