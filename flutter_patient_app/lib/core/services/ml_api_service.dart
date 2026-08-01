import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class MlPredictionResult {
  final double riskScore;
  final String riskLevel;
  final List<dynamic> shapFactors;
  final String summary;
  final String modelVersion;

  MlPredictionResult({
    required this.riskScore,
    required this.riskLevel,
    required this.shapFactors,
    required this.summary,
    required this.modelVersion,
  });

  factory MlPredictionResult.fallback() {
    return MlPredictionResult(
      riskScore: 35.0,
      riskLevel: "LOW",
      shapFactors: [],
      summary: "Standard appointment risk calculated.",
      modelVersion: "fallback",
    );
  }

  factory MlPredictionResult.fromJson(Map<String, dynamic> json) {
    return MlPredictionResult(
      riskScore: (json['risk_score'] as num?)?.toDouble() ?? 35.0,
      riskLevel: json['risk_level']?.toString().toUpperCase() ?? "LOW",
      shapFactors: json['shap_factors'] as List<dynamic>? ?? [],
      summary: json['summary'] ?? "Risk calculation complete.",
      modelVersion: json['model_version'] ?? "v1.0.0",
    );
  }
}

class MlApiService {
  static const String baseUrl = "https://apollo-opd.onrender.com";
  late final Dio _dio;

  MlApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 2),
        receiveTimeout: const Duration(seconds: 2),
        headers: {'Content-Type': 'application/json'},
      ),
    );
  }

  Future<MlPredictionResult> predictNoShowRisk(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/predict', data: data);
      if (response.statusCode == 200 && response.data != null) {
        return MlPredictionResult.fromJson(Map<String, dynamic>.from(response.data));
      }
      return MlPredictionResult.fallback();
    } catch (e) {
      if (kDebugMode) {
        print("[MlApiService] Prediction fell back: $e");
      }
      return MlPredictionResult.fallback();
    }
  }
}
