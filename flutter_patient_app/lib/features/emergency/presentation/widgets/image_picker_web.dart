// lib/features/emergency/presentation/widgets/image_picker_web.dart

import 'dart:async';
import 'dart:html' as html;

Future<String?> pickImageImpl(bool isCamera) async {
  final completer = Completer<String?>();
  final input = html.FileUploadInputElement()..accept = 'image/*';
  if (isCamera) {
    input.setAttribute('capture', 'environment');
  }
  input.click();
  
  StreamSubscription? changeSub;
  changeSub = input.onChange.listen((e) {
    changeSub?.cancel();
    final files = input.files;
    if (files != null && files.isNotEmpty) {
      final reader = html.FileReader();
      reader.readAsDataUrl(files[0]);
      reader.onLoadEnd.listen((e) {
        completer.complete(reader.result as String?);
      });
    } else {
      completer.complete(null);
    }
  });

  return completer.future;
}
