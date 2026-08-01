import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_patient_app/main.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  testWidgets('Apollo patient app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: ApolloPatientApp(),
      ),
    );
    expect(find.byType(ApolloPatientApp), findsOneWidget);
  });
}
