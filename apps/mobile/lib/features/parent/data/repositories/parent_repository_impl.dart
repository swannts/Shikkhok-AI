import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/parent_child.dart';
import '../../domain/entities/parent_child_dashboard.dart';
import '../../domain/repositories/parent_repository.dart';
import '../datasources/parent_remote_data_source.dart';
import '../mappers/parent_mapper.dart';

class ParentRepositoryImpl implements ParentRepository {
  final ParentRemoteDataSource _remoteDataSource;
  final ApiClient _apiClient;

  ParentRepositoryImpl(this._remoteDataSource, this._apiClient);

  @override
  Future<List<ParentChild>> listLinkedChildren() async {
    try {
      final dtos = await _remoteDataSource.listLinkedChildren();
      return dtos.map(ParentMapper.toDomainChild).toList();
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<void> linkChild({
    String? childUserId,
    String? phone,
    String? email,
  }) async {
    try {
      await _remoteDataSource.linkChild(
        childUserId: childUserId,
        phone: phone,
        email: email,
      );
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<void> unlinkChild(String childUserId) async {
    try {
      await _remoteDataSource.unlinkChild(childUserId);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<ParentChildDashboard> getChildDashboard(String childUserId) async {
    try {
      final dto = await _remoteDataSource.getChildDashboard(childUserId);
      return ParentMapper.toDomainDashboard(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }
}
