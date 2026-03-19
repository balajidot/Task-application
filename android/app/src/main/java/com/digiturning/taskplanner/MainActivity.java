package com.digiturning.taskplanner;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity is the entry point for the Android application.
 * It extends {@link BridgeActivity} to initialize the Capacitor bridge,
 * allowing for communication between the web app and native Android code.
 */
public class MainActivity extends BridgeActivity {

    /**
     * Initializes the activity and registers custom Capacitor plugins.
     * 
     * @param savedInstanceState If the activity is being re-initialized after
     * previously being shut down then this Bundle contains the data it most
     * recently supplied in {@link #onSaveInstanceState}. Note: Otherwise it is null.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom plugins before calling super.onCreate
        registerPlugin(DeviceSettingsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
