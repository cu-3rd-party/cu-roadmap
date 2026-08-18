import axios from "axios";

// Set VITE_API_URL
const host = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export const apiClient = axios.create({
  baseURL: `${host}/api/v1`,
  timeout: 30_000,
  // The auth-token cookie is HttpOnly and set by the backend; without this it
  // would not ride along once VITE_API_URL points at another origin.
  withCredentials: true,
});
