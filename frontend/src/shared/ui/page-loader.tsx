import { Loader2 } from "lucide-react";

/* Shown while a lazy page chunk or the session check is in flight. Shared so the
   router suspense fallback and the auth guard show the same thing. */
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-fg-secondary">
      <Loader2 className="size-8 animate-spin" aria-hidden />
      <span className="text-sm">Загрузка...</span>
    </div>
  );
}
