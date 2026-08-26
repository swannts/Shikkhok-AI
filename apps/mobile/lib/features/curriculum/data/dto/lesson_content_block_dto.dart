import '../../domain/entities/lesson_content_block.dart';

abstract class LessonContentBlockDto {
  final String id;
  final LessonContentBlockType type;
  final int order;

  const LessonContentBlockDto({
    required this.id,
    required this.type,
    required this.order,
  });

  LessonContentBlock toDomain();

  Map<String, dynamic> toJson();

  factory LessonContentBlockDto.fromJson(Map<String, dynamic> json) {
    final type = lessonContentBlockTypeFromApiValue(
      (json['type'] ?? 'paragraph').toString(),
    );
    final id = (json['id'] ?? '').toString();
    final order = (json['order'] as num?)?.toInt() ?? 0;

    return switch (type) {
      LessonContentBlockType.heading => LessonHeadingContentBlockDto(
          id: id,
          order: order,
          text: (json['text'] ?? '').toString(),
          level: (json['level'] as num?)?.toInt() ?? 1,
        ),
      LessonContentBlockType.paragraph => LessonParagraphContentBlockDto(
          id: id,
          order: order,
          text: (json['text'] ?? '').toString(),
        ),
      LessonContentBlockType.formula => LessonFormulaContentBlockDto(
          id: id,
          order: order,
          expression: (json['expression'] ?? '').toString(),
          description: json['description']?.toString(),
        ),
      LessonContentBlockType.example => LessonExampleContentBlockDto(
          id: id,
          order: order,
          title: json['title']?.toString(),
          body: (json['body'] ?? '').toString(),
          solution: json['solution']?.toString(),
        ),
      LessonContentBlockType.importantNote =>
        LessonImportantNoteContentBlockDto(
          id: id,
          order: order,
          title: json['title']?.toString(),
          text: (json['text'] ?? '').toString(),
          severity: lessonImportantNoteSeverityFromApiValue(
            (json['severity'] ?? 'info').toString(),
          ),
        ),
      LessonContentBlockType.image => LessonImageContentBlockDto(
          id: id,
          order: order,
          url: (json['url'] ?? '').toString(),
          altText: (json['altText'] ?? '').toString(),
          caption: json['caption']?.toString(),
        ),
      LessonContentBlockType.table => LessonTableContentBlockDto(
          id: id,
          order: order,
          headers: (json['headers'] as List<dynamic>? ?? const [])
              .map((item) => item.toString())
              .toList(growable: false),
          rows: (json['rows'] as List<dynamic>? ?? const [])
              .map(
                (row) => (row as List<dynamic>)
                    .map((cell) => cell.toString())
                    .toList(growable: false),
              )
              .toList(growable: false),
        ),
      LessonContentBlockType.citation => LessonCitationContentBlockDto(
          id: id,
          order: order,
          bookName: (json['bookName'] ?? '').toString(),
          chapter: json['chapter']?.toString(),
          page: json['page']?.toString(),
          excerpt: json['excerpt']?.toString(),
        ),
      LessonContentBlockType.list => LessonListContentBlockDto(
          id: id,
          order: order,
          items: (json['items'] as List<dynamic>? ?? const [])
              .map((item) => item.toString())
              .toList(growable: false),
          ordered: json['ordered'] as bool? ?? false,
        ),
      LessonContentBlockType.quote => LessonQuoteContentBlockDto(
          id: id,
          order: order,
          text: (json['text'] ?? '').toString(),
          attribution: json['attribution']?.toString(),
        ),
    };
  }
}

class LessonHeadingContentBlockDto extends LessonContentBlockDto {
  final String text;
  final int level;

  const LessonHeadingContentBlockDto({
    required super.id,
    required super.order,
    required this.text,
    required this.level,
  }) : super(type: LessonContentBlockType.heading);

  @override
  LessonContentBlock toDomain() => LessonHeadingContentBlock(
        id: id,
        order: order,
        text: text,
        level: level,
      );

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'text': text,
        'level': level,
      };
}

class LessonParagraphContentBlockDto extends LessonContentBlockDto {
  final String text;

  const LessonParagraphContentBlockDto({
    required super.id,
    required super.order,
    required this.text,
  }) : super(type: LessonContentBlockType.paragraph);

  @override
  LessonContentBlock toDomain() => LessonParagraphContentBlock(
        id: id,
        order: order,
        text: text,
      );

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'text': text,
      };
}

class LessonFormulaContentBlockDto extends LessonContentBlockDto {
  final String expression;
  final String? description;

  const LessonFormulaContentBlockDto({
    required super.id,
    required super.order,
    required this.expression,
    this.description,
  }) : super(type: LessonContentBlockType.formula);

  @override
  LessonContentBlock toDomain() => LessonFormulaContentBlock(
        id: id,
        order: order,
        expression: expression,
        description: description,
      );

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'expression': expression,
        'description': description,
      };
}

class LessonExampleContentBlockDto extends LessonContentBlockDto {
  final String? title;
  final String body;
  final String? solution;

  const LessonExampleContentBlockDto({
    required super.id,
    required super.order,
    this.title,
    required this.body,
    this.solution,
  }) : super(type: LessonContentBlockType.example);

  @override
  LessonContentBlock toDomain() => LessonExampleContentBlock(
        id: id,
        order: order,
        title: title,
        body: body,
        solution: solution,
      );

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'title': title,
        'body': body,
        'solution': solution,
      };
}

class LessonImportantNoteContentBlockDto extends LessonContentBlockDto {
  final String? title;
  final String text;
  final LessonImportantNoteSeverity severity;

  const LessonImportantNoteContentBlockDto({
    required super.id,
    required super.order,
    this.title,
    required this.text,
    required this.severity,
  }) : super(type: LessonContentBlockType.importantNote);

  @override
  LessonContentBlock toDomain() => LessonImportantNoteContentBlock(
        id: id,
        order: order,
        title: title,
        text: text,
        severity: severity,
      );

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'title': title,
        'text': text,
        'severity': severity.apiValue,
      };
}

class LessonImageContentBlockDto extends LessonContentBlockDto {
  final String url;
  final String altText;
  final String? caption;

  const LessonImageContentBlockDto({
    required super.id,
    required super.order,
    required this.url,
    required this.altText,
    this.caption,
  }) : super(type: LessonContentBlockType.image);

  @override
  LessonContentBlock toDomain() => LessonImageContentBlock(
        id: id,
        order: order,
        url: url,
        altText: altText,
        caption: caption,
      );

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'url': url,
        'altText': altText,
        'caption': caption,
      };
}

class LessonTableContentBlockDto extends LessonContentBlockDto {
  final List<String> headers;
  final List<List<String>> rows;

  const LessonTableContentBlockDto({
    required super.id,
    required super.order,
    required this.headers,
    required this.rows,
  }) : super(type: LessonContentBlockType.table);

  @override
  LessonContentBlock toDomain() => LessonTableContentBlock(
        id: id,
        order: order,
        headers: headers,
        rows: rows,
      );

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'headers': headers,
        'rows': rows,
      };
}

class LessonCitationContentBlockDto extends LessonContentBlockDto {
  final String bookName;
  final String? chapter;
  final String? page;
  final String? excerpt;

  const LessonCitationContentBlockDto({
    required super.id,
    required super.order,
    required this.bookName,
    this.chapter,
    this.page,
    this.excerpt,
  }) : super(type: LessonContentBlockType.citation);

  @override
  LessonContentBlock toDomain() => LessonCitationContentBlock(
        id: id,
        order: order,
        bookName: bookName,
        chapter: chapter,
        page: page,
        excerpt: excerpt,
      );

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'bookName': bookName,
        'chapter': chapter,
        'page': page,
        'excerpt': excerpt,
      };
}

class LessonListContentBlockDto extends LessonContentBlockDto {
  final List<String> items;
  final bool ordered;

  const LessonListContentBlockDto({
    required super.id,
    required super.order,
    required this.items,
    this.ordered = false,
  }) : super(type: LessonContentBlockType.list);

  @override
  LessonContentBlock toDomain() => LessonListContentBlock(
        id: id,
        order: order,
        items: items,
        ordered: ordered,
      );

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'items': items,
        'ordered': ordered,
      };
}

class LessonQuoteContentBlockDto extends LessonContentBlockDto {
  final String text;
  final String? attribution;

  const LessonQuoteContentBlockDto({
    required super.id,
    required super.order,
    required this.text,
    this.attribution,
  }) : super(type: LessonContentBlockType.quote);

  @override
  LessonContentBlock toDomain() => LessonQuoteContentBlock(
        id: id,
        order: order,
        text: text,
        attribution: attribution,
      );

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'text': text,
        'attribution': attribution,
      };
}

List<LessonContentBlockDto> sortLessonContentBlockDtos(
  Iterable<LessonContentBlockDto> blocks,
) {
  final indexed = blocks.toList().asMap().entries.toList();
  indexed.sort((left, right) {
    final orderDiff = left.value.order.compareTo(right.value.order);
    if (orderDiff != 0) {
      return orderDiff;
    }
    final idDiff = left.value.id.compareTo(right.value.id);
    if (idDiff != 0) {
      return idDiff;
    }
    return left.key.compareTo(right.key);
  });
  return indexed.map((entry) => entry.value).toList(growable: false);
}
