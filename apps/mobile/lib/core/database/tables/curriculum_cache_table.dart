import 'package:drift/drift.dart';

class CurriculumCacheTable extends Table {
  TextColumn get cacheKey => text()();
  TextColumn get entityType => text()();
  TextColumn get payload => text()();
  DateTimeColumn get fetchedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {cacheKey};

  @override
  List<String> get customConstraints => [
        'UNIQUE (entity_type, cache_key)',
      ];
}
