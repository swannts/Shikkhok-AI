import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/sync/sync_engine.dart';
import '../data/datasources/practice_remote_data_source.dart';
import '../data/repositories/practice_repository_impl.dart';
import '../domain/repositories/practice_repository.dart';

final practiceRemoteDataSourceProvider =
    Provider<PracticeRemoteDataSource>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return PracticeRemoteDataSourceImpl(apiClient);
});

final practiceRepositoryProvider = Provider<PracticeRepository>((ref) {
  final remoteDataSource = ref.watch(practiceRemoteDataSourceProvider);
  final apiClient = ref.watch(apiClientProvider);
  final syncEngine = ref.watch(syncEngineProvider);
  return PracticeRepositoryImpl(remoteDataSource, apiClient, syncEngine);
});
