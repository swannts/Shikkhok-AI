import 'dart:convert';
import 'package:drift/drift.dart';
import '../../../../core/database/app_database.dart';
import '../../domain/entities/sync_operation.dart';

abstract class SyncLocalDataSource {
  Future<void> enqueue(SyncOperation operation);
  Future<List<SyncOperation>> listPending({int limit = 50});
  Future<void> markProcessing(List<String> operationIds);
  Future<void> markApplied(String operationId);
  Future<void> markFailed(
    String operationId, {
    required String errorCode,
    required String errorMessage,
    required bool isRetryable,
    required DateTime? nextRetryAt,
  });
  Future<void> incrementRetry(
    String operationId, {
    required DateTime nextRetryAt,
    required String errorMessage,
  });
  Future<void> deleteApplied();
  Future<int> restoreStuckProcessing({
    Duration timeout = const Duration(minutes: 5),
  });
  Future<int> countPending();
}

class SyncLocalDataSourceImpl implements SyncLocalDataSource {
  final AppDatabase _db;

  SyncLocalDataSourceImpl([AppDatabase? db]) : _db = db ?? appDatabase;

  @override
  Future<void> enqueue(SyncOperation operation) async {
    final companion = SyncQueueTableCompanion.insert(
      operationId: operation.operationId,
      operationType: operation.operationType.toApiString(),
      entityType: operation.entityType,
      entityId: Value(operation.entityId),
      payloadJson: operation.payload.toJsonString(),
      createdAt: operation.createdAt,
      retryCount: Value(operation.retryCount),
      status: Value(operation.status.value),
      lastErrorCode: Value(operation.lastErrorCode),
      lastErrorMessage: Value(operation.lastErrorMessage),
      nextRetryAt: Value(operation.nextRetryAt),
      updatedAt: operation.updatedAt,
    );

    await _db.into(_db.syncQueueTable).insertOnConflictUpdate(companion);
  }

  @override
  Future<List<SyncOperation>> listPending({int limit = 50}) async {
    final now = DateTime.now();

    final query = _db.select(_db.syncQueueTable)
      ..where((tbl) =>
          tbl.status.equals(SyncLocalStatus.pending.value) &
          (tbl.nextRetryAt.isNull() |
              tbl.nextRetryAt.isSmallerOrEqualValue(now)))
      ..orderBy([(tbl) => OrderingTerm.asc(tbl.createdAt)])
      ..limit(limit);

    final rows = await query.get();
    return rows.map(_mapRowToEntity).toList();
  }

  @override
  Future<void> markProcessing(List<String> operationIds) async {
    if (operationIds.isEmpty) return;

    final now = DateTime.now();
    await (_db.update(_db.syncQueueTable)
          ..where((tbl) => tbl.operationId.isIn(operationIds)))
        .write(
      SyncQueueTableCompanion(
        status: Value(SyncLocalStatus.processing.value),
        updatedAt: Value(now),
      ),
    );
  }

  @override
  Future<void> markApplied(String operationId) async {
    final now = DateTime.now();
    await (_db.update(_db.syncQueueTable)
          ..where((tbl) => tbl.operationId.equals(operationId)))
        .write(
      SyncQueueTableCompanion(
        status: Value(SyncLocalStatus.applied.value),
        updatedAt: Value(now),
      ),
    );
  }

  @override
  Future<void> markFailed(
    String operationId, {
    required String errorCode,
    required String errorMessage,
    required bool isRetryable,
    required DateTime? nextRetryAt,
  }) async {
    final now = DateTime.now();
    final row = await (_db.select(_db.syncQueueTable)
          ..where((tbl) => tbl.operationId.equals(operationId)))
        .getSingleOrNull();

    final currentRetry = row?.retryCount ?? 0;
    final nextRetry = currentRetry + 1;

    await (_db.update(_db.syncQueueTable)
          ..where((tbl) => tbl.operationId.equals(operationId)))
        .write(
      SyncQueueTableCompanion(
        status: Value(isRetryable
            ? SyncLocalStatus.pending.value
            : SyncLocalStatus.failed.value),
        retryCount: Value(nextRetry),
        lastErrorCode: Value(errorCode),
        lastErrorMessage: Value(errorMessage),
        nextRetryAt: Value(nextRetryAt),
        updatedAt: Value(now),
      ),
    );
  }

  @override
  Future<void> incrementRetry(
    String operationId, {
    required DateTime nextRetryAt,
    required String errorMessage,
  }) async {
    final now = DateTime.now();
    final row = await (_db.select(_db.syncQueueTable)
          ..where((tbl) => tbl.operationId.equals(operationId)))
        .getSingleOrNull();

    final currentRetry = row?.retryCount ?? 0;

    await (_db.update(_db.syncQueueTable)
          ..where((tbl) => tbl.operationId.equals(operationId)))
        .write(
      SyncQueueTableCompanion(
        status: Value(SyncLocalStatus.pending.value),
        retryCount: Value(currentRetry + 1),
        lastErrorMessage: Value(errorMessage),
        nextRetryAt: Value(nextRetryAt),
        updatedAt: Value(now),
      ),
    );
  }

  @override
  Future<void> deleteApplied() async {
    await (_db.delete(_db.syncQueueTable)
          ..where((tbl) => tbl.status.equals(SyncLocalStatus.applied.value)))
        .go();
  }

  @override
  Future<int> restoreStuckProcessing({
    Duration timeout = const Duration(minutes: 5),
  }) async {
    final cutoff = DateTime.now().subtract(timeout);
    final count = await (_db.update(_db.syncQueueTable)
          ..where((tbl) =>
              tbl.status.equals(SyncLocalStatus.processing.value) &
              tbl.updatedAt.isSmallerOrEqualValue(cutoff)))
        .write(
      SyncQueueTableCompanion(
        status: Value(SyncLocalStatus.pending.value),
        updatedAt: Value(DateTime.now()),
      ),
    );
    return count;
  }

  @override
  Future<int> countPending() async {
    final query = _db.selectOnly(_db.syncQueueTable)
      ..addColumns([_db.syncQueueTable.id.count()])
      ..where(_db.syncQueueTable.status.equals(SyncLocalStatus.pending.value));

    final result = await query.getSingle();
    return result.read(_db.syncQueueTable.id.count()) ?? 0;
  }

  SyncOperation _mapRowToEntity(SyncQueueTableData row) {
    final opType = SyncOperationType.fromApiString(row.operationType);
    final payloadJsonMap = jsonDecode(row.payloadJson) as Map<String, dynamic>;

    final SyncOperationPayload payload;
    switch (opType) {
      case SyncOperationType.lessonProgressUpsert:
        payload = LessonProgressSyncPayload.fromJson(payloadJsonMap);
        break;
      case SyncOperationType.studyPlanUpsert:
        payload = StudyPlanSyncPayload.fromJson(payloadJsonMap);
        break;
      case SyncOperationType.notificationMarkRead:
        payload = NotificationReadSyncPayload.fromJson(payloadJsonMap);
        break;
    }

    return SyncOperation(
      id: row.id,
      operationId: row.operationId,
      operationType: opType,
      entityType: row.entityType,
      entityId: row.entityId,
      payload: payload,
      createdAt: row.createdAt,
      retryCount: row.retryCount,
      status: SyncLocalStatus.fromString(row.status),
      lastErrorCode: row.lastErrorCode,
      lastErrorMessage: row.lastErrorMessage,
      nextRetryAt: row.nextRetryAt,
      updatedAt: row.updatedAt,
    );
  }
}

class InMemorySyncLocalDataSource implements SyncLocalDataSource {
  final Map<String, SyncOperation> _store = {};

  @override
  Future<void> enqueue(SyncOperation operation) async {
    _store[operation.operationId] = operation;
  }

  @override
  Future<List<SyncOperation>> listPending({int limit = 50}) async {
    final now = DateTime.now();
    return _store.values
        .where((op) =>
            op.status == SyncLocalStatus.pending &&
            (op.nextRetryAt == null || !op.nextRetryAt!.isAfter(now)))
        .take(limit)
        .toList();
  }

  @override
  Future<void> markProcessing(List<String> operationIds) async {
    for (final id in operationIds) {
      if (_store.containsKey(id)) {
        _store[id] = _store[id]!.copyWith(
          status: SyncLocalStatus.processing,
          updatedAt: DateTime.now(),
        );
      }
    }
  }

  @override
  Future<void> markApplied(String operationId) async {
    if (_store.containsKey(operationId)) {
      _store[operationId] = _store[operationId]!.copyWith(
        status: SyncLocalStatus.applied,
        updatedAt: DateTime.now(),
      );
    }
  }

  @override
  Future<void> markFailed(
    String operationId, {
    required String errorCode,
    required String errorMessage,
    required bool isRetryable,
    required DateTime? nextRetryAt,
  }) async {
    if (_store.containsKey(operationId)) {
      final op = _store[operationId]!;
      _store[operationId] = op.copyWith(
        status: isRetryable ? SyncLocalStatus.pending : SyncLocalStatus.failed,
        retryCount: op.retryCount + 1,
        lastErrorCode: errorCode,
        lastErrorMessage: errorMessage,
        nextRetryAt: nextRetryAt,
        updatedAt: DateTime.now(),
      );
    }
  }

  @override
  Future<void> incrementRetry(
    String operationId, {
    required DateTime nextRetryAt,
    required String errorMessage,
  }) async {
    if (_store.containsKey(operationId)) {
      final op = _store[operationId]!;
      _store[operationId] = op.copyWith(
        status: SyncLocalStatus.pending,
        retryCount: op.retryCount + 1,
        lastErrorMessage: errorMessage,
        nextRetryAt: nextRetryAt,
        updatedAt: DateTime.now(),
      );
    }
  }

  @override
  Future<void> deleteApplied() async {
    _store.removeWhere((_, op) => op.status == SyncLocalStatus.applied);
  }

  @override
  Future<int> restoreStuckProcessing({
    Duration timeout = const Duration(minutes: 5),
  }) async {
    final cutoff = DateTime.now().subtract(timeout);
    int restored = 0;
    for (final id in _store.keys) {
      final op = _store[id]!;
      if (op.status == SyncLocalStatus.processing &&
          !op.updatedAt.isAfter(cutoff)) {
        _store[id] = op.copyWith(
          status: SyncLocalStatus.pending,
          updatedAt: DateTime.now(),
        );
        restored++;
      }
    }
    return restored;
  }

  @override
  Future<int> countPending() async {
    return _store.values
        .where((op) => op.status == SyncLocalStatus.pending)
        .length;
  }
}
