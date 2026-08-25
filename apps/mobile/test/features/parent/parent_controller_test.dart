import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/parent/domain/entities/parent_child.dart';
import 'package:mobile/features/parent/domain/entities/parent_child_dashboard.dart';
import 'package:mobile/features/parent/domain/repositories/parent_repository.dart';
import 'package:mobile/features/parent/presentation/controllers/parent_controller.dart';

class FakeParentRepository implements ParentRepository {
  @override
  Future<List<ParentChild>> listLinkedChildren() async {
    return const [
      ParentChild(
        childUserId: 'child-1',
        name: 'সাদিয়া ইসলাম',
        classLevel: 8,
        streakDays: 5,
        totalMinutesThisWeek: 180,
      ),
      ParentChild(
        childUserId: 'child-2',
        name: 'তানভীর ইসলাম',
        classLevel: 6,
        streakDays: 3,
        totalMinutesThisWeek: 120,
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
  Future<ParentChildDashboard> getChildDashboard(String childUserId) async {
    return ParentChildDashboard(
      childUserId: childUserId,
      name: childUserId == 'child-1' ? 'সাদিয়া ইসলাম' : 'তানভীর ইসলাম',
      classLevel: childUserId == 'child-1' ? 8 : 6,
      streakDays: 5,
      weeklyMinutes: 180,
      averageAccuracy: 88.0,
      aiWeeklyInsightBangla: 'ভালো অগ্রগতি দেখা যাচ্ছে।',
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ParentController Unit Tests', () {
    late ParentController controller;
    late FakeParentRepository repository;

    setUp(() {
      repository = FakeParentRepository();
      controller = ParentController(repository);
    });

    test('Initial state is ParentInitial', () {
      expect(controller.state, isA<ParentInitial>());
    });

    test('loadChildren loads linked children and active dashboard', () async {
      await controller.loadChildren();

      expect(controller.state, isA<ParentDashboardLoaded>());
      final loaded = controller.state as ParentDashboardLoaded;
      expect(loaded.children.length, 2);
      expect(loaded.activeChild?.name, 'সাদিয়া ইসলাম');
      expect(loaded.activeChildDashboard?.aiWeeklyInsightBangla,
          contains('ভালো অগ্রগতি'));
    });

    test('selectChild updates selected index and loads corresponding dashboard',
        () async {
      await controller.loadChildren();
      await controller.selectChild(1);

      final loaded = controller.state as ParentDashboardLoaded;
      expect(loaded.selectedChildIndex, 1);
      expect(loaded.activeChild?.name, 'তানভীর ইসলাম');
    });
  });
}
