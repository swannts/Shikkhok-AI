import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../domain/entities/lesson_content_block.dart';

class LessonContentBlockRenderer extends StatelessWidget {
  final List<LessonContentBlock> blocks;

  const LessonContentBlockRenderer({super.key, required this.blocks});

  @override
  Widget build(BuildContext context) {
    final contentBlocks = sortLessonContentBlocks(blocks);
    if (contentBlocks.isEmpty) {
      return const _EmptyLessonContentCard(
        message: 'এই পাঠের বিস্তারিত কনটেন্ট এখনো যোগ করা হয়নি।',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final block in contentBlocks) ...[
          _LessonContentBlockView(block: block),
          const SizedBox(height: AppSpacing.md),
        ],
      ],
    );
  }
}

class _LessonContentBlockView extends StatelessWidget {
  final LessonContentBlock block;

  const _LessonContentBlockView({required this.block});

  @override
  Widget build(BuildContext context) {
    if (block is LessonHeadingContentBlock) {
      return _HeadingBlock(block: block as LessonHeadingContentBlock);
    }
    if (block is LessonParagraphContentBlock) {
      return _ParagraphBlock(block: block as LessonParagraphContentBlock);
    }
    if (block is LessonFormulaContentBlock) {
      return _FormulaBlock(block: block as LessonFormulaContentBlock);
    }
    if (block is LessonExampleContentBlock) {
      return _ExampleBlock(block: block as LessonExampleContentBlock);
    }
    if (block is LessonImportantNoteContentBlock) {
      return _ImportantNoteBlock(
          block: block as LessonImportantNoteContentBlock);
    }
    if (block is LessonImageContentBlock) {
      return _ImageBlock(block: block as LessonImageContentBlock);
    }
    if (block is LessonTableContentBlock) {
      return _TableBlock(block: block as LessonTableContentBlock);
    }
    if (block is LessonCitationContentBlock) {
      return _CitationBlock(block: block as LessonCitationContentBlock);
    }
    if (block is LessonListContentBlock) {
      return _ListBlock(block: block as LessonListContentBlock);
    }
    if (block is LessonQuoteContentBlock) {
      return _QuoteBlock(block: block as LessonQuoteContentBlock);
    }
    return const SizedBox.shrink();
  }
}

class _HeadingBlock extends StatelessWidget {
  final LessonHeadingContentBlock block;

  const _HeadingBlock({required this.block});

  @override
  Widget build(BuildContext context) {
    final style = switch (block.level) {
      1 => AppTypography.pageTitle,
      2 => AppTypography.sectionTitle,
      _ => AppTypography.cardTitle,
    };

    return Text(
      block.text,
      style: style.copyWith(
        color: AppColors.textPrimary,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _ParagraphBlock extends StatelessWidget {
  final LessonParagraphContentBlock block;

  const _ParagraphBlock({required this.block});

  @override
  Widget build(BuildContext context) {
    return Text(
      block.text,
      style: AppTypography.body.copyWith(
        height: 1.65,
        color: AppColors.textPrimary,
      ),
    );
  }
}

class _FormulaBlock extends StatelessWidget {
  final LessonFormulaContentBlock block;

  const _FormulaBlock({required this.block});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.primary.withAlpha(14),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withAlpha(42)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.functions_rounded,
              color: AppColors.primary, size: 20),
          const SizedBox(height: 8),
          Text(
            block.expression,
            style: AppTypography.body.copyWith(
              fontFamily: 'monospace',
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          if (block.description != null && block.description!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              block.description!,
              style: AppTypography.caption
                  .copyWith(color: AppColors.textSecondary),
            ),
          ],
        ],
      ),
    );
  }
}

class _ExampleBlock extends StatelessWidget {
  final LessonExampleContentBlock block;

  const _ExampleBlock({required this.block});

  @override
  Widget build(BuildContext context) {
    return _BlockCard(
      backgroundColor: Colors.blue.shade50,
      borderColor: Colors.blue.shade200,
      icon: Icons.lightbulb_outline_rounded,
      iconColor: Colors.blue.shade700,
      title: block.title ?? 'উদাহরণ',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            block.body,
            style: AppTypography.body.copyWith(
              height: 1.6,
              color: AppColors.textPrimary,
            ),
          ),
          if (block.solution != null && block.solution!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              'সমাধান',
              style: AppTypography.captionBold.copyWith(
                color: Colors.blue.shade900,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              block.solution!,
              style: AppTypography.body.copyWith(
                height: 1.6,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ImportantNoteBlock extends StatelessWidget {
  final LessonImportantNoteContentBlock block;

  const _ImportantNoteBlock({required this.block});

  @override
  Widget build(BuildContext context) {
    final palette = switch (block.severity) {
      LessonImportantNoteSeverity.info => (
          Colors.blue.shade50,
          Colors.blue.shade200,
          Colors.blue.shade700
        ),
      LessonImportantNoteSeverity.warning => (
          Colors.orange.shade50,
          Colors.orange.shade200,
          Colors.orange.shade800
        ),
      LessonImportantNoteSeverity.tip => (
          Colors.green.shade50,
          Colors.green.shade200,
          Colors.green.shade800
        ),
    };

    return _BlockCard(
      backgroundColor: palette.$1,
      borderColor: palette.$2,
      icon: switch (block.severity) {
        LessonImportantNoteSeverity.info => Icons.info_outline_rounded,
        LessonImportantNoteSeverity.warning => Icons.warning_amber_rounded,
        LessonImportantNoteSeverity.tip => Icons.tips_and_updates_outlined,
      },
      iconColor: palette.$3,
      title: block.title ?? 'গুরুত্বপূর্ণ',
      child: Text(
        block.text,
        style: AppTypography.body.copyWith(
          height: 1.6,
          color: AppColors.textPrimary,
        ),
      ),
    );
  }
}

class _ImageBlock extends StatelessWidget {
  final LessonImageContentBlock block;

  const _ImageBlock({required this.block});

  @override
  Widget build(BuildContext context) {
    return _BlockCard(
      backgroundColor: AppColors.surface,
      borderColor: AppColors.border,
      icon: Icons.image_outlined,
      iconColor: AppColors.primary,
      title: 'চিত্র',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: Image.network(
                block.url,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    color: AppColors.background,
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.broken_image_outlined,
                            color: AppColors.textSecondary, size: 36),
                        const SizedBox(height: 8),
                        Text(
                          block.altText,
                          textAlign: TextAlign.center,
                          style: AppTypography.caption.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
          if (block.caption != null && block.caption!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              block.caption!,
              style: AppTypography.caption
                  .copyWith(color: AppColors.textSecondary),
            ),
          ],
        ],
      ),
    );
  }
}

class _TableBlock extends StatelessWidget {
  final LessonTableContentBlock block;

  const _TableBlock({required this.block});

  @override
  Widget build(BuildContext context) {
    return _BlockCard(
      backgroundColor: AppColors.surface,
      borderColor: AppColors.border,
      icon: Icons.table_chart_outlined,
      iconColor: AppColors.primary,
      title: 'টেবিল',
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Table(
          border: TableBorder.all(color: AppColors.border),
          defaultVerticalAlignment: TableCellVerticalAlignment.middle,
          columnWidths: {
            for (var i = 0; i < block.headers.length; i++)
              i: const IntrinsicColumnWidth(),
          },
          children: [
            TableRow(
              decoration: BoxDecoration(color: AppColors.primary.withAlpha(18)),
              children: [
                for (final header in block.headers)
                  Padding(
                    padding: const EdgeInsets.all(10),
                    child: Text(
                      header,
                      style: AppTypography.captionBold.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
              ],
            ),
            for (final row in block.rows)
              TableRow(
                children: [
                  for (final cell in row)
                    Padding(
                      padding: const EdgeInsets.all(10),
                      child: Text(
                        cell,
                        style: AppTypography.body.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _CitationBlock extends StatelessWidget {
  final LessonCitationContentBlock block;

  const _CitationBlock({required this.block});

  @override
  Widget build(BuildContext context) {
    final details = <String>[
      if (block.chapter != null && block.chapter!.isNotEmpty) block.chapter!,
      if (block.page != null && block.page!.isNotEmpty) block.page!,
    ];

    return _BlockCard(
      backgroundColor: Colors.grey.shade50,
      borderColor: Colors.grey.shade300,
      icon: Icons.menu_book_outlined,
      iconColor: AppColors.textSecondary,
      title: 'উৎস',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            block.bookName,
            style: AppTypography.body.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          if (details.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              details.join(' • '),
              style: AppTypography.caption
                  .copyWith(color: AppColors.textSecondary),
            ),
          ],
          if (block.excerpt != null && block.excerpt!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              block.excerpt!,
              style: AppTypography.body.copyWith(
                height: 1.5,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ListBlock extends StatelessWidget {
  final LessonListContentBlock block;

  const _ListBlock({required this.block});

  @override
  Widget build(BuildContext context) {
    return _BlockCard(
      backgroundColor: AppColors.surface,
      borderColor: AppColors.border,
      icon: Icons.format_list_bulleted_rounded,
      iconColor: AppColors.primary,
      title: block.ordered ? 'ক্রমিক তালিকা' : 'তালিকা',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (var i = 0; i < block.items.length; i++) ...[
            Text(
              '${block.ordered ? '${i + 1}.' : '•'} ${block.items[i]}',
              style: AppTypography.body.copyWith(
                height: 1.5,
                color: AppColors.textPrimary,
              ),
            ),
            if (i < block.items.length - 1) const SizedBox(height: 6),
          ],
        ],
      ),
    );
  }
}

class _QuoteBlock extends StatelessWidget {
  final LessonQuoteContentBlock block;

  const _QuoteBlock({required this.block});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: const Border(
          left: BorderSide(color: AppColors.primary, width: 4),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            block.text,
            style: AppTypography.body.copyWith(
              height: 1.6,
              fontStyle: FontStyle.italic,
              color: AppColors.textPrimary,
            ),
          ),
          if (block.attribution != null && block.attribution!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              block.attribution!,
              style: AppTypography.caption
                  .copyWith(color: AppColors.textSecondary),
            ),
          ],
        ],
      ),
    );
  }
}

class _BlockCard extends StatelessWidget {
  final Color backgroundColor;
  final Color borderColor;
  final IconData icon;
  final Color iconColor;
  final String title;
  final Widget child;

  const _BlockCard({
    required this.backgroundColor,
    required this.borderColor,
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: 8),
              Text(
                title,
                style: AppTypography.captionBold.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _EmptyLessonContentCard extends StatelessWidget {
  final String message;

  const _EmptyLessonContentCard({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Text(
        message,
        style: AppTypography.body.copyWith(
          color: AppColors.textSecondary,
          height: 1.6,
        ),
      ),
    );
  }
}
