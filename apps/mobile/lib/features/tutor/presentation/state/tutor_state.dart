import '../../domain/entities/tutor_conversation.dart';
import '../../domain/entities/tutor_message.dart';

class TutorState {
  final List<TutorConversation> conversations;
  final TutorConversation? activeConversation;
  final List<TutorMessage> messages;
  final bool isLoading;
  final bool isLoadingHistory;
  final bool isSending;
  final bool isStartingConversation;
  final String? errorMessage;

  const TutorState({
    required this.conversations,
    required this.activeConversation,
    required this.messages,
    required this.isLoading,
    required this.isLoadingHistory,
    required this.isSending,
    required this.isStartingConversation,
    required this.errorMessage,
  });

  const TutorState.initial()
      : conversations = const [],
        activeConversation = null,
        messages = const [],
        isLoading = true,
        isLoadingHistory = false,
        isSending = false,
        isStartingConversation = false,
        errorMessage = null;

  TutorState copyWith({
    List<TutorConversation>? conversations,
    TutorConversation? activeConversation,
    List<TutorMessage>? messages,
    bool? isLoading,
    bool? isLoadingHistory,
    bool? isSending,
    bool? isStartingConversation,
    String? errorMessage,
  }) {
    return TutorState(
      conversations: conversations ?? this.conversations,
      activeConversation: activeConversation ?? this.activeConversation,
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isLoadingHistory: isLoadingHistory ?? this.isLoadingHistory,
      isSending: isSending ?? this.isSending,
      isStartingConversation:
          isStartingConversation ?? this.isStartingConversation,
      errorMessage: errorMessage,
    );
  }
}
