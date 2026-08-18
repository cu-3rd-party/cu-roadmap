import axios from "axios";

import { apiClient } from "@/shared/api";

// Backend contract: POST /auth/login takes the shared admin password and nothing
// else (there are no per-user accounts), and answers with an HttpOnly cookie.
export const login = (password: string) =>
  apiClient.post("/auth/login", { password }).then(() => undefined);

/* /auth/check is a no-op endpoint sitting behind the auth middleware, so its
   status code *is* the answer. A 401 means "logged out", which is a normal
   state rather than a failure — hence data, not a thrown error. */
export const checkAuth = async (): Promise<boolean> => {
  try {
    await apiClient.get("/auth/check");
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return false;
    }
    throw error;
  }
};

export const logout = () =>
  apiClient.delete("/auth/logout").then(() => undefined);
