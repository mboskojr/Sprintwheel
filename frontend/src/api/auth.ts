const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

console.log("API_BASE =", API_BASE);

export type TokenOut = { access_token: string; token_type: string };
export type UserOut = { id: string; name: string; email: string; role: string };

export async function login(email: string, password: string): Promise<TokenOut> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(msg);
  }
  return res.json();
}

export async function register(name: string, email: string, password: string): Promise<UserOut> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(msg);
  }
  return res.json();
}

export async function me(token: string): Promise<UserOut> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(msg);
  }
  return res.json();
}

async function safeError(res: Response) {
  try {
    const data = await res.json();
    return data?.detail ?? JSON.stringify(data);
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

export async function googleLogin(id_token: string): Promise<TokenOut> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token }),
    });
  
    if (!res.ok) {
      const msg = await safeError(res);
      throw new Error(msg);
    }
    return res.json();
  }