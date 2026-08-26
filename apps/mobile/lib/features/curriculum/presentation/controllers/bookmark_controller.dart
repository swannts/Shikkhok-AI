import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/repositories/bookmark_repository.dart';
import '../../data/repositories/bookmark_repository_impl.dart';

final bookmarkRepositoryProvider = Provider<BookmarkRepository>((ref) {
  return BookmarkRepositoryImpl();
});

class LessonBookmarkNotifier extends StateNotifier<AsyncValue<bool>> {
  final BookmarkRepository _repository;
  final String _lessonId;

  LessonBookmarkNotifier(this._repository, this._lessonId)
      : super(const AsyncValue.loading()) {
    _loadState();
  }

  Future<void> _loadState() async {
    try {
      final isBookmarked = await _repository.isLessonBookmarked(_lessonId);
      state = AsyncValue.data(isBookmarked);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<bool> toggleBookmark() async {
    final current = state.valueOrNull ?? false;
    final next = !current;
    state = AsyncValue.data(next);
    try {
      if (next) {
        await _repository.bookmarkLesson(_lessonId);
      } else {
        await _repository.removeLessonBookmark(_lessonId);
      }
      return true;
    } catch (_) {
      state = AsyncValue.data(current);
      return false;
    }
  }
}

final isLessonBookmarkedProvider = StateNotifierProvider.family<
    LessonBookmarkNotifier, AsyncValue<bool>, String>((ref, lessonId) {
  final repo = ref.watch(bookmarkRepositoryProvider);
  return LessonBookmarkNotifier(repo, lessonId);
});
