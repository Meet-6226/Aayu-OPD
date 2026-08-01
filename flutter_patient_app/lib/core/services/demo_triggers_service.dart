import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:url_launcher/url_launcher.dart';

class DemoConfig {
  static const String twilioSid = "YOUR_TWILIO_SID";
  static const String twilioToken = "YOUR_TWILIO_AUTH_TOKEN";
  static const String twilioWhatsappNumber = "whatsapp:+14155238886";
  static const String twilioSandboxCode = "YOUR_SANDBOX_CODE";

  static const String vapiApiKey = "YOUR_VAPI_API_KEY";
  static const String vapiAssistantId = "YOUR_VAPI_ASSISTANT_ID";
  static const String vapiPhoneNumberId = "YOUR_VAPI_PHONE_NUMBER_ID";

  static const List<String> demoVerifiedPhones = [
    "+919876543210", // Demo User 1
    "+919876543211", // Demo User 2
    "+919876543212", // Demo User 3
  ];
  static const String demoVerifiedPhone = "+919876543210";
}

class DemoTriggersService {
  late final Dio _dio;

  DemoTriggersService() {
    _dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ));
  }

  String _formatPhone(String phoneStr) {
    if (phoneStr.isEmpty) return DemoConfig.demoVerifiedPhone;
    String digitsOnly = phoneStr.replaceAll(RegExp(r'\D'), '');
    if (digitsOnly.length >= 10) {
      return '+91${digitsOnly.substring(digitsOnly.length - 10)}';
    }
    return DemoConfig.demoVerifiedPhone;
  }

  /// Send WhatsApp message
  Future<bool> sendWhatsAppDirect(String phone, String body) async {
    final formatted = _formatPhone(phone);
    final cleanDigits = formatted.replaceAll(RegExp(r'\D'), '');
    debugPrint('[sendWhatsApp] Sending to: $formatted');

    bool apiSuccess = false;

    if (kIsWeb) {
      // Web: use proxy
      try {
        final response = await _dio.post(
          '/api/send-whatsapp',
          data: {'phone': formatted, 'body': body},
          options: Options(contentType: Headers.jsonContentType),
        );
        if (response.statusCode == 200) {
          debugPrint('[sendWhatsApp] ✅ Proxy response: ${response.data}');
          final resultsList = response.data['results'] as List?;
          apiSuccess = response.data['success'] == true &&
              resultsList != null &&
              resultsList.isNotEmpty &&
              resultsList.first['status'] == 'sent';
        }
      } catch (e) {
        debugPrint('[sendWhatsApp] ❌ Proxy error: $e');
      }
    } else {
      // Native: direct Twilio API
      try {
        final authHeader =
            'Basic ${base64Encode(utf8.encode('${DemoConfig.twilioSid}:${DemoConfig.twilioToken}'))}';
        final response = await _dio.post(
          'https://api.twilio.com/2010-04-01/Accounts/${DemoConfig.twilioSid}/Messages.json',
          options: Options(
            headers: {'Authorization': authHeader},
            contentType: Headers.formUrlEncodedContentType,
          ),
          data: {
            'From': DemoConfig.twilioWhatsappNumber,
            'To': 'whatsapp:$formatted',
            'Body': body,
          },
        );
        if (response.statusCode == 200 || response.statusCode == 201) {
          debugPrint('[sendWhatsApp] ✅ Sent to $formatted! SID: ${response.data["sid"]}');
          apiSuccess = true;
        }
      } catch (e) {
        debugPrint('[sendWhatsApp] ❌ Error for $formatted: $e');
      }
    }

    // Direct WhatsApp Web/App launcher fallback
    if (!apiSuccess) {
      try {
        final waUrl = Uri.parse(
            'https://wa.me/$cleanDigits?text=${Uri.encodeComponent(body)}');
        debugPrint('[sendWhatsApp] Opening WhatsApp URL fallback: $waUrl');
        await launchUrl(waUrl, mode: LaunchMode.externalApplication);
      } catch (e) {
        debugPrint('[sendWhatsApp] Fallback launch error: $e');
      }
    }

    return apiSuccess;
  }

  /// Initiate AI Voice Call
  Future<bool> makeVoiceCallDirect(
      String phone, String callType, Map<String, dynamic> apptData) async {
    final formatted = _formatPhone(phone);
    debugPrint('[voiceCall] Calling target: $formatted, type: $callType');

    if (kIsWeb) {
      // Web: use proxy
      try {
        final response = await _dio.post(
          '/api/voice-call',
          data: {'phone': formatted, 'callType': callType, 'appointmentData': apptData},
          options: Options(contentType: Headers.jsonContentType),
        );
        if (response.statusCode == 200) {
          debugPrint('[voiceCall] ✅ Proxy call success! ${response.data}');
          return true;
        }
      } catch (e) {
        debugPrint('[voiceCall] ❌ Proxy error: $e');
      }
      return false;
    }

    // Native: direct Vapi API
    final targets = {formatted, DemoConfig.demoVerifiedPhone};
    bool success = false;

    for (final target in targets) {
      try {
        final response = await _dio.post(
          'https://api.vapi.ai/call/phone',
          options: Options(
            headers: {
              'Authorization': 'Bearer ${DemoConfig.vapiApiKey}',
              'Content-Type': 'application/json',
            },
          ),
          data: {
            'phoneNumberId': DemoConfig.vapiPhoneNumberId,
            'assistantId': DemoConfig.vapiAssistantId,
            'customer': {'number': target},
            'assistantOverrides': {
              'variableValues': {
                'patientName': apptData['patientName'] ?? 'Patient',
                'doctorName': apptData['doctorName'] ?? 'Doctor',
                'appointmentDate': apptData['appointmentDate'] ?? '',
                'appointmentTime': apptData['appointmentTime'] ?? '',
                'callType': callType,
              },
            },
          },
        );
        if (response.statusCode == 200 || response.statusCode == 201) {
          debugPrint('[voiceCall] ✅ Vapi call success to $target! ID: ${response.data["id"]}');
          success = true;
        }
      } catch (e) {
        debugPrint('[voiceCall] ❌ Vapi error for $target: $e');
      }
    }
    return success;
  }

  /// 1. Patient Registration (WhatsApp + 8s delayed Voice Call)
  Future<void> triggerPatientRegistrationDemo({
    required String name,
    required String phone,
  }) async {
    debugPrint('[Registration] Triggering for $name, phone: $phone');

    final welcomeMsg =
        'Namaste $name! Welcome to Aayu OPD Intelligence. You\'re now registered. Book your first appointment anytime.';
    final sent = await sendWhatsAppDirect(phone, welcomeMsg);
    debugPrint('[Registration] WhatsApp sent: $sent');

    await Future.delayed(const Duration(seconds: 2));
    final called = await makeVoiceCallDirect(phone, 'welcome', {'patientName': name});
    debugPrint('[Registration] Voice call initiated: $called');
  }

  /// 2. Appointment Booking (WhatsApp + 5s delayed Voice Call)
  Future<void> triggerAppointmentBookingDemo({
    required String name,
    required String phone,
    required String doctorName,
    required String appointmentDate,
    required String appointmentTime,
    required String bookingId,
  }) async {
    debugPrint('[Booking] Triggering for $bookingId, $name, phone: $phone');

    final confirmationMsg =
        '🏥 Aayu Clinic: Hi $name! Your appointment is confirmed. Doctor: $doctorName. Date: $appointmentDate. Time: $appointmentTime. Booking ID: $bookingId. Reply 1 to confirm.';
    final sent = await sendWhatsAppDirect(phone, confirmationMsg);
    debugPrint('[Booking] WhatsApp sent: $sent');

    await Future.delayed(const Duration(seconds: 2));
    final called = await makeVoiceCallDirect(phone, 'confirmation', {
      'patientName': name,
      'doctorName': doctorName,
      'appointmentDate': appointmentDate,
      'appointmentTime': appointmentTime,
    });
    debugPrint('[Booking] Voice call initiated: $called');
  }
}
