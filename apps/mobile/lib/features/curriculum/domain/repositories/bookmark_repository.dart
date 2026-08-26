import 'dart:async';

abstract interface class BookmarkRepository {
  Future<bool> isLessonBookmarked(String lessonId);
  Future<void> bookmarkLesson(String lessonId);
  Future<void> removeLessonBookmark(String lessonId);
  Future<Set<String>> getBookmarkedLessonIds();
  Future<void> clearUserBookmarks();
}
