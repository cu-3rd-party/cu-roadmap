import { useEffect, useRef } from "react";
// eslint-disable-next-line import/no-unresolved -- virtual module injected by vite-plugin-pwa
import { registerSW } from "virtual:pwa-register";

// Poll for a fresh build every hour so long-lived tabs notice new deploys
// without needing a manual reload.
// 60 minutes
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

// If a tab never gets backgrounded, apply a pending update after this long
// without user interaction. Reloading an idle foreground tab is low-risk and
// guarantees long-lived tabs eventually pick up new deploys.
// 15 minutes
const IDLE_FALLBACK_MS = 15 * 60 * 1000;

/*
 Registers the service worker and, when a new build is available, applies it
 silently — deferring the reload to a moment the user won't notice (tab hidden,
 or foreground-idle) rather than nagging with a prompt.

 Data is safe across the reload: the planner selections are persisted to
 localStorage (see usePlannerStore), so they rehydrate on the fresh page. The
 only thing we protect against is a jarring mid-action reload.

 registerType stays "prompt" and workbox.skipWaiting stays unset (see
 vite.config.ts) so the new SW parks in "waiting" until we call updateSW() at a
 safe moment — that is what makes deferral possible. Reload is triggered by our
 own onNeedReload once the new SW takes control.

 Renders nothing. The SW only exists in production builds (PWA is disabled in
 dev via `DEV_ENABLE_PWA`), so in dev this is effectively a no-op.
*/
export function PwaUpdater() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;

    // An update is waiting to be applied.
    let pending = false;
    // updateSW() has been sent — guards against skip-waiting / reloading twice.
    let applied = false;
    let lastInteraction = Date.now();
    let pollInterval: ReturnType<typeof setInterval> | undefined;

    // Skip-waiting the parked worker. Its activation triggers onNeedReload.
    const applyUpdate = () => {
      if (!pending || applied) return;
      applied = true;
      updateSW();
    };

    // Apply now if the tab is hidden; otherwise wait for a safe moment.
    const applyIfHidden = () => {
      if (document.hidden) applyUpdate();
    };

    const updateSW = registerSW({
      onNeedRefresh() {
        pending = true;
        // Detected while backgrounded (e.g. from the poll) — apply right away.
        applyIfHidden();
      },
      onNeedReload() {
        // New SW has taken control; we only reach here after applyUpdate(), and
        // only at a safe moment, so a hard reload is fine.
        window.location.reload();
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        pollInterval = setInterval(() => {
          registration.update();
        }, UPDATE_INTERVAL_MS);
      },
    });

    const onVisibilityChange = () => {
      if (document.hidden) applyUpdate();
    };

    const onInteraction = () => {
      lastInteraction = Date.now();
    };

    // Foreground-idle fallback: apply a pending update once the user has been
    // idle long enough, so a tab that never backgrounds still updates.
    const idleInterval = setInterval(() => {
      if (pending && !document.hidden) {
        if (Date.now() - lastInteraction >= IDLE_FALLBACK_MS) applyUpdate();
      }
    }, 60 * 1000);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pointerdown", onInteraction, { passive: true });
    window.addEventListener("keydown", onInteraction, { passive: true });

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(idleInterval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };
  }, []);

  return null;
}
