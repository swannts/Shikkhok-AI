import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'dart:typed_data';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';

class TextbookReaderPage extends StatefulWidget {
  final String? bookId;
  final int initialPage;

  const TextbookReaderPage({super.key, this.bookId, this.initialPage = 1});
  @override
  State<TextbookReaderPage> createState() => _TextbookReaderPageState();
}

class _TextbookReaderPageState extends State<TextbookReaderPage> {
  late Future<Uint8List> _pdfFuture;
  int _readerAttempt = 0;
  bool _documentLoaded = false;
  String? _documentError;

  @override
  void initState() {
    super.initState();
    _pdfFuture = _loadPdf();
  }

  Future<Uint8List> _loadPdf() async {
    final id = widget.bookId;
    if (id == null || id.trim().isEmpty) {
      throw StateError('A textbook is required');
    }
    final response = await apiClient.dio.get<List<int>>(
      ApiEndpoints.textbookPdf(id),
      options: Options(responseType: ResponseType.bytes),
    );
    final responseBytes = response.data;
    if (responseBytes == null || responseBytes.isEmpty) {
      throw StateError('The textbook PDF is empty');
    }
    final bytes = Uint8List.fromList(responseBytes);
    if (bytes.length < 5 || String.fromCharCodes(bytes.take(5)) != '%PDF-') {
      throw const FormatException('The textbook response is not a PDF');
    }
    return bytes;
  }

  void _retryLoading() {
    setState(() {
      _readerAttempt++;
      _documentLoaded = false;
      _documentError = null;
      _pdfFuture = _loadPdf();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: const Text('পাঠ্যবই পড়ুন'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go(AppRoutes.learn),
        ),
      ),
      body: FutureBuilder<Uint8List>(
        future: _pdfFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || snapshot.data == null) {
            return _loadError(error: snapshot.error);
          }

          if (_documentError case final error?) {
            return _loadError(message: error);
          }

          return Stack(
            children: [
              SfPdfViewer.memory(
                snapshot.data!,
                key: ValueKey(_readerAttempt),
                initialPageNumber:
                    widget.initialPage < 1 ? 1 : widget.initialPage,
                onDocumentLoaded: (_) {
                  if (mounted) setState(() => _documentLoaded = true);
                },
                onDocumentLoadFailed: (details) {
                  if (mounted) {
                    setState(() {
                      _documentError = details.description;
                    });
                  }
                },
              ),
              if (!_documentLoaded)
                const Positioned.fill(
                  child: ColoredBox(
                    color: AppColors.background,
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _loadError({Object? error, String? message}) {
    final errorMessage = message ?? _userFacingError(error);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.picture_as_pdf_outlined,
                size: 48, color: AppColors.error),
            const SizedBox(height: 12),
            const Text(
              'পাঠ্যবইটি খোলা যাচ্ছে না',
              textAlign: TextAlign.center,
            ),
            if (errorMessage.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                errorMessage,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _retryLoading,
              child: const Text('আবার চেষ্টা করুন'),
            ),
          ],
        ),
      ),
    );
  }

  String _userFacingError(Object? error) {
    if (error is DioException) {
      final statusCode = error.response?.statusCode;
      if (statusCode == 401) {
        return 'তোমার সেশন শেষ হয়েছে। আবার লগইন করে চেষ্টা করো।';
      }
      if (statusCode == 403) {
        return 'এই বইটি পড়ার অনুমতি নেই।';
      }
      if (statusCode == 404) {
        return 'এই বইয়ের PDF সার্ভারে পাওয়া যায়নি।';
      }
      if (error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout) {
        return 'সার্ভারের সঙ্গে সংযোগ হচ্ছে না। ইন্টারনেট ও সার্ভার চালু আছে কি না দেখো।';
      }
      return 'PDF ডাউনলোড করা যায়নি (HTTP ${statusCode ?? 'অজানা'})।';
    }
    if (error is FormatException) {
      return 'সার্ভার থেকে সঠিক PDF ফাইল পাওয়া যায়নি।';
    }
    if (error is StateError) {
      return 'PDF ফাইলটি খালি বা পাওয়া যায়নি।';
    }
    if (error != null) {
      return 'PDF ডেটা পড়া যায়নি (${error.runtimeType})।';
    }
    return 'আবার চেষ্টা করো।';
  }
}
