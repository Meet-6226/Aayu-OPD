import 'dart:math';
import 'package:dio/dio.dart';
import '../config.dart';

class ApiService {
  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  // Singleton instance
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String get _baseUrl => AppConfig.apiBaseUrl;

  /// Fetch a single document by its path (collection) and unique ID.
  Future<Map<String, dynamic>?> getDoc(String collection, String id) async {
    try {
      final response = await _dio.get(
        '$_baseUrl/api/doc',
        queryParameters: {'path': collection, 'id': id},
      );
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'];
        return data as Map<String, dynamic>?;
      }
      return null;
    } catch (e) {
      print('❌ [ApiService] getDoc error: $e');
      return null;
    }
  }

  /// Query a collection with optional filters (clauses), sorting, and limits.
  /// Clauses structure: {'field': String, 'op': '==' | '>' | '<' | 'in' | 'array-contains', 'value': dynamic}
  /// Sorts structure: {'field': String, 'direction': 'asc' | 'desc'}
  Future<List<Map<String, dynamic>>> getDocs(
    String collection, {
    List<Map<String, dynamic>>? clauses,
    List<Map<String, dynamic>>? sorts,
    int? limit,
  }) async {
    try {
      final payload = {
        'path': collection,
        'clauses': clauses ?? [],
        'sorts': sorts ?? [],
        'limitVal': limit,
      };

      final response = await _dio.post(
        '$_baseUrl/api/query',
        data: payload,
      );

      if (response.statusCode == 200 && response.data != null) {
        final docsList = response.data['docs'] as List<dynamic>?;
        if (docsList != null) {
          return docsList.map((d) => d as Map<String, dynamic>).toList();
        }
      }
      return [];
    } catch (e) {
      print('❌ [ApiService] getDocs error: $e');
      return [];
    }
  }

  /// Create a new document in a collection with a randomly generated MongoDB-like ID.
  Future<String?> addDoc(String collection, Map<String, dynamic> data) async {
    final randomId = 'mongo_${Random().nextInt(10000000)}_${DateTime.now().millisecondsSinceEpoch}';
    try {
      final response = await _dio.post(
        '$_baseUrl/api/doc',
        data: {
          'path': collection,
          'id': randomId,
          'data': data,
          'merge': false,
        },
      );
      if (response.statusCode == 200) {
        return randomId;
      }
      return null;
    } catch (e) {
      print('❌ [ApiService] addDoc error: $e');
      return null;
    }
  }

  /// Write or merge data onto a specific document.
  Future<bool> setDoc(String collection, String id, Map<String, dynamic> data, {bool merge = false}) async {
    try {
      final response = await _dio.post(
        '$_baseUrl/api/doc',
        data: {
          'path': collection,
          'id': id,
          'data': data,
          'merge': merge,
        },
      );
      return response.statusCode == 200;
    } catch (e) {
      print('❌ [ApiService] setDoc error: $e');
      return false;
    }
  }

  /// Modify specific fields on a document atomically.
  Future<bool> updateDoc(String collection, String id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.patch(
        '$_baseUrl/api/doc',
        data: {
          'path': collection,
          'id': id,
          'data': data,
        },
      );
      return response.statusCode == 200;
    } catch (e) {
      print('❌ [ApiService] updateDoc error: $e');
      return false;
    }
  }

  /// Execute atomic ACID operations across multiple documents (critical for booking slots safety).
  Future<bool> runTransaction({
    required List<Map<String, dynamic>> operations,
    List<Map<String, dynamic>>? preconditions,
  }) async {
    try {
      final response = await _dio.post(
        '$_baseUrl/api/transaction',
        data: {
          'preconditions': preconditions ?? [],
          'operations': operations,
        },
      );
      return response.statusCode == 200;
    } catch (e) {
      print('❌ [ApiService] runTransaction error: $e');
      return false;
    }
  }
}
