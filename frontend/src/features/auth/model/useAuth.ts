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

/* Both mutations write the new session state straight into the cache instead of
   invalidating it. While the login screen is up nothing observes the auth query,
   and invalidation only refetches *active* queries — so an invalidation would
   leave the cached `false` in place, RequireAuth would read it on the very next
   render and bounce you back to the login screen. That is what used to make the
   password have to be typed twice. Logout has the mirror-image problem. */
export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: () => queryClient.setQueryData(authStatusKey, true),
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.setQueryData(authStatusKey, false),
  });
};
