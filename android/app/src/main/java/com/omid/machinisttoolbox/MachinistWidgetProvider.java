package com.omid.machinisttoolbox;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;

public class MachinistWidgetProvider extends AppWidgetProvider {
	private static final String[] TOOL_KEYS = {
			"programmingTraining", "calculations", "machiningTerms", "notes"
	};
	private static final int[] BUTTON_IDS = {
			R.id.widget_training, R.id.widget_calculator, R.id.widget_terms, R.id.widget_notes
	};

	@Override
	public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
		for (int widgetId : appWidgetIds) {
			RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.machinist_widget);
			for (int i = 0; i < BUTTON_IDS.length; i++) {
				Intent intent = new Intent(context, MainActivity.class);
				intent.putExtra(MainActivity.EXTRA_WIDGET_TOOL, TOOL_KEYS[i]);
				intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
				int pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT;
				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
					pendingIntentFlags |= PendingIntent.FLAG_IMMUTABLE;
				}
				PendingIntent pendingIntent = PendingIntent.getActivity(
						context, 4100 + i, intent, pendingIntentFlags);
				views.setOnClickPendingIntent(BUTTON_IDS[i], pendingIntent);
			}
			manager.updateAppWidget(widgetId, views);
		}
	}
}
