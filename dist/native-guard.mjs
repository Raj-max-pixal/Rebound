// Native Capacitor injects Plugins directly; registerPlugin exists only with the JS core runtime.
export function nativeGuard(capacitor = globalThis.Capacitor) {
  if (!capacitor?.isNativePlatform?.()) return null;
  return capacitor.Plugins?.ReboundGuard ?? capacitor.registerPlugin?.('ReboundGuard') ?? null;
}
