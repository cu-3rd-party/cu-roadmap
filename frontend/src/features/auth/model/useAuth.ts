import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { checkAuth, login, logout } from "../api/auth";

export const authStatusKey = ["auth", "status"] as const;

/* The session cookie is HttpOnly, so the server is the only one who can answer
   "am I logged in". Refetching on focus (the QueryProvider default is off) means
   a session that lapses while a tab sits idle is noticed on return rather than
   on the next click. */
export const useAuthStatus = () =>
  useQuery({
    queryKey: authStatusKey,
    queryFn: checkAuth,
    retry: false,
    refetchOnWindowFocus: true,
  });

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authStatusKey }),
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authStatusKey }),
  });
};
