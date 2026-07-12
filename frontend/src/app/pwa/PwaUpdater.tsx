import { useEffect, useRef } from "react";
// eslint-disable-next-line import/no-unresolved -- virtual module injected by vite-plugin-pwa
import { registerSW } from "virtual:pwa-register";

// Poll for a fresh build every hour so long-lived tabs notice new deploys
// without needing a manual reload.
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

/*
 Registers the service worker. registerType is "autoUpdate" (see vite.config.ts),
 so a new build activates and reloads the page automatically — the user always
 lands on the latest version. This component just kicks off registration and
 polls hourly so long-lived tabs pick up deploys too.

 The reload is safe for data: planner selections are persisted to localStorage
 (see usePlannerStore) and rehydrate on the fresh page.

 Renders nothing. The SW only exists in production builds (PWA is disabled in
 dev via `DEV_ENABLE_PWA`), so in dev this is effectively a no-op.
*/
export function PwaUpdater() {
  const registered = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;

    registerSW({
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        intervalRef.current = setInterval(() => {
          registration.update();
        }, UPDATE_INTERVAL_MS);
      },
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}
