import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

Widget createWebView(String url, void Function(bool isLoading) onLoadingStatusChanged) {
  return MobileWebView(url: url, onLoadingStatusChanged: onLoadingStatusChanged);
}

class MobileWebView extends StatefulWidget {
  final String url;
  final void Function(bool isLoading) onLoadingStatusChanged;

  const MobileWebView({super.key, required this.url, required this.onLoadingStatusChanged});

  @override
  State<MobileWebView> createState() => _MobileWebViewState();
}

class _MobileWebViewState extends State<MobileWebView> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0F172A))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            widget.onLoadingStatusChanged(true);
          },
          onPageFinished: (String url) {
            widget.onLoadingStatusChanged(false);
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  void didUpdateWidget(covariant MobileWebView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url != widget.url) {
      _controller.loadRequest(Uri.parse(widget.url));
    }
  }

  @override
  Widget build(BuildContext context) {
    return WebViewWidget(controller: _controller);
  }
}
