import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/database/app_database.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/sync_operation.dart';
import '../../domain/entities/sync_batch_result.dart';
import '../../domain/entities/sync_checkpoint.dart';
import '../../domain/repositories/sync_repository.dart';
import '../../data/datasources/sync_local_data_source.dart';
import '../../data/datasources/sync_remote_data_source.dart';
import '../../data/repositories/sync_repository_impl.dart';

final syncLocalDataSourceProvider = Provider<SyncLocalDataSource>((ref) {
  return SyncLocalDataSourceImpl(appDatabase);
});

final syncRemoteDataSourceProvider = Provider<SyncRemoteDataSource>((ref) {
  return SyncRemoteDataSourceImpl(apiClient);
});

final syncRepositoryProvider = Provider<SyncRepository>((ref) {
  final localDataSource = ref.watch(syncLocalDataSourceProvider);
  final remoteDataSource = ref.watch(syncRemoteDataSourceProvider);
  return SyncRepositoryImpl(localDataSource, remoteDataSource, apiClient);
});

sealed class SyncState {
  const SyncState();
}

class SyncInitial extends SyncState {
  const SyncInitial();
}

class SyncInProgress extends SyncState {
  final int pendingCount;
  const SyncInProgress(this.pendingCount);
}

class SyncSuccess extends SyncState {
  final SyncBatchResult result;
  final SyncCheckpoint? checkpoint;
  const SyncSuccess(this.result, {this.checkpoint});
}

class SyncFailureState extends SyncState {
  final String message;
  const SyncFailureState(this.message);
}

class SyncController extends StateNotifier<SyncState> {
  final SyncRepository _repository;

  SyncController(this._repository) : super(const SyncInitial()) {
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      await _repository.restoreStuckProcessing();
    } catch (_) {}
  }

  Future<void> enqueueOperation(SyncOperation operation) async {
    await _repository.enqueueOperation(operation);
  }

  Future<void> enqueueLessonProgress(LessonProgressSyncPayload payload) async {
    final now = DateTime.now();
    final op = SyncOperation(
      operationId:
          'op_lesson_${payload.lessonId}_${now.millisecondsSinceEpoch}',
      operationType: SyncOperationType.lessonProgressUpsert,
      entityType: 'lesson_progress',
      entityId: payload.lessonId,
      payload: payload,
      createdAt: now,
      updatedAt: now,
    );
    await enqueueOperation(op);
  }

  Future<void> enqueueStudyPlan(StudyPlanSyncPayload payload) async {
    final now = DateTime.now();
    final op = SyncOperation(
      operationId: 'op_study_plan_${now.millisecondsSinceEpoch}',
      operationType: SyncOperationType.studyPlanUpsert,
      entityType: 'study_plan',
      payload: payload,
      createdAt: now,
      updatedAt: now,
    );
    await enqueueOperation(op);
  }

  Future<void> enqueueNotificationRead(
      NotificationReadSyncPayload payload) async {
    final now = DateTime.now();
    final op = SyncOperation(
      operationId:
          'op_notif_${payload.notificationId}_${now.millisecondsSinceEpoch}',
      operationType: SyncOperationType.notificationMarkRead,
      entityType: 'notification',
      entityId: payload.notificationId,
      payload: payload,
      createdAt: now,
      updatedAt: now,
    );
    await enqueueOperation(op);
  }

  Future<SyncBatchResult?> flushQueue({required String deviceId}) async {
    final count = await _repository.countPending();
    if (count == 0) {
      const emptyResult = SyncBatchResult();
      state = const SyncSuccess(emptyResult);
      return emptyResult;
    }

    state = SyncInProgress(count);

    try {
      final result = await _repository.flushPending(deviceId: deviceId);
      SyncCheckpoint? checkpoint;
      try {
        checkpoint = await _repository.getCheckpoint(deviceId);
      } catch (_) {}

      state = SyncSuccess(result, checkpoint: checkpoint);
      return result;
    } on AppFailure catch (failure) {
      state = SyncFailureState(failure.message);
      return null;
    } catch (_) {
      state = const SyncFailureState('অফলাইন সিঙ্ক সম্পন্ন করা যায়নি');
      return null;
    }
  }

  Future<int> getPendingCount() async {
    return _repository.countPending();
  }
}

final syncControllerProvider =
    StateNotifierProvider<SyncController, SyncState>((ref) {
  final repository = ref.watch(syncRepositoryProvider);
  return SyncController(repository);
});
