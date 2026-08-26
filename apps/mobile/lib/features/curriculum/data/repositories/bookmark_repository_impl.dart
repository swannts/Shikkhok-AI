import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/storage/token_storage.dart';
import '../../domain/repositories/bookmark_repository.dart';

class BookmarkRepositoryImpl implements BookmarkRepository {
  final FlutterSecureStorage _storage;

  BookmarkRepositoryImpl({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock,
              ),
            );

  Future<String> _getStorageKey() async {
    final userId = await TokenStorage.getUserId();
    final safeUser = (userId != null && userId.trim().isNotEmpty)
        ? userId.trim()
        : 'guest_user';
    return 'shikkhok_bookmarks_$safeUser';
  }

  @override
  Future<Set<String>> getBookmarkedLessonIds() async {
    try {
      final key = await _getStorageKey();
      final raw = await _storage.read(key: key);
      if (raw == null || raw.trim().isEmpty) {
        return <String>{};
      }
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return decoded.map((e) => e.toString()).toSet();
      }
      return <String>{};
    } catch (_) {
      return <String>{};
    }
  }

  @override
  Future<bool> isLessonBookmarked(String lessonId) async {
    final set = await getBookmarkedLessonIds();
    return set.contains(lessonId);
  }

  @override
  Future<void> bookmarkLesson(String lessonId) async {
    final key = await _getStorageKey();
    final set = await getBookmarkedLessonIds();
    set.add(lessonId);
    await _storage.write(key: key, value: jsonEncode(set.toList()));
  }

  @override
  Future<void> removeLessonBookmark(String lessonId) async {
    final key = await _getStorageKey();
    final set = await getBookmarkedLessonIds();
    set.remove(lessonId);
    await _storage.write(key: key, value: jsonEncode(set.toList()));
  }

  @override
  Future<void> clearUserBookmarks() async {
    final key = await _getStorageKey();
    await _storage.delete(key: key);
  }
}
