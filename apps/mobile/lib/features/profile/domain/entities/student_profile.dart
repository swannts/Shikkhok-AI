enum StudentMediumType {
  bangla,
  english;

  static StudentMediumType fromString(String? val) {
    switch (val?.toLowerCase()) {
      case 'english':
        return StudentMediumType.english;
      case 'bangla':
      default:
        return StudentMediumType.bangla;
    }
  }

  String toApiString() {
    switch (this) {
      case StudentMediumType.bangla:
        return 'bangla';
      case StudentMediumType.english:
        return 'english';
    }
  }

  String get displayName {
    switch (this) {
      case StudentMediumType.bangla:
        return 'বাংলা ভার্সন';
      case StudentMediumType.english:
        return 'English Version';
    }
  }
}

class StudentProfile {
  final String id;
  final String userId;
  final int classLevel;
  final StudentMediumType medium;
  final int curriculumYear;
  final String? schoolName;
  final String? district;
  final String? upazila;
  final String? board;
  final String? academicStream;
  final String? guardianPhone;
  final List<String> preferredSubjects;
  final List<String> learningGoals;
  final DateTime? dateOfBirth;

  const StudentProfile({
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

  String get classDisplayName => 'Class $classLevel';

  StudentProfile copyWith({
    String? id,
    String? userId,
    int? classLevel,
    StudentMediumType? medium,
    int? curriculumYear,
    String? schoolName,
    String? district,
    String? upazila,
    String? board,
    String? academicStream,
    String? guardianPhone,
    List<String>? preferredSubjects,
    List<String>? learningGoals,
    DateTime? dateOfBirth,
  }) {
    return StudentProfile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      classLevel: classLevel ?? this.classLevel,
      medium: medium ?? this.medium,
      curriculumYear: curriculumYear ?? this.curriculumYear,
      schoolName: schoolName ?? this.schoolName,
      district: district ?? this.district,
      upazila: upazila ?? this.upazila,
      board: board ?? this.board,
      academicStream: academicStream ?? this.academicStream,
      guardianPhone: guardianPhone ?? this.guardianPhone,
      preferredSubjects: preferredSubjects ?? this.preferredSubjects,
      learningGoals: learningGoals ?? this.learningGoals,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
    );
  }
}
