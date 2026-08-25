import '../entities/student_profile.dart';

abstract interface class StudentRepository {
  Future<StudentProfile> getMyProfile();

  Future<StudentProfile> upsertMyProfile({
    required int classLevel,
    required StudentMediumType medium,
    required int curriculumYear,
    String? schoolName,
    String? district,
    String? upazila,
    String? board,
    String? academicStream,
    String? guardianPhone,
    List<String>? preferredSubjects,
    List<String>? learningGoals,
    DateTime? dateOfBirth,
  });
}
