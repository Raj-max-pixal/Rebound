# Rebound 1.0.2 test build

## Included
- Native bridge fix: injected ReboundGuard plugin works without importing Capacitor JS registration.
- Home sign-in entry, Profile account controls, saved wardrobe rendering.
- Location permission and private coordinates/avatar preview with a separate share action.
- Guided Usage Access, Accessibility, display-over-apps and notification settings.
- Per-app short-video allowances, daily app limits, app launch controls and estimated scroll counters.
- Persisted short-video allowance consumed on detected short-video screens, timed extensions, breaks and focus blocks.

## Verification
- 22 Node tests passed, including native bridge regression cases.
- Android assembleDebug and lintDebug passed.
- Mobile browser checked: sign-in dialog, Profile account card, repeated outfit changes and matching profile avatar.
- Account deletion endpoint deployed with JWT verification; unauthenticated request rejected with 401. No real account deleted in testing.
- No Android device was attached. Device permissions, third-party app detection, overlays and signed-in account deletion are NOT end-to-end verified.

## Phone test
1. Install the test APK as an update. If signatures differ, do not uninstall without exporting/backing up your local data.
2. Blocks → Set up Rebound: enable Usage Access, Accessibility and display over other apps. Permissions remain optional and revocable in Android Settings.
3. Enable Instagram or YouTube monitoring, set a 1-minute session, Save limit, then Open app.
4. Normal feeds should not trigger the short-video prompt. Enter Reels/Shorts and choose 1 minute.
5. Verify the intervention at expiry, the five-second delay, Continue 1 min, and another intervention after the next minute. Leaving the short-video feed should pause its allowance.
6. Separately test a daily whole-app limit and focus session blocking.
7. Save two different wardrobe looks and reopen Profile. An uploaded profile photo takes precedence over the avatar; remove the photo to show the saved avatar.
8. Home → Sign in / Create account, or Profile → account controls. Sign out should restore the sign-in state. Test deletion only with a disposable account.
9. Profile → View my location: deny once, then allow. Confirm coordinates and avatar are previewed before choosing Share.

## Limits
Reel detection depends on interface identifiers exposed by each installed app/version. Video counts are estimates of detected feed changes, not exact watched-video counts. Website filtering and YouTube channel allowlists are not implemented in this Android build. This build does not establish completion of earlier Town multiplayer/calling requests. The avatar is a customizable illustrated SVG, not a Snapchat-style 3D model.
