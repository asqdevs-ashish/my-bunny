let wakeLock: WakeLockSentinel | null = null;

/**
 * Request a screen wake lock to prevent the device from sleeping.
 * This helps keep location tracking active when the app is open.
 */
export async function requestWakeLock(): Promise<boolean> {
  try {
    if ("wakeLock" in navigator && navigator.wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        console.log("📍 Wake lock released by system");
      });
      return true;
    }
    console.warn("📍 Screen Wake Lock API not supported");
    return false;
  } catch (err) {
    console.warn("📍 Failed to acquire wake lock:", err);
    return false;
  }
}

/**
 * Release the screen wake lock explicitly.
 */
export async function releaseWakeLock(): Promise<void> {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (err) {
    console.warn("📍 Failed to release wake lock:", err);
  }
}

/**
 * Set up automatic re-acquisition of the wake lock when the page
 * becomes visible again (browsers may release it on tab switch).
 */
export function setupWakeLockAutoReacquire(): () => void {
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      // Re-acquire only if we had a wake lock before
      requestWakeLock();
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);
  return () => document.removeEventListener("visibilitychange", handleVisibility);
}

/**
 * Check if the wake lock is currently active.
 */
export function isWakeLockActive(): boolean {
  return wakeLock !== null;
}
