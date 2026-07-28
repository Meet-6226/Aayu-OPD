import 'dart:html' as html;
import 'dart:ui_web' as ui_web;
import 'package:flutter/material.dart';

Widget createWebView(String url, void Function(bool isLoading) onLoadingStatusChanged) {
  return WebWebView(url: url, onLoadingStatusChanged: onLoadingStatusChanged);
}

class WebWebView extends StatefulWidget {
  final String url;
  final void Function(bool isLoading) onLoadingStatusChanged;

  const WebWebView({super.key, required this.url, required this.onLoadingStatusChanged});

  @override
  State<WebWebView> createState() => _WebWebViewState();
}

class _WebWebViewState extends State<WebWebView> {
  late String _viewId;

  @override
  void initState() {
    super.initState();
    _viewId = 'iframe-view-${DateTime.now().millisecondsSinceEpoch}';
    _registerIframe();

    // Mock web page loading sequence
    widget.onLoadingStatusChanged(true);
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        widget.onLoadingStatusChanged(false);
      }
    });
  }

  @override
  void didUpdateWidget(covariant WebWebView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url != widget.url) {
      _registerIframe();
      widget.onLoadingStatusChanged(true);
      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted) {
          widget.onLoadingStatusChanged(false);
        }
      });
    }
  }

  void _registerIframe() {
    ui_web.platformViewRegistry.registerViewFactory(
      _viewId,
      (int viewId) {
        final iframe = html.IFrameElement()
          ..src = widget.url
          ..style.border = 'none'
          ..style.width = '100%'
          ..style.height = '100%';
        return iframe;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _viewId);
  }
}
