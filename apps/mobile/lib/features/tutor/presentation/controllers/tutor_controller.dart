import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/api_client.dart';
import '../../data/repositories/tutor_repository_impl.dart';
import '../../domain/repositories/tutor_repository.dart';
import '../state/tutor_state.dart';

final tutorApiClientProvider = Provider<ApiClient>((ref) => apiClient);

final tutorRepositoryProvider = Provider<TutorRepository>((ref) {
  return TutorRepositoryImpl(ref.read(tutorApiClientProvider));
});

final tutorControllerProvider =
    StateNotifierProvider<TutorController, TutorState>((ref) {
  return TutorController(ref.read(tutorRepositoryProvider));
});

class TutorController extends StateNotifier<TutorState> {
  final TutorRepository _repository;

  TutorController(this._repository) : super(const TutorState.initial());

  Future<void> loadInitial({String? conversationId}) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final conversations = await _repository.getMyConversations();
      if (conversationId != null && conversationId.isNotEmpty) {
        final thread = await _repository.getConversation(conversationId);
        state = state.copyWith(
          conversations: conversations,
          activeConversation: thread.conversation,
          messages: thread.messages,
          isLoading: false,
          errorMessage: null,
        );
        return;
      }

      if (conversations.isNotEmpty) {
        final thread =
            await _repository.getConversation(conversations.first.id);
        state = state.copyWith(
          conversations: conversations,
          activeConversation: thread.conversation,
          messages: thread.messages,
          isLoading: false,
          errorMessage: null,
        );
        return;
      }

      final thread =
          await _repository.startConversation(title: 'নতুন AI টিউটর আলাপ');
      state = state.copyWith(
        conversations: conversations,
        activeConversation: thread.conversation,
        messages: thread.messages,
        isLoading: false,
        errorMessage: null,
      );
    } on AppFailure catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.banglaMessage);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> loadHistory() async {
    state = state.copyWith(isLoadingHistory: true, errorMessage: null);
    try {
      final conversations = await _repository.getMyConversations();
      state = state.copyWith(
        conversations: conversations,
        isLoadingHistory: false,
        errorMessage: null,
      );
    } on AppFailure catch (e) {
      state = state.copyWith(
          isLoadingHistory: false, errorMessage: e.banglaMessage);
    } catch (e) {
      state =
          state.copyWith(isLoadingHistory: false, errorMessage: e.toString());
    }
  }

  Future<void> selectConversation(String conversationId) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final thread = await _repository.getConversation(conversationId);
      state = state.copyWith(
        activeConversation: thread.conversation,
        messages: thread.messages,
        isLoading: false,
        errorMessage: null,
      );
    } on AppFailure catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.banglaMessage);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> startConversation({
    String? title,
    String? subjectId,
    String? chapterId,
    String? lessonId,
    String? initialMessage,
  }) async {
    state = state.copyWith(isStartingConversation: true, errorMessage: null);
    try {
      final thread = await _repository.startConversation(
        title: title,
        subjectId: subjectId,
        chapterId: chapterId,
        lessonId: lessonId,
        initialMessage: initialMessage,
      );
      state = state.copyWith(
        activeConversation: thread.conversation,
        messages: thread.messages,
        isStartingConversation: false,
        errorMessage: null,
      );
    } on AppFailure catch (e) {
      state = state.copyWith(
          isStartingConversation: false, errorMessage: e.banglaMessage);
    } catch (e) {
      state = state.copyWith(
          isStartingConversation: false, errorMessage: e.toString());
    }
  }

  Future<void> sendMessage(String content) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty) {
      return;
    }

    final activeConversation = state.activeConversation;
    if (activeConversation == null) {
      await startConversation(initialMessage: trimmed);
      return;
    }

    state = state.copyWith(isSending: true, errorMessage: null);
    try {
      final thread =
          await _repository.sendMessage(activeConversation.id, trimmed);
      state = state.copyWith(
        activeConversation: thread.conversation,
        messages: thread.messages,
        isSending: false,
        errorMessage: null,
      );
    } on AppFailure catch (e) {
      state = state.copyWith(isSending: false, errorMessage: e.banglaMessage);
    } catch (e) {
      state = state.copyWith(isSending: false, errorMessage: e.toString());
    }
  }
}
