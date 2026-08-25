import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/parent_child.dart';
import '../../domain/entities/parent_child_dashboard.dart';
import '../../domain/repositories/parent_repository.dart';
import '../../data/datasources/parent_remote_data_source.dart';
import '../../data/repositories/parent_repository_impl.dart';

final parentRemoteDataSourceProvider = Provider<ParentRemoteDataSource>((ref) {
  return ParentRemoteDataSourceImpl(apiClient);
});

final parentRepositoryProvider = Provider<ParentRepository>((ref) {
  final remoteDataSource = ref.watch(parentRemoteDataSourceProvider);
  return ParentRepositoryImpl(remoteDataSource, apiClient);
});

sealed class ParentState {
  const ParentState();
}

class ParentInitial extends ParentState {
  const ParentInitial();
}

class ParentLoading extends ParentState {
  const ParentLoading();
}

class ParentDashboardLoaded extends ParentState {
  final List<ParentChild> children;
  final int selectedChildIndex;
  final ParentChildDashboard? activeChildDashboard;

  const ParentDashboardLoaded({
    required this.children,
    this.selectedChildIndex = 0,
    this.activeChildDashboard,
  });

  ParentChild? get activeChild =>
      children.isNotEmpty ? children[selectedChildIndex] : null;

  ParentDashboardLoaded copyWith({
    List<ParentChild>? children,
    int? selectedChildIndex,
    ParentChildDashboard? activeChildDashboard,
  }) {
    return ParentDashboardLoaded(
      children: children ?? this.children,
      selectedChildIndex: selectedChildIndex ?? this.selectedChildIndex,
      activeChildDashboard: activeChildDashboard ?? this.activeChildDashboard,
    );
  }
}

class ParentError extends ParentState {
  final String message;
  const ParentError(this.message);
}

class ParentController extends StateNotifier<ParentState> {
  final ParentRepository _repository;

  ParentController(this._repository) : super(const ParentInitial());

  Future<void> loadChildren() async {
    state = const ParentLoading();
    try {
      final children = await _repository.listLinkedChildren();
      if (children.isEmpty) {
        state = const ParentDashboardLoaded(children: []);
        return;
      }

      final firstChild = children.first;
      ParentChildDashboard? dashboard;
      try {
        dashboard = await _repository.getChildDashboard(firstChild.childUserId);
      } catch (_) {}

      state = ParentDashboardLoaded(
        children: children,
        selectedChildIndex: 0,
        activeChildDashboard: dashboard,
      );
    } on AppFailure catch (failure) {
      state = ParentError(failure.message);
    } catch (_) {
      state = const ParentError('সন্তানের তথ্য লোড করা যায়নি');
    }
  }

  Future<void> selectChild(int index) async {
    final current = state;
    if (current is! ParentDashboardLoaded ||
        index < 0 ||
        index >= current.children.length) {
      return;
    }

    final child = current.children[index];
    ParentChildDashboard? dashboard;
    try {
      dashboard = await _repository.getChildDashboard(child.childUserId);
    } catch (_) {}

    state = current.copyWith(
      selectedChildIndex: index,
      activeChildDashboard: dashboard,
    );
  }

  Future<bool> linkChild({
    String? phone,
    String? email,
  }) async {
    try {
      await _repository.linkChild(phone: phone, email: email);
      await loadChildren();
      return true;
    } on AppFailure catch (failure) {
      state = ParentError(failure.message);
      return false;
    } catch (_) {
      state = const ParentError('সন্তানের অ্যাকাউন্ট যুক্ত করা যায়নি');
      return false;
    }
  }

  Future<void> unlinkChild(String childUserId) async {
    try {
      await _repository.unlinkChild(childUserId);
      await loadChildren();
    } catch (_) {}
  }
}

final parentControllerProvider =
    StateNotifierProvider<ParentController, ParentState>((ref) {
  final repository = ref.watch(parentRepositoryProvider);
  return ParentController(repository);
});
