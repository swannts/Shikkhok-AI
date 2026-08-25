import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../dto/study_plan_dto.dart';
import '../mappers/study_plan_mapper.dart';
import '../../domain/entities/study_plan.dart';
import '../../domain/repositories/study_plan_repository.dart';

class StudyPlanRepositoryImpl implements StudyPlanRepository {
  final ApiClient _apiClient;

  StudyPlanRepositoryImpl(this._apiClient);

  @override
  Future<StudyPlan> getCurrentPlan() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.studyPlanCurrent);
      final data = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};
      return StudyPlanMapper.toDomain(StudyPlanDto.fromJson(data));
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<StudyPlan> generateRecommendedPlan() async {
    try {
      final response =
          await _apiClient.dio.post(ApiEndpoints.studyPlanGenerate);
      final data = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};
      return StudyPlanMapper.toDomain(StudyPlanDto.fromJson(data));
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }
}
