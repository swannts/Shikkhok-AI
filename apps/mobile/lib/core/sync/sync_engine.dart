import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../database/app_database.dart';
import '../network/api_client.dart';
import '../network/connectivity_provider.dart';
import 'package:drift/drift.dart';

enum SyncStatus { pending, syncing, synced, failed }

class SyncEngine {
  final AppDatabase _db;
  final ApiClient _apiClient;
  bool _isSyncing = false;

  SyncEngine(this._db, this._apiClient);

  Future<void> enqueueMutation({
    required String operationType,
    required String entityType,
    String? entityId,
    required Map<String, dynamic> payload,
  }) async {
    final operationId = const Uuid().v4();
    await _db.into(_db.syncQueueTable).insert(
          SyncQueueTableCompanion.insert(
            operationId: operationId,
            operationType: operationType,
            entityType: entityType,
            entityId: Value(entityId),
            payloadJson: jsonEncode(payload),
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
            status: const Value('pending'),
          ),
        );
  }

  Future<void> syncPendingMutations() async {
    if (_isSyncing) return;
    _isSyncing = true;

    try {
      final pendingOperations = await (_db.select(_db.syncQueueTable)
            ..where((tbl) =>
                tbl.status.equals('pending') | tbl.status.equals('failed'))
            ..where((tbl) =>
                tbl.nextRetryAt.isNull() |
                tbl.nextRetryAt.isSmallerOrEqualValue(DateTime.now()))
            ..orderBy([(tbl) => OrderingTerm.asc(tbl.createdAt)]))
          .get();

      for (final op in pendingOperations) {
        await _processOperation(op);
      }
    } finally {
      _isSyncing = false;
    }
  }

  Future<void> _processOperation(SyncQueueTableData op) async {
    // Mark as syncing
    await (_db.update(_db.syncQueueTable)..where((tbl) => tbl.id.equals(op.id)))
        .write(
      SyncQueueTableCompanion(
        status: const Value('syncing'),
        updatedAt: Value(DateTime.now()),
      ),
    );

    try {
      final payload = jsonDecode(op.payloadJson);

      // We route operations based on their type and entity
      if (op.entityType == 'practice_attempt') {
        if (op.operationType == 'create') {
          await _apiClient.dio.post('/api/v1/practice/attempt', data: payload);
        }
      } else if (op.entityType == 'lesson_progress') {
        if (op.operationType == 'update') {
          await _apiClient.dio
              .patch('/api/v1/progress/lesson/${op.entityId}', data: payload);
        }
      } else {
        // Unhandled operation
        throw Exception(
            'Unhandled sync operation: ${op.entityType} ${op.operationType}');
      }

      // Success, remove from queue or mark synced
      await (_db.delete(_db.syncQueueTable)
            ..where((tbl) => tbl.id.equals(op.id)))
          .go();
    } catch (e) {
      // Failed, calculate backoff and update status
      final newRetryCount = op.retryCount + 1;
      final backoffSeconds =
          newRetryCount * newRetryCount * 5; // Simple exponential backoff
      final nextRetry = DateTime.now().add(Duration(seconds: backoffSeconds));

      await (_db.update(_db.syncQueueTable)
            ..where((tbl) => tbl.id.equals(op.id)))
          .write(
        SyncQueueTableCompanion(
          status: const Value('failed'),
          retryCount: Value(newRetryCount),
          lastErrorMessage: Value(e.toString()),
          nextRetryAt: Value(nextRetry),
          updatedAt: Value(DateTime.now()),
        ),
      );
    }
  }
}

final syncEngineProvider = Provider<SyncEngine>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return SyncEngine(appDatabase, apiClient);
});

// A provider that automatically triggers sync when coming back online
final autoSyncProvider = Provider<void>((ref) {
  final isOnline = ref.watch(isOnlineProvider);
  if (isOnline) {
    ref.read(syncEngineProvider).syncPendingMutations();
  }
});
