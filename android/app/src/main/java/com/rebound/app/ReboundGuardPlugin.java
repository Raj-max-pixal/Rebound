package com.rebound.app;

import android.app.AppOpsManager;
import android.content.*;
import android.provider.Settings;
import android.os.Build;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Handler;
import android.os.Looper;
import java.util.Calendar;

@CapacitorPlugin(name="ReboundGuard", permissions={
    @Permission(alias="notifications",strings={"android.permission.POST_NOTIFICATIONS"}),
    @Permission(alias="location",strings={"android.permission.ACCESS_COARSE_LOCATION"})
})
public class ReboundGuardPlugin extends Plugin {

    /** Open Usage Access or Accessibility settings so the user can grant the permission. */
    @PluginMethod public void permissions(PluginCall call) {
        String kind = call.getString("kind", "usage");
        if ("notifications".equals(kind)) {
            if(Build.VERSION.SDK_INT>=33)requestPermissionForAlias("notifications",call,"permissionResult");else call.resolve();
            return;
        }
        try {
            Intent intent;
            if ("accessibility".equals(kind)) {
                intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
                intent.putExtra(":settings:fragment_args_key",new ComponentName(getContext(),ScrollGuardService.class).flattenToString());
            } else if ("overlay".equals(kind)) {
                intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,android.net.Uri.parse("package:"+getContext().getPackageName()));
            } else {
                intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
                intent.setData(android.net.Uri.parse("package:"+getContext().getPackageName()));
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
        getContext().getSharedPreferences("guard", 0).edit().putInt(pkg, minutes)
                .putBoolean(pkg+".enabled",call.getBoolean("enabled",true))
                .putInt(pkg+".daily",Math.max(0,Math.min(1440,call.getInt("dailyMinutes",0))))
                .putLong(pkg+".remaining",minutes*60000L).putBoolean(pkg+".started",false).apply();
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
        boolean accessibility=false;
        if(enabled!=null)for(String name:enabled.split(":")){ComponentName component=ComponentName.unflattenFromString(name);if(new ComponentName(getContext(),ScrollGuardService.class).equals(component))accessibility=true;}

        // Get scroll count from shared prefs
        int scrolls = getContext().getSharedPreferences("guard", 0)
            .getInt("scrolls", 0);

        JSObject result = new JSObject();
        result.put("usage", usage);
        result.put("accessibility", accessibility);
        result.put("scrolls", scrolls);
        result.put("overlay",Settings.canDrawOverlays(getContext()));
        result.put("notifications",androidx.core.app.NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        JSArray apps=new JSArray();
        String day=ScrollGuardService.day();
        for(String pkg:ScrollGuardService.SUPPORTED){JSObject row=new JSObject();row.put("package",pkg);row.put("usageMs",usageToday(getContext(),pkg));row.put("scrollMs",getContext().getSharedPreferences("guard",0).getLong(day+pkg+".scrollMs",0));row.put("videos",getContext().getSharedPreferences("guard",0).getInt(day+pkg+".videos",0));apps.put(row);}
        result.put("apps",apps);
        call.resolve(result);
    }

    static long usageToday(Context context,String pkg){
        Calendar midnight=Calendar.getInstance();midnight.set(Calendar.HOUR_OF_DAY,0);midnight.set(Calendar.MINUTE,0);midnight.set(Calendar.SECOND,0);midnight.set(Calendar.MILLISECOND,0);
        UsageStatsManager manager=(UsageStatsManager)context.getSystemService(Context.USAGE_STATS_SERVICE);
        UsageStats stats=manager.queryAndAggregateUsageStats(midnight.getTimeInMillis(),System.currentTimeMillis()).get(pkg);
        return stats==null?0:stats.getTotalTimeInForeground();
    }

    @PermissionCallback private void permissionResult(PluginCall call){call.resolve();}
    @PluginMethod public void launchApp(PluginCall call){
        String pkg=call.getString("package","");
        if(!ScrollGuardService.SUPPORTED.contains(pkg)){call.reject("Unsupported app");return;}
        Intent intent=getContext().getPackageManager().getLaunchIntentForPackage(pkg);
        if(intent==null){call.reject("This app is not installed on this device.");return;}
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);getContext().startActivity(intent);call.resolve();
    }
    @PluginMethod public void focusState(PluginCall call){
        boolean running=call.getBoolean("running",false);long now=System.currentTimeMillis();
        long seconds=Math.max(0,Math.min(10800,call.getInt("remainingSeconds",0)));
        getContext().getSharedPreferences("guard",0).edit().putLong("focusEnd",running?now+seconds*1000:0).putLong("focusStart",running?now:0).putLong("focusAccumulated",Math.max(0,call.getLong("elapsedMs",0L))).apply();call.resolve();
    }
    @PluginMethod public void location(PluginCall call){
        if(getPermissionState("location")!=PermissionState.GRANTED){requestPermissionForAlias("location",call,"locationPermission");return;}
        readLocation(call);
    }
    @PermissionCallback private void locationPermission(PluginCall call){
        if(getPermissionState("location")!=PermissionState.GRANTED){call.reject("Location permission was not granted.");return;}readLocation(call);
    }
    @SuppressWarnings("MissingPermission") private void readLocation(PluginCall call){
        getActivity().runOnUiThread(()->{
            LocationManager manager=(LocationManager)getContext().getSystemService(Context.LOCATION_SERVICE);
            if(!manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)){call.reject("Turn on device Location to preview your position.");return;}
            Handler handler=new Handler(Looper.getMainLooper());final boolean[] finished={false};
            LocationListener listener=new LocationListener(){public void onLocationChanged(Location value){if(finished[0])return;finished[0]=true;manager.removeUpdates(this);JSObject result=new JSObject();result.put("latitude",value.getLatitude());result.put("longitude",value.getLongitude());result.put("accuracy",value.getAccuracy());call.resolve(result);}};
            try{manager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER,0,0,listener,Looper.getMainLooper());handler.postDelayed(()->{if(!finished[0]){finished[0]=true;manager.removeUpdates(listener);call.reject("Location timed out. Try again outdoors or near Wi-Fi.");}},15000);}catch(Exception error){call.reject("Location unavailable: "+error.getMessage());}
        });
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
