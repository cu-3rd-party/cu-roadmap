import { useEffect, useRef } from "react";
import { toast } from "sonner";
// eslint-disable-next-line import/no-unresolved -- virtual module injected by vite-plugin-pwa
import { registerSW } from "virtual:pwa-register";

import { Button } from "@/shared/ui/kit";

// Poll for a fresh build every hour so long-lived tabs notice new deploys
// without needing a manual reload.
// const UPDATE_INTERVAL_MS = 60 * 60 * 1000;
// ATTENTION: test
const UPDATE_INTERVAL_MS = 60;

// The "update available" toast. Rendered via toast.custom so we control the
// whole surface — plain white card, bold title, default-color body, no icon —
// and use the app's own Button for the apply action. `onApply` runs on click.
const showUpdateToast = (onApply: () => void) =>
  toast.custom(
    (id) => (
      <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-elevation-01 p-4 shadow-lg">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-fg-primary">Доступна новая версия</p>
          <p className="text-sm text-fg-primary">
            Вышло новое обновление, пожалуйста, обновите страницу.
          </p>
        </div>
        <Button
          size="sm"
          className="self-end"
          onClick={() => {
            toast.dismiss(id);
            onApply();
          }}
        >
          Обновить
        </Button>
      </div>
    ),
    { duration: Infinity },
  );

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
        showUpdateToast(() => updateSW(true));
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
