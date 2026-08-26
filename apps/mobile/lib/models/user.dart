class StudentProfile {
  final String id;
  final String userId;
  final String name;
  final String classId;
  final String className;
  final String language;

  StudentProfile({
    required this.id,
    required this.userId,
    required this.name,
    required this.classId,
    required this.className,
    required this.language,
  });

  factory StudentProfile.fromJson(Map<String, dynamic> json) {
    return StudentProfile(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      name: json['name'] ?? 'শিক্ষার্থী',
      classId: json['classId'] ?? '',
      className: json['className'] ?? '',
      language: json['language'] ?? 'bn',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'name': name,
        'classId': classId,
        'className': className,
        'language': language,
      };
}
