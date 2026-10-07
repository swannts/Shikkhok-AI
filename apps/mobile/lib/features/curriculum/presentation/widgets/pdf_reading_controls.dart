import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

import '../../../../app/theme/app_colors.dart';

class PdfReadingControls extends StatelessWidget {
  final PdfViewerController controller;

  const PdfReadingControls({super.key, required this.controller});

  void _adjustZoom(double change) {
    final nextZoom = (controller.zoomLevel + change).clamp(1.0, 4.0);
    controller.zoomLevel = nextZoom;
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: 'লেখা ছোট করুন',
            onPressed: () => _adjustZoom(-0.25),
            icon: const Icon(Icons.zoom_out_rounded),
          ),
          IconButton(
            tooltip: 'লেখা বড় করুন',
            onPressed: () => _adjustZoom(0.25),
            icon: const Icon(Icons.zoom_in_rounded),
          ),
          IconButton(
            tooltip: 'স্বাভাবিক আকার',
            onPressed: () => controller.zoomLevel = 1,
            icon: const Icon(Icons.fit_screen_rounded),
          ),
        ],
      ),
    );
  }
}
