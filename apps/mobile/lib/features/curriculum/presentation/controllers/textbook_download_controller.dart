import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/datasources/textbook_download_manager.dart';
import '../../data/dto/textbook_manifest_dto.dart';
import '../../domain/entities/download_task.dart';

final textbookDownloadManagerProvider = Provider<TextbookDownloadManager>((ref) {
  final apiClient = ApiClient();
  final manager = TextbookDownloadManager(apiClient);
  ref.onDispose(() => manager.dispose());
  return manager;
});

class OfflineTextbooksState {
  final bool isLoading;
  final List<TextbookItemDto> availableTextbooks;
  final Map<String, DownloadTask> activeDownloads;
  final int storageUsedBytes;
  final String? errorMessage;

  const OfflineTextbooksState({
    this.isLoading = false,
    this.availableTextbooks = const [],
    this.activeDownloads = const {},
    this.storageUsedBytes = 0,
    this.errorMessage,
  });

  OfflineTextbooksState copyWith({
    bool? isLoading,
    List<TextbookItemDto>? availableTextbooks,
    Map<String, DownloadTask>? activeDownloads,
    int? storageUsedBytes,
    String? errorMessage,
  }) {
    return OfflineTextbooksState(
      isLoading: isLoading ?? this.isLoading,
      availableTextbooks: availableTextbooks ?? this.availableTextbooks,
      activeDownloads: activeDownloads ?? this.activeDownloads,
      storageUsedBytes: storageUsedBytes ?? this.storageUsedBytes,
      errorMessage: errorMessage,
    );
  }
}

class OfflineTextbooksNotifier extends StateNotifier<OfflineTextbooksState> {
  final TextbookDownloadManager _manager;
  StreamSubscription? _tasksSub;

  OfflineTextbooksNotifier(this._manager) : super(const OfflineTextbooksState()) {
    _init();
  }

  void _init() {
    _tasksSub = _manager.tasksStream.listen((tasks) {
      state = state.copyWith(activeDownloads: tasks);
      _updateStorage();
    });
    loadTextbooks();
  }

  Future<void> loadTextbooks({int? classLevel, String? medium}) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final textbooks = await _manager.fetchManifestBundle(
        classLevel: classLevel ?? 8,
        medium: medium ?? 'bangla',
      );
      final storage = await _manager.getOfflineStorageUsageBytes();
      state = state.copyWith(
        isLoading: false,
        availableTextbooks: textbooks,
        storageUsedBytes: storage,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to load textbook manifests: $e',
      );
    }
  }

  Future<void> downloadBook(TextbookItemDto book) async {
    await _manager.downloadTextbook(book);
    await _updateStorage();
  }

  Future<void> downloadAllForGrade() async {
    for (final book in state.availableTextbooks) {
      final existingTask = state.activeDownloads[book.id];
      if (existingTask == null || existingTask.status != DownloadStatus.completed) {
        await _manager.downloadTextbook(book);
      }
    }
    await _updateStorage();
  }

  void pauseDownload(String textbookId) {
    _manager.pauseDownload(textbookId);
  }

  Future<void> deleteBook(String textbookId) async {
    await _manager.deleteDownloadedTextbook(textbookId);
    await _updateStorage();
  }

  Future<void> _updateStorage() async {
    final storage = await _manager.getOfflineStorageUsageBytes();
    state = state.copyWith(storageUsedBytes: storage);
  }

  @override
  void dispose() {
    _tasksSub?.cancel();
    super.dispose();
  }
}

final offlineTextbooksProvider =
    StateNotifierProvider<OfflineTextbooksNotifier, OfflineTextbooksState>((ref) {
  final manager = ref.watch(textbookDownloadManagerProvider);
  return OfflineTextbooksNotifier(manager);
});
