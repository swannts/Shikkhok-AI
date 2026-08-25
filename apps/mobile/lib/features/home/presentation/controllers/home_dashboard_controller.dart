import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../profile/domain/entities/student_profile.dart';
import '../../../profile/presentation/controllers/student_profile_controller.dart';
import '../../../curriculum/domain/entities/subject.dart';
import '../../../curriculum/domain/entities/progress_summary.dart';
import '../../../curriculum/presentation/controllers/curriculum_controller.dart';
import '../../domain/entities/gamification_summary.dart';
import '../../data/dto/gamification_summary_dto.dart';

class HomeDashboardData {
  final StudentProfile? profile;
  final List<Subject> subjects;
  final GamificationSummary gamification;
  final ProgressSummary progress;

  const HomeDashboardData({
    this.profile,
    this.subjects = const [],
    this.gamification = const GamificationSummary(),
    this.progress = const ProgressSummary(),
  });
}

final gamificationSummaryFutureProvider =
    FutureProvider<GamificationSummary>((ref) async {
  try {
    final res = await apiClient.dio.get(ApiEndpoints.gamificationSummary);
    final raw = res.data;
    final data = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data']
        : raw;
    return GamificationSummaryDto.fromJson(data as Map<String, dynamic>)
        .toDomain();
  } catch (_) {
    return const GamificationSummary();
  }
});

final homeDashboardProvider = FutureProvider<HomeDashboardData>((ref) async {
  // Load Student Profile
  StudentProfile? profile;
  try {
    profile = await ref.read(studentRepositoryProvider).getMyProfile();
  } catch (_) {}

  final classLevel = profile?.classLevel ?? 8;
  final medium = profile?.medium.toApiString() ?? 'bangla';
  final year = profile?.curriculumYear ?? 2026;

  // Load Subjects
  List<Subject> subjects = [];
  try {
    subjects = await ref.read(curriculumRepositoryProvider).listSubjects(
          classLevel: classLevel,
          medium: medium,
          curriculumYear: year,
        );
  } catch (_) {}

  // Load Gamification
  GamificationSummary gamification = const GamificationSummary();
  try {
    gamification = await ref.watch(gamificationSummaryFutureProvider.future);
  } catch (_) {}

  // Load Progress
  ProgressSummary progress = const ProgressSummary();
  try {
    progress = await ref.watch(progressSummaryFutureProvider.future);
  } catch (_) {}

  return HomeDashboardData(
    profile: profile,
    subjects: subjects,
    gamification: gamification,
    progress: progress,
  );
});
