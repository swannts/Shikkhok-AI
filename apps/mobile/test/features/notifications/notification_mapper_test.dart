import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/notifications/data/dto/notification_item_dto.dart';
import 'package:mobile/features/notifications/data/dto/notification_page_dto.dart';
import 'package:mobile/features/notifications/data/mappers/notification_mapper.dart';

void main() {
  group('Notification mapping', () {
    test('parses notification page payload with meta cursor', () {
      final dto = NotificationPageDto.fromJson({
        'data': [
          {
            '_id': 'notif-123',
            'title': 'স্টাডি প্ল্যান তৈরি হয়েছে',
            'body': 'নতুন পরিকল্পনা এখন দেখা যাবে।',
            'type': 'study_plan',
            'isRead': false,
            'createdAt': '2026-08-24T12:30:00.000Z',
          },
        ],
        'meta': {
          'nextCursor': 'cursor-abc',
          'hasNext': true,
        },
      });

      expect(dto.items, hasLength(1));
      expect(dto.nextCursor, 'cursor-abc');
      expect(dto.hasNext, isTrue);

      final domain = NotificationMapper.toDomain(dto.items.first);
      expect(domain.id, 'notif-123');
      expect(domain.title, 'স্টাডি প্ল্যান তৈরি হয়েছে');
      expect(domain.type, 'study_plan');
      expect(domain.isRead, isFalse);
      expect(domain.createdAt, isNotNull);
    });

    test('falls back to safe defaults for incomplete payloads', () {
      final dto = NotificationItemDto.fromJson({});

      expect(dto.id, isEmpty);
      expect(dto.title, isEmpty);
      expect(dto.body, isEmpty);
      expect(dto.type, 'system');
      expect(dto.isRead, isFalse);
      expect(dto.createdAt, isNull);
    });
  });
}
