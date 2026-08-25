import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/errors/app_failure.dart';
import '../../domain/entities/student_profile.dart';
import '../../domain/repositories/student_repository.dart';
import '../../data/datasources/student_remote_data_source.dart';
import '../../data/repositories/student_repository_impl.dart';

final studentRemoteDataSourceProvider =
    Provider<StudentRemoteDataSource>((ref) {
  return StudentRemoteDataSourceImpl(apiClient);
});

final studentRepositoryProvider = Provider<StudentRepository>((ref) {
  return StudentRepositoryImpl(
    ref.read(studentRemoteDataSourceProvider),
    apiClient,
  );
});

sealed class StudentProfileState {
  const StudentProfileState();
}

class StudentProfileInitial extends StudentProfileState {
  const StudentProfileInitial();
}

class StudentProfileLoading extends StudentProfileState {
  const StudentProfileLoading();
}

class StudentProfileLoaded extends StudentProfileState {
  final StudentProfile profile;
  const StudentProfileLoaded(this.profile);
}

class StudentProfileFailure extends StudentProfileState {
  final AppFailure failure;
  const StudentProfileFailure(this.failure);
}

class StudentProfileController extends StateNotifier<StudentProfileState> {
  final StudentRepository _repository;

  // Onboarding Setup Draft State
  int draftClassLevel = 8;
  StudentMediumType draftMedium = StudentMediumType.bangla;
  int draftCurriculumYear = 2026;
  String? draftAcademicStream;
  List<String> draftGoals = [];
  List<String> draftPreferredSubjects = [];

  StudentProfileController(this._repository)
      : super(const StudentProfileInitial());

  Future<void> loadProfile() async {
    state = const StudentProfileLoading();
    try {
      final profile = await _repository.getMyProfile();
      state = StudentProfileLoaded(profile);
      draftClassLevel = profile.classLevel;
      draftMedium = profile.medium;
      draftCurriculumYear = profile.curriculumYear;
      draftAcademicStream = profile.academicStream;
      draftGoals = List.from(profile.learningGoals);
      draftPreferredSubjects = List.from(profile.preferredSubjects);
    } on AppFailure catch (e) {
      state = StudentProfileFailure(e);
    } catch (e) {
      state = StudentProfileFailure(
        ServerFailure(
          message: e.toString(),
          banglaMessage: 'প্রোফাইল লোড করা সম্ভব হয়নি।',
        ),
      );
    }
  }

  void setDraftClass(int classLevel) {
    draftClassLevel = classLevel;
  }

  void setDraftCurriculum({
    required StudentMediumType medium,
    required int year,
    String? stream,
  }) {
    draftMedium = medium;
    draftCurriculumYear = year;
    draftAcademicStream = stream;
  }

  void setDraftGoalsAndSubjects({
    required List<String> goals,
    required List<String> subjects,
  }) {
    draftGoals = List.from(goals);
    draftPreferredSubjects = List.from(subjects);
  }

  Future<bool> saveCompleteProfile({
    String? schoolName,
    String? district,
    String? upazila,
    String? board,
    String? guardianPhone,
  }) async {
    state = const StudentProfileLoading();
    try {
      final profile = await _repository.upsertMyProfile(
        classLevel: draftClassLevel,
        medium: draftMedium,
        curriculumYear: draftCurriculumYear,
        academicStream: draftAcademicStream,
        learningGoals: draftGoals,
        preferredSubjects: draftPreferredSubjects,
        schoolName: schoolName,
        district: district,
        upazila: upazila,
        board: board,
        guardianPhone: guardianPhone,
      );
      state = StudentProfileLoaded(profile);
      return true;
    } on AppFailure catch (e) {
      state = StudentProfileFailure(e);
      return false;
    } catch (e) {
      state = StudentProfileFailure(
        ServerFailure(
          message: e.toString(),
          banglaMessage: 'প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে।',
        ),
      );
      return false;
    }
  }
}

final studentProfileControllerProvider =
    StateNotifierProvider<StudentProfileController, StudentProfileState>((ref) {
  return StudentProfileController(ref.read(studentRepositoryProvider));
});
