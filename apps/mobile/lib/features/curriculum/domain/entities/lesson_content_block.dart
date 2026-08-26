enum LessonContentBlockType {
  heading,
  paragraph,
  formula,
  example,
  importantNote,
  image,
  table,
  citation,
  list,
  quote,
}

extension LessonContentBlockTypeApiValue on LessonContentBlockType {
  String get apiValue => switch (this) {
        LessonContentBlockType.heading => 'heading',
        LessonContentBlockType.paragraph => 'paragraph',
        LessonContentBlockType.formula => 'formula',
        LessonContentBlockType.example => 'example',
        LessonContentBlockType.importantNote => 'important_note',
        LessonContentBlockType.image => 'image',
        LessonContentBlockType.table => 'table',
        LessonContentBlockType.citation => 'citation',
        LessonContentBlockType.list => 'list',
        LessonContentBlockType.quote => 'quote',
      };
}

LessonContentBlockType lessonContentBlockTypeFromApiValue(String value) {
  return switch (value) {
    'heading' => LessonContentBlockType.heading,
    'paragraph' => LessonContentBlockType.paragraph,
    'formula' => LessonContentBlockType.formula,
    'example' => LessonContentBlockType.example,
    'important_note' => LessonContentBlockType.importantNote,
    'image' => LessonContentBlockType.image,
    'table' => LessonContentBlockType.table,
    'citation' => LessonContentBlockType.citation,
    'list' => LessonContentBlockType.list,
    'quote' => LessonContentBlockType.quote,
    _ => LessonContentBlockType.paragraph,
  };
}

enum LessonImportantNoteSeverity {
  info,
  warning,
  tip,
}

extension LessonImportantNoteSeverityApiValue on LessonImportantNoteSeverity {
  String get apiValue => switch (this) {
        LessonImportantNoteSeverity.info => 'info',
        LessonImportantNoteSeverity.warning => 'warning',
        LessonImportantNoteSeverity.tip => 'tip',
      };
}

LessonImportantNoteSeverity lessonImportantNoteSeverityFromApiValue(
  String value,
) {
  return switch (value) {
    'info' => LessonImportantNoteSeverity.info,
    'warning' => LessonImportantNoteSeverity.warning,
    'tip' => LessonImportantNoteSeverity.tip,
    _ => LessonImportantNoteSeverity.info,
  };
}

abstract class LessonContentBlock {
  final String id;
  final LessonContentBlockType type;
  final int order;

  const LessonContentBlock({
    required this.id,
    required this.type,
    required this.order,
  });

  Map<String, dynamic> toJson();
}

class LessonHeadingContentBlock extends LessonContentBlock {
  final String text;
  final int level;

  const LessonHeadingContentBlock({
    required super.id,
    required super.order,
    required this.text,
    required this.level,
  }) : super(type: LessonContentBlockType.heading);

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'text': text,
        'level': level,
      };
}

class LessonParagraphContentBlock extends LessonContentBlock {
  final String text;

  const LessonParagraphContentBlock({
    required super.id,
    required super.order,
    required this.text,
  }) : super(type: LessonContentBlockType.paragraph);

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'text': text,
      };
}

class LessonFormulaContentBlock extends LessonContentBlock {
  final String expression;
  final String? description;

  const LessonFormulaContentBlock({
    required super.id,
    required super.order,
    required this.expression,
    this.description,
  }) : super(type: LessonContentBlockType.formula);

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'expression': expression,
        'description': description,
      };
}

class LessonExampleContentBlock extends LessonContentBlock {
  final String? title;
  final String body;
  final String? solution;

  const LessonExampleContentBlock({
    required super.id,
    required super.order,
    this.title,
    required this.body,
    this.solution,
  }) : super(type: LessonContentBlockType.example);

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

class LessonImportantNoteContentBlock extends LessonContentBlock {
  final String? title;
  final String text;
  final LessonImportantNoteSeverity severity;

  const LessonImportantNoteContentBlock({
    required super.id,
    required super.order,
    this.title,
    required this.text,
    required this.severity,
  }) : super(type: LessonContentBlockType.importantNote);

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

class LessonImageContentBlock extends LessonContentBlock {
  final String url;
  final String altText;
  final String? caption;

  const LessonImageContentBlock({
    required super.id,
    required super.order,
    required this.url,
    required this.altText,
    this.caption,
  }) : super(type: LessonContentBlockType.image);

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

class LessonTableContentBlock extends LessonContentBlock {
  final List<String> headers;
  final List<List<String>> rows;

  const LessonTableContentBlock({
    required super.id,
    required super.order,
    required this.headers,
    required this.rows,
  }) : super(type: LessonContentBlockType.table);

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'headers': headers,
        'rows': rows,
      };
}

class LessonCitationContentBlock extends LessonContentBlock {
  final String bookName;
  final String? chapter;
  final String? page;
  final String? excerpt;

  const LessonCitationContentBlock({
    required super.id,
    required super.order,
    required this.bookName,
    this.chapter,
    this.page,
    this.excerpt,
  }) : super(type: LessonContentBlockType.citation);

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

class LessonListContentBlock extends LessonContentBlock {
  final List<String> items;
  final bool ordered;

  const LessonListContentBlock({
    required super.id,
    required super.order,
    required this.items,
    this.ordered = false,
  }) : super(type: LessonContentBlockType.list);

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'items': items,
        'ordered': ordered,
      };
}

class LessonQuoteContentBlock extends LessonContentBlock {
  final String text;
  final String? attribution;

  const LessonQuoteContentBlock({
    required super.id,
    required super.order,
    required this.text,
    this.attribution,
  }) : super(type: LessonContentBlockType.quote);

  @override
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.apiValue,
        'order': order,
        'text': text,
        'attribution': attribution,
      };
}

List<LessonContentBlock> sortLessonContentBlocks(
  Iterable<LessonContentBlock> blocks,
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
