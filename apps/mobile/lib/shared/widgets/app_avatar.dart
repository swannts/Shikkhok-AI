import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';

class AppAvatar extends StatelessWidget {
  final String? imageUrl;
  final String? initials;
  final double radius;
  final bool isOnline;

  const AppAvatar({
    super.key,
    this.imageUrl,
    this.initials,
    this.radius = 24.0,
    this.isOnline = false,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        CircleAvatar(
          radius: radius,
          backgroundColor: AppColors.primary,
          child: initials != null
              ? Text(
                  initials!,
                  style: TextStyle(
                    fontSize: radius * 0.8,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontFamily: 'SutonnyMJ',
                    fontFamilyFallback: const [
                      'SutonnyMJ',
                      'Anek Bangla',
                      'Hind Siliguri',
                      'sans-serif'
                    ],
                  ),
                )
              : Icon(Icons.person_rounded,
                  size: radius * 1.1, color: Colors.white),
        ),
        if (isOnline)
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: radius * 0.6,
              height: radius * 0.6,
              decoration: BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
            ),
          ),
      ],
    );
  }
}
