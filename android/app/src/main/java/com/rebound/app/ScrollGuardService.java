package com.rebound.app;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.*;
import android.view.*;
import android.widget.*;
import android.os.*;
import android.graphics.PixelFormat;
import android.content.SharedPreferences;
import android.provider.Settings;
import java.util.*;
import java.text.SimpleDateFormat;

public class ScrollGuardService extends AccessibilityService {
    public static final Set<String> SUPPORTED=new HashSet<>(Arrays.asList("com.instagram.android","com.google.android.youtube","com.facebook.katana","com.snapchat.android","com.twitter.android","com.zhiliaoapp.musically","com.ss.android.ugc.trill"));
    private final Handler handler=new Handler(Looper.getMainLooper());
    private String active="",modalKind="",today="";
    private boolean shortSurface=false;
    private long lastTick=0,lastScroll=0,lastUsageRead=0,usageMs=0;
    private View overlay;private TextView badge;
    private SharedPreferences prefs(){return getSharedPreferences("guard",0);}
    public static String day(){return new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(new Date())+":";}
    private WindowManager windows(){return (WindowManager)getSystemService(WINDOW_SERVICE);}
    private boolean enabled(){return prefs().getBoolean(active+".enabled",prefs().contains(active));}
    private int allowance(){return prefs().getInt(active+".sessionMinutes",prefs().getInt(active,20));}
    // Allowance survives app switches and service restarts; only detected short-video time consumes it.
    private void consume(long delta){
        if(active.isEmpty()||!shortSurface||!enabled()||overlay!=null||!prefs().getBoolean(active+".started",false))return;
        long remaining=prefs().getLong(active+".remaining",0);
        if(remaining<=0)return;
        long spent=Math.min(remaining,Math.max(0,delta));
        prefs().edit().putLong(active+".remaining",remaining-spent).putLong(today+active+".scrollMs",prefs().getLong(today+active+".scrollMs",0)+spent).apply();
    }
    private final Runnable tick=new Runnable(){public void run(){
        long now=SystemClock.elapsedRealtime();
        if(((PowerManager)getSystemService(POWER_SERVICE)).isInteractive())consume(Math.min(1500,Math.max(0,now-lastTick)));
        lastTick=now;inspect();handler.postDelayed(this,1000);
    }};
    @Override protected void onServiceConnected(){lastTick=SystemClock.elapsedRealtime();handler.removeCallbacks(tick);handler.post(tick);}
    private AccessibilityNodeInfo applicationRoot(){
        for(AccessibilityWindowInfo window:getWindows())if(window.getType()==AccessibilityWindowInfo.TYPE_APPLICATION)return window.getRoot();
        return getRootInActiveWindow();
    }
    private void inspect(){
        if(!((PowerManager)getSystemService(POWER_SERVICE)).isInteractive()){active="";shortSurface=false;hide();hideBadge();return;}
        String newDay=day();
        if(!newDay.equals(today)){today=newDay;for(String pkg:SUPPORTED)if(!today.equals(prefs().getString(pkg+".day","")))prefs().edit().putString(pkg+".day",today).putBoolean(pkg+".started",false).putLong(pkg+".remaining",prefs().getInt(pkg,20)*60000L).apply();}
        AccessibilityNodeInfo root=applicationRoot();
        String pkg=root==null||root.getPackageName()==null?"":root.getPackageName().toString();
        if(pkg.equals(getPackageName())&&overlay!=null){if(root!=null)root.recycle();return;}
        if(!pkg.equals(active)){hide();hideBadge();active=pkg;shortSurface=false;lastUsageRead=0;lastScroll=0;}
        if(!SUPPORTED.contains(active)){shortSurface=false;hide();hideBadge();if(root!=null)root.recycle();return;}
        shortSurface=root!=null&&hasShortSurface(root,0);if(root!=null)root.recycle();
        long now=SystemClock.elapsedRealtime();
        if(now-lastUsageRead>5000||lastUsageRead==0){usageMs=ReboundGuardPlugin.usageToday(this,active);lastUsageRead=now;}
        long focusEnd=prefs().getLong("focusEnd",0);int daily=prefs().getInt(active+".daily",0);String reason="";
        if(focusEnd>System.currentTimeMillis()&&enabled())reason="focus";
        else if(daily>0&&usageMs>=daily*60000L)reason="daily";
        else if(shortSurface&&enabled()){
            if(prefs().getLong(active+".breakEnd",0)>System.currentTimeMillis())reason="break";
            else if(!prefs().getBoolean(active+".started",false))reason="ask";
            else if(prefs().getLong(active+".remaining",0)<=0)reason="limit";
        }
        if(reason.isEmpty()){hide();showBadge();}
        else if(!reason.equals(modalKind)){hideBadge();if(reason.equals("ask"))ask();else intervention(reason);}
        if(reason.equals("focus"))showBadge();
    }
    @Override public void onAccessibilityEvent(AccessibilityEvent event){
        if(event.getEventType()!=AccessibilityEvent.TYPE_VIEW_SCROLLED)return;
        if(!shortSurface||!enabled()||overlay!=null||!active.contentEquals(event.getPackageName()==null?"":event.getPackageName()))return;
        AccessibilityNodeInfo source=event.getSource();
        boolean feed=source!=null&&isFeedId(source.getViewIdResourceName());if(source!=null)source.recycle();
        long now=SystemClock.elapsedRealtime();
        if(feed&&now-lastScroll>=1800){lastScroll=now;prefs().edit().putInt("scrolls",prefs().getInt("scrolls",0)+1).putInt(today+active+".videos",prefs().getInt(today+active+".videos",0)+1).apply();}
    }
    private boolean isFeedId(String name){
        if(name==null)return false;String id=name.toLowerCase(Locale.ROOT);
        if(id.contains("tab")||id.contains("button")||id.contains("icon")||id.contains("thumbnail"))return false;
        if(active.equals("com.google.android.youtube"))return id.contains("reel_recycler")||id.contains("reel_player")||id.contains("shorts_player");
        if(active.equals("com.instagram.android"))return id.contains("clips_viewer")||id.contains("clips_video")||id.contains("reel_viewer")||id.contains("clips_pager");
        if(active.equals("com.snapchat.android"))return id.contains("spotlight")&&(id.contains("player")||id.contains("pager")||id.contains("feed"));
        if(active.equals("com.facebook.katana"))return id.contains("reels")&&(id.contains("player")||id.contains("pager")||id.contains("feed"));
        if(active.contains("musically")||active.endsWith("trill"))return id.contains("feed_viewpager")||id.contains("video_view")||id.contains("player_container");
        return id.contains("video_pager")||id.contains("immersive_video");
    }
    private boolean hasShortSurface(AccessibilityNodeInfo node,int depth){
        if(depth>12||!node.isVisibleToUser())return false;
        if(isFeedId(node.getViewIdResourceName()))return true;
        for(int i=0;i<Math.min(node.getChildCount(),60);i++){AccessibilityNodeInfo child=node.getChild(i);if(child!=null){boolean found=hasShortSurface(child,depth+1);child.recycle();if(found)return true;}}
        return false;
    }
    private int dp(int value){return (int)(value*getResources().getDisplayMetrics().density);}
    private LinearLayout panel(String kind,String title){
        hide();modalKind=kind;LinearLayout box=new LinearLayout(this);box.setOrientation(LinearLayout.VERTICAL);box.setPadding(dp(22),dp(26),dp(22),dp(24));box.setBackgroundColor(0xff151b17);
        TextView text=new TextView(this);text.setText(title);text.setTextSize(22);text.setTextColor(0xffddf5dc);box.addView(text);
        box.setGravity(Gravity.CENTER_VERTICAL);
        WindowManager.LayoutParams layout=new WindowManager.LayoutParams(-1,-1,WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,0,PixelFormat.TRANSLUCENT);layout.gravity=Gravity.CENTER;
        overlay=box;try{windows().addView(box,layout);}catch(RuntimeException error){overlay=null;modalKind="";}return box;
    }
    private void button(LinearLayout box,String text,Runnable action){Button button=new Button(this);button.setText(text);box.addView(button);button.setOnClickListener(v->action.run());}
    private void startAllowance(int minutes){prefs().edit().putBoolean(active+".started",true).putInt(active+".sessionMinutes",minutes).putLong(active+".remaining",minutes*60000L).apply();lastTick=SystemClock.elapsedRealtime();hide();}
    private void ask(){
        LinearLayout box=panel("ask","Rebound · Short videos\nHow many minutes do you want to watch?");
        EditText minutes=new EditText(this);minutes.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);minutes.setText(String.valueOf(prefs().getInt(active,20)));minutes.setTextColor(0xffeef6ed);minutes.setContentDescription("Watch allowance in minutes");box.addView(minutes);
        button(box,"Start watching",()->{try{int value=Integer.parseInt(minutes.getText().toString());if(value<1||value>180){minutes.setError("Choose 1–180 minutes");return;}startAllowance(value);}catch(NumberFormatException error){minutes.setError("Enter minutes");}});
        button(box,"Leave short videos",()->{hide();performGlobalAction(GLOBAL_ACTION_BACK);});
    }
    private void intervention(String kind){
        String title=kind.equals("focus")?"This app is blocked during focus":kind.equals("daily")?"Daily app limit reached":kind.equals("break")?"Short videos are blocked during your break":"Reels / Shorts are blocked";
        LinearLayout box=panel(kind,"Rebound\n"+title+"\n"+Math.round(prefs().getLong(today+active+".scrollMs",0)/60000.0)+" min scrolling today · ~"+prefs().getInt(today+active+".videos",0)+" videos");
        TextView pause=new TextView(this);pause.setTextColor(0xffb2c3ad);pause.setText("Pause for 5 seconds. Drink water, look around, rest, or walk around.");box.addView(pause);
        button(box,"Leave app",()->{hide();performGlobalAction(GLOBAL_ACTION_HOME);});
        if(kind.equals("limit")){
            Button extend=new Button(this);extend.setText("Continue "+allowance()+" min");extend.setEnabled(false);box.addView(extend);extend.setOnClickListener(v->startAllowance(allowance()));
            handler.postDelayed(()->{if(overlay==box){extend.setEnabled(true);pause.setText("Choose a break or another timed allowance.");}},5000);
            button(box,"Take a 5-minute break",()->{prefs().edit().putLong(active+".breakEnd",System.currentTimeMillis()+300000).apply();hide();performGlobalAction(GLOBAL_ACTION_HOME);});
        }
    }
    private void showBadge(){
        boolean focusing=prefs().getLong("focusEnd",0)>System.currentTimeMillis();
        if(!Settings.canDrawOverlays(this)||(!focusing&&(!shortSurface||!enabled()))){hideBadge();return;}
        if(badge==null){badge=new TextView(this);badge.setTextColor(0xffd9ffd5);badge.setTextSize(12);badge.setPadding(dp(12),dp(8),dp(12),dp(8));badge.setBackgroundColor(0xed18311e);WindowManager.LayoutParams layout=new WindowManager.LayoutParams(-2,-2,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,PixelFormat.TRANSLUCENT);layout.gravity=Gravity.TOP|Gravity.END;layout.y=dp(80);try{windows().addView(badge,layout);}catch(RuntimeException error){badge=null;return;}}
        long focus=prefs().getLong("focusAccumulated",0)+(focusing?Math.max(0,System.currentTimeMillis()-prefs().getLong("focusStart",System.currentTimeMillis())):0);
        badge.setText("Rebound · ~"+prefs().getInt(today+active+".videos",0)+" videos\nScrolling "+clock(prefs().getLong(today+active+".scrollMs",0))+" · Focus "+clock(focus)+"\nRemaining "+clock(prefs().getLong(active+".remaining",0)));
    }
    private String clock(long ms){long sec=Math.max(0,ms)/1000;return String.format(Locale.US,"%02d:%02d",sec/60,sec%60);}
    private void hideBadge(){if(badge!=null){try{windows().removeView(badge);}catch(IllegalArgumentException ignored){}badge=null;}}
    private void hide(){if(overlay!=null){try{windows().removeView(overlay);}catch(IllegalArgumentException ignored){}overlay=null;}modalKind="";}
    @Override public void onInterrupt(){shortSurface=false;hide();hideBadge();}
    @Override public void onDestroy(){handler.removeCallbacksAndMessages(null);hide();hideBadge();super.onDestroy();}
}
