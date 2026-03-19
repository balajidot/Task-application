package com.digiturning.taskplanner;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor plugin to provide access to Android device settings.
 */
@CapacitorPlugin(name = "DeviceSettings")
public class DeviceSettingsPlugin extends Plugin {

    /**
     * Opens the device's battery optimization settings.
     * If the specific "Ignore Battery Optimizations" settings are not available, 
     * it falls back to the general battery saver settings.
     * 
     * @param call The Capacitor plugin call.
     */
    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        if (intent.resolveActivity(context.getPackageManager()) != null) {
            context.startActivity(intent);
            call.resolve();
        } else {
            // Fallback to battery saver settings if specific ignore list isn't available
            Intent fallback = new Intent(Settings.ACTION_BATTERY_SAVER_SETTINGS);
            if (fallback.resolveActivity(context.getPackageManager()) != null) {
                context.startActivity(fallback);
                call.resolve();
            } else {
                call.reject("Could not open battery settings");
            }
        }
    }

    /**
     * Opens the application details settings for the current app.
     * This allows the user to manage permissions, clear cache, etc.
     * 
     * @param call The Capacitor plugin call.
     */
    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        Uri uri = Uri.fromParts("package", context.getPackageName(), null);
        intent.setData(uri);
        if (intent.resolveActivity(context.getPackageManager()) != null) {
            context.startActivity(intent);
            call.resolve();
        } else {
            call.reject("Could not open app settings");
        }
    }
}
