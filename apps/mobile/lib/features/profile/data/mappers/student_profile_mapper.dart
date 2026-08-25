import '../../domain/entities/student_profile.dart';
import '../dto/student_profile_dto.dart';

class StudentProfileMapper {
  static StudentProfile toDomain(StudentProfileDto dto) {
    DateTime? dob;
    if (dto.dateOfBirth != null) {
      try {
        dob = DateTime.parse(dto.dateOfBirth!);
      } catch (_) {}
    }

    return StudentProfile(
      id: dto.id,
      userId: dto.userId,
      classLevel: dto.classLevel,
      medium: StudentMediumType.fromString(dto.medium),
      curriculumYear: dto.curriculumYear,
      schoolName: dto.schoolName,
      district: dto.district,
      upazila: dto.upazila,
      board: dto.board,
      academicStream: dto.academicStream,
      guardianPhone: dto.guardianPhone,
      preferredSubjects: dto.preferredSubjects,
      learningGoals: dto.learningGoals,
      dateOfBirth: dob,
    );
  }

  static StudentProfileDto toDto(StudentProfile entity) {
    return StudentProfileDto(
      id: entity.id,
      userId: entity.userId,
      classLevel: entity.classLevel,
      medium: entity.medium.toApiString(),
      curriculumYear: entity.curriculumYear,
      schoolName: entity.schoolName,
      district: entity.district,
      upazila: entity.upazila,
      board: entity.board,
      academicStream: entity.academicStream,
      guardianPhone: entity.guardianPhone,
      preferredSubjects: entity.preferredSubjects,
      learningGoals: entity.learningGoals,
      dateOfBirth: entity.dateOfBirth?.toIso8601String(),
    );
  }
}
