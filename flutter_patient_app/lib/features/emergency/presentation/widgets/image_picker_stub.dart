// lib/features/emergency/presentation/widgets/image_picker_stub.dart

import 'package:image_picker/image_picker.dart';

Future<String?> pickImageImpl(bool isCamera) async {
  final picker = ImagePicker();
  final picked = await picker.pickImage(
    source: isCamera ? ImageSource.camera : ImageSource.gallery,
    imageQuality: 85,
    maxWidth: 1920,
    maxHeight: 1080,
  );
  return picked?.path;
}
