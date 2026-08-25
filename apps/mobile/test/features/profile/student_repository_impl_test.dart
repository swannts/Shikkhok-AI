import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/features/profile/data/datasources/student_remote_data_source.dart';
import 'package:mobile/features/profile/data/dto/student_profile_dto.dart';
import 'package:mobile/features/profile/data/repositories/student_repository_impl.dart';
import 'package:mobile/features/profile/domain/entities/student_profile.dart';

class MockStudentRemoteDataSource implements StudentRemoteDataSource {
  @override
  Future<StudentProfileDto> getMyProfile() async {
    return const StudentProfileDto(
      id: 'prof-123',
      userId: 'user-123',
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
      schoolName: 'Dhaka Residential Model College',
      preferredSubjects: ['math', 'science'],
      learningGoals: ['prepare for exam'],
    );
  }

  @override
  Future<StudentProfileDto> upsertMyProfile({
    required int classLevel,
    required String medium,
    required int curriculumYear,
    String? schoolName,
    String? district,
    String? upazila,
    String? board,
    String? academicStream,
    String? guardianPhone,
    List<String>? preferredSubjects,
    List<String>? learningGoals,
    String? dateOfBirth,
  }) async {
    return StudentProfileDto(
      id: 'prof-123',
      userId: 'user-123',
      classLevel: classLevel,
      medium: medium,
      curriculumYear: curriculumYear,
      schoolName: schoolName,
      district: district,
      upazila: upazila,
      board: board,
      academicStream: academicStream,
      guardianPhone: guardianPhone,
      preferredSubjects: preferredSubjects ?? [],
      learningGoals: learningGoals ?? [],
      dateOfBirth: dateOfBirth,
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('StudentRepositoryImpl Unit Tests', () {
    late StudentRepositoryImpl repository;
    late MockStudentRemoteDataSource mockDataSource;
    late ApiClient apiClient;

    setUp(() {
      mockDataSource = MockStudentRemoteDataSource();
      apiClient = ApiClient();
      repository = StudentRepositoryImpl(mockDataSource, apiClient);
    });

    test('getMyProfile returns mapped StudentProfile domain entity', () async {
      final profile = await repository.getMyProfile();

      expect(profile.id, 'prof-123');
      expect(profile.classLevel, 8);
      expect(profile.medium, StudentMediumType.bangla);
      expect(profile.schoolName, 'Dhaka Residential Model College');
      expect(profile.preferredSubjects, contains('math'));
    });

    test('upsertMyProfile returns updated StudentProfile', () async {
      final profile = await repository.upsertMyProfile(
        classLevel: 9,
        medium: StudentMediumType.english,
        curriculumYear: 2026,
        academicStream: 'science',
        schoolName: 'Viqarunnisa Noon School',
      );

      expect(profile.classLevel, 9);
      expect(profile.medium, StudentMediumType.english);
      expect(profile.academicStream, 'science');
      expect(profile.schoolName, 'Viqarunnisa Noon School');
    });
  });
}
