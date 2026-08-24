import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/theme.dart';
import 'state/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/main_tab_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..restoreSession()),
      ],
      child: const ShikkhokAiApp(),
    ),
  );
}

class ShikkhokAiApp extends StatelessWidget {
  const ShikkhokAiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Shikkhok AI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.status == AuthStatus.unknown) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          if (auth.status == AuthStatus.authenticated) {
            return const MainTabScreen();
          }
          return const LoginScreen();
        },
      ),
    );
  }
}
