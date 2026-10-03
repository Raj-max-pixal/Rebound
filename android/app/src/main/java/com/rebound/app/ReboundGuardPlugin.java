package com.rebound.app;

import android.app.AppOpsManager;
import android.content.*;
import android.provider.Settings;
import android.os.Build;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name="ReboundGuard")
public class ReboundGuardPlugin extends Plugin {

    /** Open Usage Access or Accessibility settings so the user can grant the permission. */
    @PluginMethod public void permissions(PluginCall call) {
        String kind = call.getString("kind", "usage");
        try {
            Intent intent;
            if ("accessibility".equals(kind)) {
                intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            } else {
                intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Cannot open Android settings: " + e.getMessage(), e);
        }
    }

    /** Save the per-app scroll time limit (in minutes, 1–180). */
    @PluginMethod public void configure(PluginCall call) {
        String pkg = call.getString("package", "com.instagram.android");
        if (!ScrollGuardService.SUPPORTED.contains(pkg)) {
            call.reject("Unsupported app package: " + pkg);
            return;
        }
        int minutes = Math.max(1, Math.min(180, call.getInt("minutes", 20)));
        getContext().getSharedPreferences("guard", 0)
                .edit().putInt(pkg, minutes).apply();
        JSObject result = new JSObject();
        result.put("package", pkg);
        result.put("minutes", minutes);
        call.resolve(result);
    }

    /** Return current permission state and scroll count. */
    @PluginMethod public void status(PluginCall call) {
        // Check Usage Access permission
        AppOpsManager ops = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
        int mode = ops.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            getContext().getPackageName()
        );
        boolean usage = (mode == AppOpsManager.MODE_ALLOWED);

        // Check Accessibility service enabled
        String enabled = Settings.Secure.getString(
            getContext().getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        boolean accessibility = (enabled != null &&
            enabled.contains(getContext().getPackageName() + "/"));

        // Get scroll count from shared prefs
        int scrolls = getContext().getSharedPreferences("guard", 0)
            .getInt("scrolls", 0);

        JSObject result = new JSObject();
        result.put("usage", usage);
        result.put("accessibility", accessibility);
        result.put("scrolls", scrolls);
        call.resolve(result);
    }

    /** Share text using Android's native share sheet. */
    @PluginMethod public void share(PluginCall call) {
        String text = call.getString("text", "Rebound — Focus & Study");
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_TEXT, text);
        Intent chooser = Intent.createChooser(shareIntent, "Share with");
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getActivity().startActivity(chooser);
        call.resolve();
    }

    /** Reset the scroll counter to zero. */
    @PluginMethod public void resetScrolls(PluginCall call) {
        getContext().getSharedPreferences("guard", 0)
            .edit().putInt("scrolls", 0).apply();
        call.resolve();
    }

    /** Open the app-specific settings page for a given package. */
    @PluginMethod public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Cannot open app settings", e);
        }
    }
}
