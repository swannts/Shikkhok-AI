class SubjectDto {
  final String id;
  final String name;
  final String slug;
  final int classLevel;
  final String medium;
  final int curriculumYear;
  final String? description;
  final int order;
  final bool isPublished;

  const SubjectDto({
    required this.id,
    required this.name,
    required this.slug,
    required this.classLevel,
    required this.medium,
    this.curriculumYear = 2026,
    this.description,
    this.order = 0,
    this.isPublished = true,
  });

  factory SubjectDto.fromJson(Map<String, dynamic> json) {
    return SubjectDto(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      slug: (json['slug'] ?? '').toString(),
      classLevel: (json['classLevel'] as num?)?.toInt() ?? 8,
      medium: (json['medium'] ?? 'bangla').toString(),
      curriculumYear: (json['curriculumYear'] as num?)?.toInt() ?? 2026,
      description: json['description'] as String?,
      order: (json['order'] as num?)?.toInt() ?? 0,
      isPublished: json['isPublished'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'slug': slug,
        'classLevel': classLevel,
        'medium': medium,
        'curriculumYear': curriculumYear,
        'description': description,
        'order': order,
        'isPublished': isPublished,
      };
}
