const API_BASE =
  import.meta.env.VITE_API_URL?.trim() || "http://127.0.0.1:8000";

console.log("API_BASE =", API_BASE);
function normalizeErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback;

  if (typeof data === "string") return data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (typeof item?.msg === "string") return item.msg;
        return JSON.stringify(item);
      })
      .join(", ");
  }

  if (Array.isArray(data)) {
    return data
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (typeof item?.msg === "string") return item.msg;
        return JSON.stringify(item);
      })
      .join(", ");
  }

  try {
    return JSON.stringify(data);
  } catch {
    return fallback;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    const fallback = `${res.status} ${res.statusText}`;
    let parsed: any = null;

    try {
      parsed = await res.json();
    } catch {
      try {
        const text = await res.text();
        parsed = text;
      } catch {
        parsed = null;
      }
    }

    const message = normalizeErrorMessage(parsed, fallback);

    const error = new Error(message) as Error & {
      status?: number;
      data?: any;
    };

    error.status = res.status;
    error.data = parsed;
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}