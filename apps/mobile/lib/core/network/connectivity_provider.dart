import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final connectivityProvider = StreamProvider<bool>((ref) async* {
  final connectivity = Connectivity();
  final initialResult = await connectivity.checkConnectivity();
  yield !initialResult.contains(ConnectivityResult.none);

  yield* connectivity.onConnectivityChanged.map((results) {
    return !results.contains(ConnectivityResult.none);
  });
});

final isOnlineProvider = Provider<bool>((ref) {
  final state = ref.watch(connectivityProvider);
  return state.value ?? true; // Default to online if unknown
});
