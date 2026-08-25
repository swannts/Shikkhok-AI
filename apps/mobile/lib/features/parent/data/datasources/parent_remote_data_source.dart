import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../dto/parent_child_dto.dart';

abstract class ParentRemoteDataSource {
  Future<List<ParentChildDto>> listLinkedChildren();

  Future<void> linkChild({
    String? childUserId,
    String? phone,
    String? email,
  });

  Future<void> unlinkChild(String childUserId);

  Future<ParentChildDashboardDto> getChildDashboard(String childUserId);
}

class ParentRemoteDataSourceImpl implements ParentRemoteDataSource {
  final ApiClient _apiClient;

  ParentRemoteDataSourceImpl([ApiClient? client])
      : _apiClient = client ?? apiClient;

  @override
  Future<List<ParentChildDto>> listLinkedChildren() async {
    final response = await _apiClient.dio.get(ApiEndpoints.parentsChildren);
    final raw = response.data;
    final list = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as List<dynamic>
        : (raw is List<dynamic> ? raw : const []);

    return list
        .map((e) => ParentChildDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> linkChild({
    String? childUserId,
    String? phone,
    String? email,
  }) async {
    await _apiClient.dio.post(
      ApiEndpoints.parentsLinkChild,
      data: {
        if (childUserId != null) 'childUserId': childUserId,
        if (phone != null) 'phone': phone,
        if (email != null) 'email': email,
      },
    );
  }

  @override
  Future<void> unlinkChild(String childUserId) async {
    await _apiClient.dio.delete(ApiEndpoints.parentChild(childUserId));
  }

  @override
  Future<ParentChildDashboardDto> getChildDashboard(String childUserId) async {
    final response = await _apiClient.dio
        .get(ApiEndpoints.parentChildDashboard(childUserId));
    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;

    return ParentChildDashboardDto.fromJson(map);
  }
}
