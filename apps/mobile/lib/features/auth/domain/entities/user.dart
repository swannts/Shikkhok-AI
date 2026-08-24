enum UserRole {
  student,
  parent,
  teacher,
  admin;

  static UserRole fromString(String? role) {
    switch (role?.toLowerCase()) {
      case 'parent':
        return UserRole.parent;
      case 'teacher':
        return UserRole.teacher;
      case 'admin':
        return UserRole.admin;
      case 'student':
      default:
        return UserRole.student;
    }
  }

  String toApiString() {
    switch (this) {
      case UserRole.student:
        return 'student';
      case UserRole.parent:
        return 'parent';
      case UserRole.teacher:
        return 'teacher';
      case UserRole.admin:
        return 'admin';
    }
  }
}

class User {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final UserRole role;
  final String status;
  final String? avatarUrl;
  final DateTime? createdAt;

  const User({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    required this.role,
    this.status = 'active',
    this.avatarUrl,
    this.createdAt,
  });

  bool get isStudent => role == UserRole.student;
  bool get isParent => role == UserRole.parent;
  bool get isTeacher => role == UserRole.teacher;
  bool get isAdmin => role == UserRole.admin;
}
