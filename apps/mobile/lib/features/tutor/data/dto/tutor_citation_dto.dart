class TutorCitationDto {
  final String? sourceId;
  final String sourceBook;
  final int? classLevel;
  final String? subject;
  final String? chapter;
  final int? pageNumber;
  final String? excerpt;
  final String? sourceUrl;

  const TutorCitationDto({
    required this.sourceId,
    required this.sourceBook,
    required this.classLevel,
    required this.subject,
    required this.chapter,
    required this.pageNumber,
    required this.excerpt,
    required this.sourceUrl,
  });

  factory TutorCitationDto.fromJson(Map<String, dynamic> json) {
    int? parseInt(dynamic value) {
      if (value is num) {
        return value.toInt();
      }
      return int.tryParse(value?.toString() ?? '');
    }

    return TutorCitationDto(
      sourceId: json['sourceId']?.toString(),
      sourceBook: (json['sourceBook'] ?? '').toString(),
      classLevel: parseInt(json['classLevel']),
      subject: json['subject']?.toString(),
      chapter: json['chapter']?.toString(),
      pageNumber: parseInt(json['pageNumber']),
      excerpt: json['excerpt']?.toString(),
      sourceUrl: json['sourceUrl']?.toString(),
    );
  }
}
