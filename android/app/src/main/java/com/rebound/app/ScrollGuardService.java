package com.rebound.app;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.*;
import android.view.*;
import android.widget.*;
import android.os.*;
import android.graphics.PixelFormat;
import android.content.SharedPreferences;
import java.util.*;

public class ScrollGuardService extends AccessibilityService {
    public static final Set<String> SUPPORTED=new HashSet<>(Arrays.asList("com.instagram.android","com.google.android.youtube","com.facebook.katana","com.snapchat.android","com.twitter.android","com.zhiliaoapp.musically","com.ss.android.ugc.trill"));
    private final Handler handler=new Handler(Looper.getMainLooper());
    private String active=""; private long deadline=0,lastScroll=0; private View overlay; private TextView badge;
    private final Map<String,Long> breaks=new HashMap<>();
    private SharedPreferences prefs(){return getSharedPreferences("guard",0);}
    private final Runnable tick=new Runnable(){public void run(){
        if(!((PowerManager)getSystemService(POWER_SERVICE)).isInteractive()){active="";hide();}
        if(!active.isEmpty()&&deadline>0&&SystemClock.elapsedRealtime()>=deadline&&overlay==null) intervention();
        handler.postDelayed(this,1000);
    }};
    @Override protected void onServiceConnected(){handler.post(tick);}
    @Override public void onAccessibilityEvent(AccessibilityEvent e){
        String pkg=e.getPackageName()==null?"":e.getPackageName().toString();
        if(e.getEventType()==AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED&&!pkg.equals(getPackageName())&&!pkg.equals("com.android.systemui")){
            if(!pkg.equals(active)){
                hide(); active="";deadline=0;
                if(SUPPORTED.contains(pkg)&&prefs().contains(pkg)){
                    active=pkg;
                    if(breaks.getOrDefault(pkg,0L)>SystemClock.elapsedRealtime())intervention(); else ask();
                }
            }
        }
        if(!active.equals(pkg)||e.getEventType()!=AccessibilityEvent.TYPE_VIEW_SCROLLED)return;
        AccessibilityNodeInfo root=getRootInActiveWindow();
        boolean shortVideo=root!=null&&hasShortSurface(root,0);
        long now=SystemClock.elapsedRealtime();
        if(shortVideo&&now-lastScroll>1800){lastScroll=now;int count=prefs().getInt("scrolls",0)+1;prefs().edit().putInt("scrolls",count).apply(); if(badge!=null)badge.setText("Rebound · ~"+count+" videos");}
    }
    private boolean hasShortSurface(AccessibilityNodeInfo node,int depth){
        if(depth>9)return false;
        String id=String.valueOf(node.getViewIdResourceName()).toLowerCase(Locale.ROOT);
        if(id.contains("reel")||id.contains("shorts")||id.contains("spotlight"))return true;
        for(int i=0;i<node.getChildCount();i++){AccessibilityNodeInfo child=node.getChild(i);if(child!=null&&hasShortSurface(child,depth+1))return true;}return false;
    }
    private LinearLayout panel(String title){
        hide(); LinearLayout box=new LinearLayout(this);box.setOrientation(1);box.setPadding(35,50,35,35);box.setBackgroundColor(0xff151b17);
        TextView text=new TextView(this);text.setText(title);text.setTextSize(23);text.setTextColor(0xffdfffdf);box.addView(text);
        WindowManager.LayoutParams p=new WindowManager.LayoutParams(-1,-2,WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,PixelFormat.TRANSLUCENT);p.gravity=Gravity.CENTER;
        overlay=box;((WindowManager)getSystemService(WINDOW_SERVICE)).addView(box,p);return box;
    }
    private void button(LinearLayout box,String text,Runnable action){Button b=new Button(this);b.setText(text);box.addView(b);b.setOnClickListener(v->action.run());}
    private void ask(){LinearLayout box=panel("Rebound\nHow many minutes do you want to spend?");for(int minutes:new int[]{5,10,20,prefs().getInt(active,20)})button(box,minutes+" minutes",()->{deadline=SystemClock.elapsedRealtime()+minutes*60000L;hide();});button(box,"I'm done — go home",()->{hide();performGlobalAction(GLOBAL_ACTION_HOME);});}
    private void intervention(){LinearLayout box=panel("Time to Rebound\nYour app time has ended. Take a break.");
        button(box,"Take a 5-minute break",()->{breaks.put(active,SystemClock.elapsedRealtime()+300000);hide();performGlobalAction(GLOBAL_ACTION_HOME);});
        if(breaks.getOrDefault(active,0L)<=SystemClock.elapsedRealtime())button(box,"Continue 10 minutes",()->{deadline=SystemClock.elapsedRealtime()+600000;hide();});
        button(box,"I'm done",()->{breaks.put(active,SystemClock.elapsedRealtime()+300000);hide();performGlobalAction(GLOBAL_ACTION_HOME);});
    }
    private void hide(){if(overlay!=null){((WindowManager)getSystemService(WINDOW_SERVICE)).removeView(overlay);overlay=null;}}
    @Override public void onInterrupt(){hide();}
    @Override public void onDestroy(){handler.removeCallbacksAndMessages(null);hide();super.onDestroy();}
}
