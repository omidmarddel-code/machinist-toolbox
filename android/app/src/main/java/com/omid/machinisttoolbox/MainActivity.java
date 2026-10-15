package com.omid.machinisttoolbox;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class MainActivity extends BridgeActivity {
	static final String EXTRA_WIDGET_TOOL = "com.omid.machinisttoolbox.WIDGET_TOOL";
	private WebView appWebView;
	private boolean darkTheme = false;
	private final Handler widgetRouteHandler = new Handler(Looper.getMainLooper());

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		configurePdfOpening();
		applyNativeTheme(false);
		hideSystemBars();
		routeWidgetIntent(getIntent(), 0);
	}

	@Override
	protected void onNewIntent(Intent intent) {
		super.onNewIntent(intent);
		setIntent(intent);
		routeWidgetIntent(intent, 0);
	}

	private void routeWidgetIntent(Intent intent, int attempt) {
		if (intent == null || !intent.hasExtra(EXTRA_WIDGET_TOOL) || attempt > 30) return;
		String tool = intent.getStringExtra(EXTRA_WIDGET_TOOL);
		if (tool == null || !tool.matches("[A-Za-z0-9]+")) return;
		if (appWebView == null) {
			widgetRouteHandler.postDelayed(() -> routeWidgetIntent(intent, attempt + 1), 250);
			return;
		}
		appWebView.evaluateJavascript(
				"(function(){if(typeof window.openToolFromWidget==='function')return window.openToolFromWidget('" + tool + "')!==false;return false;})()",
				result -> {
					if ("true".equals(result)) intent.removeExtra(EXTRA_WIDGET_TOOL);
					else widgetRouteHandler.postDelayed(() -> routeWidgetIntent(intent, attempt + 1), 250);
				});
	}

	@Override
	public void onWindowFocusChanged(boolean hasFocus) {
		super.onWindowFocusChanged(hasFocus);
		if (hasFocus) {
			hideSystemBars();
		}
	}

	private void hideSystemBars() {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
			WindowInsetsController controller = getWindow().getInsetsController();
			if (controller != null) {
				// Hide only the status bar; keep Android's bottom navigation buttons visible.
				controller.hide(WindowInsets.Type.statusBars());
				controller.setSystemBarsBehavior(
						WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
			}
		} else {
			getWindow().getDecorView().setSystemUiVisibility(
					View.SYSTEM_UI_FLAG_FULLSCREEN
							| View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
							| View.SYSTEM_UI_FLAG_LAYOUT_STABLE
							| (darkTheme ? 0 : View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR)
			);
		}
		updateNavigationBarTheme();
	}

	private void configurePdfOpening() {
		WebView webView = getBridge().getWebView();
		appWebView = webView;
		// Match the mobile boot background so the desktop page cannot flash white.
		webView.setBackgroundColor(Color.rgb(241, 245, 249));
		webView.addJavascriptInterface(new PdfBridge(), "AndroidPdf");
		webView.addJavascriptInterface(new ThemeBridge(), "AndroidTheme");
	}

	private void applyNativeTheme(boolean dark) {
		darkTheme = dark;
		runOnUiThread(() -> {
			int background = dark ? Color.rgb(11, 18, 32) : Color.rgb(241, 245, 249);
			getWindow().setBackgroundDrawable(new ColorDrawable(background));
			if (appWebView != null) appWebView.setBackgroundColor(background);
			updateNavigationBarTheme();
		});
	}

	private void updateNavigationBarTheme() {
		getWindow().setNavigationBarColor(darkTheme ? Color.rgb(11, 18, 32) : Color.rgb(242, 244, 248));
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
			WindowInsetsController controller = getWindow().getInsetsController();
			if (controller != null) {
				int lightBars = darkTheme ? 0 : WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
				controller.setSystemBarsAppearance(lightBars, WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
			}
		} else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			View decor = getWindow().getDecorView();
			int flags = decor.getSystemUiVisibility();
			flags = darkTheme
					? flags & ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
					: flags | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
			decor.setSystemUiVisibility(flags);
		}
	}

	private class ThemeBridge {
		@JavascriptInterface
		public void setDark(boolean dark) {
			applyNativeTheme(dark);
		}
	}

	private class PdfBridge {
		@JavascriptInterface
		public void open(String fileName) {
			openPdf(fileName);
		}
	}

	private void openPdf(String fileName) {
		File cachedPdf = new File(getCacheDir(), fileName);
		try (InputStream input = getAssets().open("public/pdf/" + fileName);
			 FileOutputStream output = new FileOutputStream(cachedPdf)) {
			byte[] buffer = new byte[8192];
			int length;
			while ((length = input.read(buffer)) != -1) {
				output.write(buffer, 0, length);
			}

			Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", cachedPdf);
			Intent intent = new Intent(Intent.ACTION_VIEW, uri);
			intent.setDataAndType(uri, "application/pdf");
			intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
			startActivity(intent);
		} catch (IOException | ActivityNotFoundException error) {
			error.printStackTrace();
		}
	}
}
