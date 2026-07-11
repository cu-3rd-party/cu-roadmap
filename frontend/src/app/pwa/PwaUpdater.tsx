import { useEffect, useRef } from "react";
import { toast } from "sonner";
// eslint-disable-next-line import/no-unresolved -- virtual module injected by vite-plugin-pwa
import { registerSW } from "virtual:pwa-register";

// Poll for a fresh build every hour so long-lived tabs notice new deploys
// without needing a manual reload.
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

/*
 Registers the service worker and, when a new build is available, shows a
 toast letting the user apply it. `updateSW(true)` sends SKIP_WAITING to the
 waiting worker and reloads on `controllerchange`
 
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

    const updateSW = registerSW({
      onNeedRefresh() {
        toast("Доступна новая версия", {
          description: "Обновите страницу, чтобы применить обновление.",
          duration: Infinity,
          action: {
            label: "Обновить",
            onClick: () => updateSW(true),
          },
        });
      },
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
