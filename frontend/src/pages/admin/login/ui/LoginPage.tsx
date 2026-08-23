import axios from "axios";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { AUTH_BYPASSED, useLoginMutation } from "@/features/auth";
import { getErrorMessage } from "@/shared/api";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/shared/ui";

const FALLBACK_REDIRECT = "/admin/specializations";

/* A 401 here means "wrong password", not "you need to log in" — which is what
   the shared getStatusMessage would say, and would read as nonsense on the
   login screen itself. Everything else (429 from the rate limiter, network
   failures) goes through the shared mapper. */
const loginErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return "Неверный пароль";
  }
  return getErrorMessage(error);
};

const LoginPage = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate, isPending, error, reset } = useLoginMutation();

  const from = (location.state as { from?: string } | null)?.from;

  /* Under dev:noauth the form is dead weight — the guard lets everything through
     anyway — so a stray /admin/login (a bookmark, a typed URL) goes straight on
     to where it was headed instead of asking for a password nobody needs. */
  if (AUTH_BYPASSED) return <Navigate to={from ?? FALLBACK_REDIRECT} replace />;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!password || isPending) return;

    mutate(password, {
      onSuccess: () => navigate(from ?? FALLBACK_REDIRECT, { replace: true }),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-alt px-4 text-fg-primary">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вход</CardTitle>
          <CardDescription>
            Панель администрирования CU Roadmap.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-password">Пароль</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  // Clear a stale "wrong password" as soon as they retype.
                  if (error) reset();
                }}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-negative">
                {loginErrorMessage(error)}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              loading={isPending}
              disabled={!password}
            >
              Войти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
