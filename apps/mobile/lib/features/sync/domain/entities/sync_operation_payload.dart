import 'dart:convert';

enum SyncOperationType {
  lessonProgressUpsert('lesson_progress.upsert'),
  studyPlanUpsert('study_plan.upsert'),
  notificationMarkRead('notification.mark_read');

  final String apiValue;
  const SyncOperationType(this.apiValue);

  static SyncOperationType fromApiString(String value) {
    for (final type in SyncOperationType.values) {
      if (type.apiValue == value) {
        return type;
      }
    }
    throw ArgumentError('Unsupported sync operation type: $value');
  }

  String toApiString() => apiValue;
}

abstract class SyncOperationPayload {
  Map<String, dynamic> toJson();
}

extension SyncOperationPayloadExt on SyncOperationPayload {
  String toJsonString() => jsonEncode(toJson());
}

class LessonProgressSyncPayload implements SyncOperationPayload {
  final String lessonId;
  final String? subjectId;
  final String? chapterId;
  final int? progressPercent;
  final bool? isCompleted;
  final int? lastPositionSeconds;
  final int? totalDurationSeconds;
  final int? timeSpentSeconds;

  const LessonProgressSyncPayload({
    required this.lessonId,
    this.subjectId,
    this.chapterId,
    this.progressPercent,
    this.isCompleted,
    this.lastPositionSeconds,
    this.totalDurationSeconds,
    this.timeSpentSeconds,
  });

  @override
  Map<String, dynamic> toJson() {
    final statusStr = (isCompleted == true || progressPercent == 100)
        ? 'completed'
        : 'in_progress';
    final timeSpentMinutes =
        timeSpentSeconds != null ? (timeSpentSeconds! / 60).ceil() : null;

    return {
      'lessonId': lessonId,
      'status': statusStr,
      'progressPercent': isCompleted == true ? 100 : (progressPercent ?? 0),
      if (subjectId != null) 'subjectId': subjectId,
      if (chapterId != null) 'chapterId': chapterId,
      if (isCompleted != null) 'isCompleted': isCompleted,
      if (timeSpentMinutes != null) 'timeSpentMinutes': timeSpentMinutes,
      if (lastPositionSeconds != null)
        'lastPositionSeconds': lastPositionSeconds,
      if (totalDurationSeconds != null)
        'totalDurationSeconds': totalDurationSeconds,
      if (timeSpentSeconds != null) 'timeSpentSeconds': timeSpentSeconds,
    };
  }

  factory LessonProgressSyncPayload.fromJson(Map<String, dynamic> json) {
    return LessonProgressSyncPayload(
      lessonId: json['lessonId'] as String,
      subjectId: json['subjectId'] as String?,
      chapterId: json['chapterId'] as String?,
      progressPercent: (json['progressPercent'] as num?)?.toInt(),
      isCompleted: json['isCompleted'] as bool? ??
          (json['status'] == 'completed' || json['progressPercent'] == 100),
      lastPositionSeconds: (json['lastPositionSeconds'] as num?)?.toInt(),
      totalDurationSeconds: (json['totalDurationSeconds'] as num?)?.toInt(),
      timeSpentSeconds: (json['timeSpentSeconds'] as num?)?.toInt() ??
          ((json['timeSpentMinutes'] as num?) != null
              ? (json['timeSpentMinutes'] as num).toInt() * 60
              : null),
    );
  }
}

class StudyPlanSyncPayload implements SyncOperationPayload {
  final String? weekStartDate;
  final String? weekEndDate;
  final List<Map<String, dynamic>>? tasks;
  final List<String>? completedTaskIds;
  final String? notes;

  const StudyPlanSyncPayload({
    this.weekStartDate,
    this.weekEndDate,
    this.tasks,
    this.completedTaskIds,
    this.notes,
  });

  @override
  Map<String, dynamic> toJson() {
    return {
      if (weekStartDate != null) 'weekStartDate': weekStartDate,
      if (weekEndDate != null) 'weekEndDate': weekEndDate,
      if (tasks != null) 'tasks': tasks,
      if (completedTaskIds != null) 'completedTaskIds': completedTaskIds,
      if (notes != null) 'notes': notes,
    };
  }

  factory StudyPlanSyncPayload.fromJson(Map<String, dynamic> json) {
    return StudyPlanSyncPayload(
      weekStartDate: json['weekStartDate'] as String?,
      weekEndDate: json['weekEndDate'] as String?,
      tasks: (json['tasks'] as List<dynamic>?)
          ?.map((e) => e as Map<String, dynamic>)
          .toList(),
      completedTaskIds: (json['completedTaskIds'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
      notes: json['notes'] as String?,
    );
  }
}

class NotificationReadSyncPayload implements SyncOperationPayload {
  final String notificationId;
  final String? readAt;

  const NotificationReadSyncPayload({
    required this.notificationId,
    this.readAt,
  });

  @override
  Map<String, dynamic> toJson() {
    return {
      'notificationId': notificationId,
      if (readAt != null) 'readAt': readAt,
    };
  }

  factory NotificationReadSyncPayload.fromJson(Map<String, dynamic> json) {
    return NotificationReadSyncPayload(
      notificationId: json['notificationId'] as String,
      readAt: json['readAt'] as String?,
    );
  }
}
