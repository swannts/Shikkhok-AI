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
    final response = await apiClient.dio.get<Uint8List>(
      ApiEndpoints.textbookPdf(id),
      options: Options(responseType: ResponseType.bytes),
    );
    final bytes = response.data;
    if (bytes == null || bytes.isEmpty) {
      throw StateError('The textbook PDF is empty');
    }
    return bytes;
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
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.picture_as_pdf_outlined,
                      size: 48, color: AppColors.error),
                  const SizedBox(height: 12),
                  const Text('পাঠ্যবইটি এখনো পড়ার জন্য প্রস্তুত নয়'),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => setState(() => _pdfFuture = _loadPdf()),
                    child: const Text('আবার চেষ্টা করুন'),
                  ),
                ],
              ),
            );
          }
          return SfPdfViewer.memory(
            snapshot.data!,
            initialPageNumber: widget.initialPage < 1 ? 1 : widget.initialPage,
          );
        },
      ),
    );
  }
}
