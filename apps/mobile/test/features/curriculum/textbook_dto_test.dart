import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/curriculum/data/dto/textbook_manifest_dto.dart';

void main() {
  test('reads curriculum version from textbook API metadata', () {
    final textbook = TextbookItemDto.fromJson({
      '_id': 'book-1',
      'title': 'আমার বাংলা বই',
      'subjectId': 'subject-1',
      'classLevel': 3,
      'medium': 'bangla',
      'curriculumYear': 2026,
      'curriculumVersion': '2026-NCTB',
    });

    expect(textbook.curriculumVersion, '2026-NCTB');
  });
}
