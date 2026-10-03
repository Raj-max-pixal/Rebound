package com.rebound.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(android.os.Bundle state) {
        registerPlugin(ReboundGuardPlugin.class);
        super.onCreate(state);
    }
}
