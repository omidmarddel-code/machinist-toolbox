package com.omid.machinisttoolbox;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class MainActivity extends BridgeActivity {

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		configurePdfOpening();
		hideSystemBars();
	}

	@Override
	public void onWindowFocusChanged(boolean hasFocus) {
		super.onWindowFocusChanged(hasFocus);
		if (hasFocus) {
			hideSystemBars();
		}
	}

	private void hideSystemBars() {
		getWindow().getDecorView().setSystemUiVisibility(
				View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
						| View.SYSTEM_UI_FLAG_FULLSCREEN
						| View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
						| View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
						| View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
						| View.SYSTEM_UI_FLAG_LAYOUT_STABLE
		);
	}

	private void configurePdfOpening() {
		WebView webView = getBridge().getWebView();
		webView.addJavascriptInterface(new PdfBridge(), "AndroidPdf");
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
