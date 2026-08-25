import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/errors/app_failure.dart';
import '../../domain/entities/student_profile.dart';
import '../../domain/repositories/student_repository.dart';
import '../datasources/student_remote_data_source.dart';
import '../mappers/student_profile_mapper.dart';

class StudentRepositoryImpl implements StudentRepository {
  final StudentRemoteDataSource _remoteDataSource;
  final ApiClient _apiClient;

  StudentRepositoryImpl(this._remoteDataSource, this._apiClient);

  @override
  Future<StudentProfile> getMyProfile() async {
    try {
      final dto = await _remoteDataSource.getMyProfile();
      return StudentProfileMapper.toDomain(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'শিক্ষার্থীর তথ্য আনা সম্ভব হয়নি।',
      );
    }
  }

  @override
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
  }) async {
    try {
      final dto = await _remoteDataSource.upsertMyProfile(
        classLevel: classLevel,
        medium: medium.toApiString(),
        curriculumYear: curriculumYear,
        schoolName: schoolName,
        district: district,
        upazila: upazila,
        board: board,
        academicStream: academicStream,
        guardianPhone: guardianPhone,
        preferredSubjects: preferredSubjects,
        learningGoals: learningGoals,
        dateOfBirth: dateOfBirth?.toIso8601String(),
      );
      return StudentProfileMapper.toDomain(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'প্রোফাইল সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।',
      );
    }
  }
}
