import 'package:go_router/go_router.dart';
import '../../features/tutor/presentation/pages/ai_tutor_chat_page.dart';
import '../../features/tutor/presentation/pages/ai_tutor_chat_variant_page.dart';
import '../../features/tutor/presentation/pages/ai_tutor_history_empty_page.dart';
import '../../features/tutor/presentation/pages/ai_tutor_history_page.dart';
import '../../features/tutor/presentation/pages/voice_ai_tutor_page.dart';
import 'app_routes.dart';

final List<RouteBase> tutorRoutes = [
  GoRoute(
    path: AppRoutes.aiTutorChat,
    builder: (context, state) => const AiTutorChatPage(),
  ),
  GoRoute(
    path: '/tutor/:conversationId',
    builder: (context, state) => AiTutorChatPage(
      initialConversationId: state.pathParameters['conversationId'],
    ),
  ),
  GoRoute(
    path: '/ai-tutor-chat-variant',
    builder: (context, state) => const AiTutorChatVariantPage(),
  ),
  GoRoute(
    path: AppRoutes.aiTutorHistory,
    builder: (context, state) => const AiTutorHistoryPage(),
  ),
  GoRoute(
    path: '/ai-tutor-history-empty',
    builder: (context, state) => const AiTutorHistoryEmptyPage(),
  ),
  GoRoute(
    path: AppRoutes.voiceAiTutor,
    builder: (context, state) => const VoiceAiTutorPage(),
  ),
];
