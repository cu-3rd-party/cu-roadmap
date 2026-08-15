import { Button } from "@cu/ui/kit";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="text-5xl font-semibold text-fg-primary">404</span>
      <p className="text-sm text-fg-secondary">Такой страницы нет.</p>
      <Button asChild>
        <Link to="/dashboard">Вернуться к обзору</Link>
      </Button>
    </div>
  );
}
