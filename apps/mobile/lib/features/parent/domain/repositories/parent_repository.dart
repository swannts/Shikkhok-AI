import '../entities/parent_child.dart';
import '../entities/parent_child_dashboard.dart';

abstract class ParentRepository {
  Future<List<ParentChild>> listLinkedChildren();

  Future<void> linkChild({
    String? childUserId,
    String? phone,
    String? email,
  });

  Future<void> unlinkChild(String childUserId);

  Future<ParentChildDashboard> getChildDashboard(String childUserId);
}
