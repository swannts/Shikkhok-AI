import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/database/app_database.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/connectivity_provider.dart';
import '../../../../core/storage/token_storage.dart';
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

class SyncOffline extends SyncState {
  final int pendingCount;
  const SyncOffline(this.pendingCount);
}

class SyncPending extends SyncState {
  final int pendingCount;
  const SyncPending(this.pendingCount);
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
  final Stream<bool>? _connectivity;
  final Future<String> Function() _resolveDeviceId;
  StreamSubscription<bool>? _connectivitySubscription;
  bool _online = true;

  SyncController(
    this._repository, {
    Stream<bool>? connectivity,
    Future<String> Function()? resolveDeviceId,
  })  : _connectivity = connectivity,
        _resolveDeviceId = resolveDeviceId ?? TokenStorage.getOrCreateDeviceId,
        super(const SyncInitial()) {
    _initialize();
    _connectivitySubscription = _connectivity?.listen(handleConnectivity);
  }

  Future<void> _initialize() async {
    try {
      await _repository.restoreStuckProcessing();
    } catch (_) {}
  }

  Future<void> enqueueOperation(SyncOperation operation) async {
    await _repository.enqueueOperation(operation);
    final count = await _repository.countPending();
    state = _online ? SyncPending(count) : SyncOffline(count);
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
    if (!_online) {
      final count = await _repository.countPending();
      state = SyncOffline(count);
      return null;
    }
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

  Future<void> handleConnectivity(bool online) async {
    _online = online;
    final count = await _repository.countPending();
    if (!online) {
      state = SyncOffline(count);
      return;
    }
    if (count > 0) {
      await flushQueue(deviceId: await _resolveDeviceId());
    } else {
      state = const SyncSuccess(SyncBatchResult());
    }
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    super.dispose();
  }
}

final syncControllerProvider =
    StateNotifierProvider<SyncController, SyncState>((ref) {
  final repository = ref.watch(syncRepositoryProvider);
  final controller = SyncController(repository);
  ref.listen<AsyncValue<bool>>(connectivityProvider, (_, next) {
    next.whenData(controller.handleConnectivity);
  });
  return controller;
});
