import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/curriculum/data/repositories/bookmark_repository_impl.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('BookmarkRepositoryImpl Persistence & User Isolation Tests', () {
    late BookmarkRepositoryImpl repository;

    setUp(() async {
      FlutterSecureStorage.setMockInitialValues({});
      await TokenStorage.saveUserMetadata(
        userId: 'user-alice-101',
        userRole: 'student',
      );
      repository = BookmarkRepositoryImpl();
    });

    test('initial state has no bookmarks for new lesson', () async {
      final isBookmarked =
          await repository.isLessonBookmarked('lesson_algebra_1');
      expect(isBookmarked, isFalse);
    });

    test('bookmarkLesson persists and survives repository reconstruction',
        () async {
      await repository.bookmarkLesson('lesson_algebra_1');
      expect(await repository.isLessonBookmarked('lesson_algebra_1'), isTrue);

      // Reopen/recreate repository instance (simulating app restart)
      final newRepoInstance = BookmarkRepositoryImpl();
      final isStillBookmarked =
          await newRepoInstance.isLessonBookmarked('lesson_algebra_1');
      expect(isStillBookmarked, isTrue);
    });

    test('removeLessonBookmark removes persisted bookmark', () async {
      await repository.bookmarkLesson('lesson_algebra_1');
      await repository.bookmarkLesson('lesson_algebra_2');
      expect(await repository.getBookmarkedLessonIds(),
          containsAll(['lesson_algebra_1', 'lesson_algebra_2']));

      await repository.removeLessonBookmark('lesson_algebra_1');
      expect(await repository.isLessonBookmarked('lesson_algebra_1'), isFalse);
      expect(await repository.isLessonBookmarked('lesson_algebra_2'), isTrue);
    });

    test('user isolation: bookmarks of User A are not accessible to User B',
        () async {
      // User Alice bookmarks lesson_algebra_1
      await TokenStorage.saveUserMetadata(
          userId: 'user-alice-101', userRole: 'student');
      await repository.bookmarkLesson('lesson_algebra_1');
      expect(await repository.isLessonBookmarked('lesson_algebra_1'), isTrue);

      // User Bob logs in
      await TokenStorage.saveUserMetadata(
          userId: 'user-bob-202', userRole: 'student');
      final bobRepo = BookmarkRepositoryImpl();
      expect(await bobRepo.isLessonBookmarked('lesson_algebra_1'), isFalse);

      // Bob bookmarks lesson_geometry_1
      await bobRepo.bookmarkLesson('lesson_geometry_1');
      expect(await bobRepo.isLessonBookmarked('lesson_geometry_1'), isTrue);

      // Switch back to Alice
      await TokenStorage.saveUserMetadata(
          userId: 'user-alice-101', userRole: 'student');
      final aliceRepo = BookmarkRepositoryImpl();
      expect(await aliceRepo.isLessonBookmarked('lesson_algebra_1'), isTrue);
      expect(await aliceRepo.isLessonBookmarked('lesson_geometry_1'), isFalse);
    });
  });
}
