import axios from "axios";

// Set VITE_API_URL
const host = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export const apiClient = axios.create({
  baseURL: `${host}/api/v1`,
  timeout: 30_000,
});
