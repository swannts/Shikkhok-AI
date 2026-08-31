import 'dart:async';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../dto/textbook_manifest_dto.dart';
import '../../domain/entities/download_task.dart';

class TextbookDownloadManager {
  final ApiClient _apiClient;
  final Map<String, DownloadTask> _tasks = {};
  final Map<String, CancelToken> _cancelTokens = {};
  final _tasksStreamController =
      StreamController<Map<String, DownloadTask>>.broadcast();

  TextbookDownloadManager(this._apiClient);

  Stream<Map<String, DownloadTask>> get tasksStream =>
      _tasksStreamController.stream;
  Map<String, DownloadTask> get currentTasks => Map.unmodifiable(_tasks);

  Future<String> _getTextbooksDirectory() async {
    final docsDir = await getApplicationDocumentsDirectory();
    final textbooksDir = Directory('${docsDir.path}/offline_textbooks');
    if (!await textbooksDir.exists()) {
      await textbooksDir.create(recursive: true);
    }
    return textbooksDir.path;
  }

  Future<String> _getLocalFilePath(String textbookId) async {
    final dir = await _getTextbooksDirectory();
    return '$dir/$textbookId.pdf';
  }

  Future<List<TextbookItemDto>> fetchTextbooks({
    int? classLevel,
    String? medium,
    int? curriculumYear,
  }) async {
    final res = await _apiClient.dio.get(
      ApiEndpoints.textbooks,
      queryParameters: {
        if (classLevel != null) 'classLevel': classLevel,
        if (medium != null) 'medium': medium,
        if (curriculumYear != null) 'curriculumYear': curriculumYear,
      },
    );

    final data = res.data;
    final listData = data is Map && data['data'] != null ? data['data'] : data;
    if (listData is List) {
      return listData
          .map((e) => TextbookItemDto.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<List<TextbookItemDto>> fetchManifestBundle({
    int? classLevel,
    String? medium,
    int? curriculumYear,
  }) async {
    final res = await _apiClient.dio.get(
      ApiEndpoints.textbookManifestBundle,
      queryParameters: {
        if (classLevel != null) 'classLevel': classLevel,
        if (medium != null) 'medium': medium,
        if (curriculumYear != null) 'curriculumYear': curriculumYear,
      },
    );

    final data = res.data;
    final bundle = data is Map && data['data'] != null ? data['data'] : data;
    if (bundle is Map && bundle['textbooks'] is List) {
      final List textbooksList = bundle['textbooks'];
      final List manifestsList =
          bundle['manifests'] is List ? bundle['manifests'] : [];
      final manifestMap = {
        for (var m in manifestsList) (m['textbookId'] ?? '').toString(): m
      };

      return textbooksList.map((tb) {
        final id = (tb['_id'] ?? tb['id'] ?? '').toString();
        final manifestJson = manifestMap[id];
        final modifiedTb =
            Map<String, dynamic>.from(tb as Map<String, dynamic>);
        if (manifestJson != null) {
          modifiedTb['manifest'] = manifestJson;
        }
        return TextbookItemDto.fromJson(modifiedTb);
      }).toList();
    }
    return [];
  }

  Future<DownloadTask> downloadTextbook(
    TextbookItemDto book, {
    void Function(DownloadTask)? onProgress,
  }) async {
    final localPath = await _getLocalFilePath(book.id);
    final file = File(localPath);

    final downloadUrl = book.latestManifest?.packageUrl.isNotEmpty == true
        ? book.latestManifest!.packageUrl
        : (book.pdfUrl ?? '');
    final expectedChecksum =
        book.latestManifest?.checksumSha256 ?? book.checksumSha256 ?? '';

    final totalBytes =
        book.latestManifest?.downloadSizeBytes ?? book.fileSizeBytes ?? 0;

    var task = DownloadTask(
      textbookId: book.id,
      title: book.title,
      subjectId: book.subjectId,
      classLevel: book.classLevel,
      downloadUrl: downloadUrl,
      totalBytes: totalBytes,
      status: downloadUrl.isEmpty
          ? DownloadStatus.failed
          : DownloadStatus.downloading,
      localFilePath: localPath,
      expectedChecksumSha256: expectedChecksum,
      errorMessage: downloadUrl.isEmpty
          ? 'Textbook ${book.id} does not have a downloadable URL'
          : null,
    );

    _tasks[book.id] = task;
    _notifyUpdate();
    onProgress?.call(task);

    if (downloadUrl.isEmpty) {
      return task;
    }

    final cancelToken = CancelToken();
    _cancelTokens[book.id] = cancelToken;

    try {
      if (await file.exists()) {
        final cachedChecksum = await _computeSha256Checksum(file);
        if (expectedChecksum.isNotEmpty &&
            cachedChecksum == expectedChecksum.toLowerCase()) {
          task = task.copyWith(
            bytesDownloaded: totalBytes,
            status: DownloadStatus.completed,
            isChecksumVerified: true,
            actualChecksumSha256: cachedChecksum,
            completedAt: DateTime.now(),
          );
          _tasks[book.id] = task;
          _notifyUpdate();
          onProgress?.call(task);
          return task;
        }

        // A stale or partial file is unsafe to resume because Dio writes from the start.
        await file.delete();
      }

      await _apiClient.dio.download(
        downloadUrl,
        localPath,
        cancelToken: cancelToken,
        options: Options(responseType: ResponseType.bytes),
        onReceiveProgress: (received, total) {
          task = task.copyWith(
            bytesDownloaded: received,
            totalBytes: total > 0 ? total : totalBytes,
            status: DownloadStatus.downloading,
          );
          _tasks[book.id] = task;
          _notifyUpdate();
          onProgress?.call(task);
        },
      );

      // Verify SHA-256 Checksum after download
      task = task.copyWith(status: DownloadStatus.verifying);
      _tasks[book.id] = task;
      _notifyUpdate();
      onProgress?.call(task);

      final checksumResult = await _computeSha256Checksum(file);
      final isChecksumValid = expectedChecksum.isEmpty ||
          checksumResult.toLowerCase() == expectedChecksum.toLowerCase();

      if (!isChecksumValid) {
        await file.delete();
        task = task.copyWith(
          status: DownloadStatus.failed,
          actualChecksumSha256: checksumResult,
          errorMessage: 'Checksum verification failed for downloaded textbook',
        );
      } else {
        task = task.copyWith(
          status: DownloadStatus.completed,
          isChecksumVerified: true,
          actualChecksumSha256: checksumResult,
          bytesDownloaded: totalBytes,
          completedAt: DateTime.now(),
        );
      }

      _tasks[book.id] = task;
      _notifyUpdate();
      onProgress?.call(task);
      return task;
    } catch (e) {
      if (e is DioException && CancelToken.isCancel(e)) {
        task = task.copyWith(status: DownloadStatus.paused);
      } else {
        task = task.copyWith(
          status: DownloadStatus.failed,
          errorMessage: e.toString(),
        );
      }
      _tasks[book.id] = task;
      _notifyUpdate();
      onProgress?.call(task);
      return task;
    } finally {
      _cancelTokens.remove(book.id);
    }
  }

  void pauseDownload(String textbookId) {
    if (_cancelTokens.containsKey(textbookId)) {
      _cancelTokens[textbookId]!.cancel('Paused by user');
      _cancelTokens.remove(textbookId);
      if (_tasks.containsKey(textbookId)) {
        _tasks[textbookId] =
            _tasks[textbookId]!.copyWith(status: DownloadStatus.paused);
        _notifyUpdate();
      }
    }
  }

  Future<bool> deleteDownloadedTextbook(String textbookId) async {
    final localPath = await _getLocalFilePath(textbookId);
    final file = File(localPath);
    if (await file.exists()) {
      await file.delete();
    }
    _tasks.remove(textbookId);
    _notifyUpdate();
    return true;
  }

  Future<int> getOfflineStorageUsageBytes() async {
    try {
      final dirPath = await _getTextbooksDirectory();
      final dir = Directory(dirPath);
      if (!await dir.exists()) return 0;

      int totalBytes = 0;
      await for (final file in dir.list(recursive: true, followLinks: false)) {
        if (file is File) {
          totalBytes += await file.length();
        }
      }
      return totalBytes;
    } catch (_) {
      return 0;
    }
  }

  Future<String> _computeSha256Checksum(File file) async {
    if (!await file.exists()) return '';
    final bytes = await file.readAsBytes();
    return sha256.convert(bytes).toString().toLowerCase();
  }

  void _notifyUpdate() {
    if (!_tasksStreamController.isClosed) {
      _tasksStreamController.add(Map.unmodifiable(_tasks));
    }
  }

  void dispose() {
    _tasksStreamController.close();
  }
}
