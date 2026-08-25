class Subject {
  final String id;
  final String name;
  final String slug;
  final int classLevel;
  final String medium;
  final int curriculumYear;
  final String? description;
  final int order;
  final bool isPublished;

  const Subject({
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
}
