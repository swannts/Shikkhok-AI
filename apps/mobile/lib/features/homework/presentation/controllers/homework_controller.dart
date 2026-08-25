import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/homework_submission.dart';
import '../../domain/entities/homework_feedback.dart';
import '../../domain/repositories/homework_repository.dart';
import '../../data/datasources/homework_remote_data_source.dart';
import '../../data/repositories/homework_repository_impl.dart';

final homeworkRemoteDataSourceProvider =
    Provider<HomeworkRemoteDataSource>((ref) {
  return HomeworkRemoteDataSourceImpl(apiClient);
});

final homeworkRepositoryProvider = Provider<HomeworkRepository>((ref) {
  final remoteDataSource = ref.watch(homeworkRemoteDataSourceProvider);
  return HomeworkRepositoryImpl(remoteDataSource, apiClient);
});

sealed class HomeworkState {
  const HomeworkState();
}

class HomeworkInitial extends HomeworkState {
  const HomeworkInitial();
}

class HomeworkLoading extends HomeworkState {
  const HomeworkLoading();
}

class HomeworkListLoaded extends HomeworkState {
  final List<HomeworkSubmission> submissions;
  const HomeworkListLoaded(this.submissions);
}

class HomeworkFeedbackLoaded extends HomeworkState {
  final HomeworkSubmission submission;
  final HomeworkFeedback feedback;
  const HomeworkFeedbackLoaded({
    required this.submission,
    required this.feedback,
  });
}

class HomeworkError extends HomeworkState {
  final String message;
  const HomeworkError(this.message);
}

class HomeworkController extends StateNotifier<HomeworkState> {
  final HomeworkRepository _repository;

  HomeworkController(this._repository) : super(const HomeworkInitial());

  Future<void> loadSubmissions() async {
    state = const HomeworkLoading();
    try {
      final list = await _repository.getMySubmissions();
      state = HomeworkListLoaded(list);
    } on AppFailure catch (failure) {
      state = HomeworkError(failure.message);
    } catch (_) {
      state = const HomeworkError('হোমওয়ার্ক তালিকা লোড করা যায়নি');
    }
  }

  Future<HomeworkSubmission?> submitHomework({
    required List<String> imageUrls,
    String? prompt,
    String? subjectId,
  }) async {
    try {
      final submission = await _repository.createSubmission(
        imageUrls: imageUrls,
        prompt: prompt,
        subjectId: subjectId,
      );
      return submission;
    } on AppFailure catch (failure) {
      state = HomeworkError(failure.message);
      return null;
    } catch (_) {
      state = const HomeworkError('হোমওয়ার্ক জমা দেওয়া যায়নি');
      return null;
    }
  }

  Future<void> loadFeedback(String submissionId) async {
    state = const HomeworkLoading();
    try {
      final submission = await _repository.getSubmission(submissionId);
      final feedback = await _repository.getFeedback(submissionId);
      state = HomeworkFeedbackLoaded(
        submission: submission,
        feedback: feedback,
      );
    } on AppFailure catch (failure) {
      state = HomeworkError(failure.message);
    } catch (_) {
      state = const HomeworkError('সমাধান ও ব্যাখ্যা লোড করা যায়নি');
    }
  }

  Future<void> rateFeedback(String submissionId, int rating) async {
    try {
      await _repository.rateFeedback(submissionId, rating);
    } catch (_) {}
  }
}

final homeworkControllerProvider =
    StateNotifierProvider<HomeworkController, HomeworkState>((ref) {
  final repository = ref.watch(homeworkRepositoryProvider);
  return HomeworkController(repository);
});
