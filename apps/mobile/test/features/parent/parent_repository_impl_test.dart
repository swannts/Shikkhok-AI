import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/features/parent/data/datasources/parent_remote_data_source.dart';
import 'package:mobile/features/parent/data/dto/parent_child_dto.dart';
import 'package:mobile/features/parent/data/repositories/parent_repository_impl.dart';

class MockParentRemoteDataSource implements ParentRemoteDataSource {
  @override
  Future<List<ParentChildDto>> listLinkedChildren() async {
    return const [
      ParentChildDto(
        childUserId: 'child-1',
        name: 'সাদিয়া ইসলাম',
        classLevel: 8,
        streakDays: 5,
        totalMinutesThisWeek: 180,
        averageScore: 88.0,
      ),
    ];
  }

  @override
  Future<void> linkChild({
    String? childUserId,
    String? phone,
    String? email,
  }) async {}

  @override
  Future<void> unlinkChild(String childUserId) async {}

  @override
  Future<ParentChildDashboardDto> getChildDashboard(String childUserId) async {
    return const ParentChildDashboardDto(
      childUserId: 'child-1',
      name: 'সাদিয়া ইসলাম',
      classLevel: 8,
      streakDays: 5,
      weeklyMinutes: 180,
      averageAccuracy: 88.0,
      aiWeeklyInsightBangla: 'সাদিয়া গণিত ও বিজ্ঞানে অনেক উন্নতি করেছে।',
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ParentRepositoryImpl Unit Tests', () {
    late ParentRepositoryImpl repository;
    late MockParentRemoteDataSource mockDataSource;
    late ApiClient apiClient;

    setUp(() {
      mockDataSource = MockParentRemoteDataSource();
      apiClient = ApiClient();
      repository = ParentRepositoryImpl(mockDataSource, apiClient);
    });

    test('listLinkedChildren returns mapped ParentChild entities', () async {
      final children = await repository.listLinkedChildren();

      expect(children.length, 1);
      expect(children.first.name, 'সাদিয়া ইসলাম');
      expect(children.first.classLevel, 8);
      expect(children.first.streakDays, 5);
    });

    test('getChildDashboard returns mapped ParentChildDashboard', () async {
      final dashboard = await repository.getChildDashboard('child-1');

      expect(dashboard.childUserId, 'child-1');
      expect(dashboard.name, 'সাদিয়া ইসলাম');
      expect(dashboard.aiWeeklyInsightBangla, contains('উন্নতি করেছে'));
    });
  });
}
