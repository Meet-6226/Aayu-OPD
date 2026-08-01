// lib/features/emergency/presentation/widgets/image_picker_helper.dart

import 'image_picker_stub.dart'
    if (dart.library.html) 'image_picker_web.dart';

Future<String?> pickImageCrossPlatform({required bool isCamera}) {
  return pickImageImpl(isCamera);
}
