import '../../domain/entities/tutor_conversation.dart';
import '../../domain/entities/tutor_message.dart';
import '../../domain/entities/tutor_citation.dart';

class TutorState {
  final List<TutorConversation> conversations;
  final TutorConversation? activeConversation;
  final List<TutorMessage> messages;
  final bool isLoading;
  final bool isLoadingHistory;
  final bool isSending;
  final bool isStreaming;
  final bool isStartingConversation;
  final String? errorMessage;
  final List<TutorCitation> activeCitations;

  const TutorState({
    required this.conversations,
    required this.activeConversation,
    required this.messages,
    required this.isLoading,
    required this.isLoadingHistory,
    required this.isSending,
    this.isStreaming = false,
    required this.isStartingConversation,
    required this.errorMessage,
    this.activeCitations = const [],
  });

  const TutorState.initial()
      : conversations = const [],
        activeConversation = null,
        messages = const [],
        isLoading = true,
        isLoadingHistory = false,
        isSending = false,
        isStreaming = false,
        isStartingConversation = false,
        errorMessage = null,
        activeCitations = const [];

  TutorState copyWith({
    List<TutorConversation>? conversations,
    TutorConversation? activeConversation,
    List<TutorMessage>? messages,
    bool? isLoading,
    bool? isLoadingHistory,
    bool? isSending,
    bool? isStreaming,
    bool? isStartingConversation,
    String? errorMessage,
    List<TutorCitation>? activeCitations,
  }) {
    return TutorState(
      conversations: conversations ?? this.conversations,
      activeConversation: activeConversation ?? this.activeConversation,
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isLoadingHistory: isLoadingHistory ?? this.isLoadingHistory,
      isSending: isSending ?? this.isSending,
      isStreaming: isStreaming ?? this.isStreaming,
      isStartingConversation:
          isStartingConversation ?? this.isStartingConversation,
      errorMessage: errorMessage,
      activeCitations: activeCitations ?? this.activeCitations,
    );
  }
}
