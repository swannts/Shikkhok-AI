class UserDto {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String role;
  final String status;
  final String? avatarUrl;
  final String? createdAt;
  final String? updatedAt;

  const UserDto({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.role = 'student',
    this.status = 'active',
    this.avatarUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory UserDto.fromJson(Map<String, dynamic> json) {
    return UserDto(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: json['name'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      role: json['role'] as String? ?? 'student',
      status: json['status'] as String? ?? 'active',
      avatarUrl: json['avatarUrl'] as String?,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'role': role,
        'status': status,
        'avatarUrl': avatarUrl,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };
}
