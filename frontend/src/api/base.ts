const envApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE = import.meta.env.DEV
  ? (envApiUrl ? envApiUrl.replace(/\/+$/, "") : "http://127.0.0.1:8000")
  : "";