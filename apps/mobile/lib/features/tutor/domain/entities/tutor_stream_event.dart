import 'tutor_citation.dart';

sealed class TutorStreamEvent {
  const TutorStreamEvent();
}

class TutorTextDeltaEvent extends TutorStreamEvent {
  final String text;
  const TutorTextDeltaEvent(this.text);
}

class TutorCitationEvent extends TutorStreamEvent {
  final TutorCitation citation;
  const TutorCitationEvent(this.citation);
}

class TutorMetadataEvent extends TutorStreamEvent {
  final String provider;
  final bool? grounded;
  final Map<String, dynamic> raw;

  const TutorMetadataEvent({
    required this.provider,
    this.grounded,
    this.raw = const {},
  });
}

class TutorDoneEvent extends TutorStreamEvent {
  final String? messageId;
  final String? conversationId;

  const TutorDoneEvent({
    this.messageId,
    this.conversationId,
  });
}

class TutorErrorEvent extends TutorStreamEvent {
  final String code;
  final String message;

  const TutorErrorEvent({
    required this.code,
    required this.message,
  });
}
