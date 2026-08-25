#!/usr/bin/env bash
set -e

echo "=== Shikkhok-AI Mobile Verification Pipeline ==="

cd apps/mobile

echo "1. Checking Dart formatting..."
dart format --output=none --set-exit-if-changed .

echo "2. Running Flutter analyze..."
flutter analyze

echo "3. Running Flutter automated tests..."
flutter test

echo "=== ALL MOBILE VERIFICATION CHECKS PASSED ==="
