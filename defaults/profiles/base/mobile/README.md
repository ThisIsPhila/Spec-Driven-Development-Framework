---
name: Mobile
type: base
description: Mobile applications (iOS Swift, Android Kotlin, React Native, Flutter)
includes:
  - screen-design-template.md
  - platform-guidelines.md
  - device-support.md
examples:
  - iOS SwiftUI app
  - Android Jetpack Compose app
  - React Native cross-platform app
  - Flutter mobile app
---

# Mobile Profile

The **Mobile** profile is optimized for iOS and Android application development. It includes templates for screen design, platform-specific guidelines, and device support matrices.

## What You Get

**In addition to General profile**, you receive:

### Templates
- `screen-design-template.md` - Mobile screen specifications
  - Screen flow diagrams
  - Navigation patterns
  - State management
  - Offline behavior
- `platform-guidelines.md` - Platform compliance rules
  - iOS: Human Interface Guidelines (HIG)
  - Android: Material Design guidelines
  - Review checklist for App Store / Play Store

### Memory
- `device-support.md` - Device/OS version matrix
  - Minimum supported iOS/Android versions
  - Device-specific considerations (tablet, phone)
  - Screen size breakpoints

## When to Use

- Building native iOS apps (Swift/SwiftUI)
- Building native Android apps (Kotlin/Jetpack Compose)
- Creating cross-platform apps (React Native, Flutter)
- Developing mobile-first experiences

## Technology Stack Detection

Agent will recommend this profile when detecting:
- iOS: `Info.plist`, `.xcodeproj`, Swift files
- Android: `AndroidManifest.xml`, Kotlin/Java files, `build.gradle`
- Cross-platform: `package.json` with `react-native`, `pubspec.yaml` (Flutter)

## Composition

Can be combined with modifiers:
- `mobile+devsecops` - Mobile app with security (secure storage, certificate pinning)
- `mobile+mlops` - Mobile app with on-device ML (Core ML, TensorFlow Lite)
- `mobile+devops` - Mobile app with CI/CD (Fastlane, App Distribution)
