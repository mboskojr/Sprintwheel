const API_BASE = import.meta.env.VITE_API_URL || "https://sprintwheel.onrender.com";

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

    if (typeof data === "string") return data;
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: any) => {
          if (typeof item?.msg === "string") {
            const field = Array.isArray(item?.loc)
              ? item.loc[item.loc.length - 1]
              : "field";
            return `${field}: ${item.msg}`;
          }
          return JSON.stringify(item);
        })
        .join(", ");
    }

    return JSON.stringify(data);
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

  export async function forgotPassword(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  
    const data = await res.json().catch(() => ({}));
  
    if (!res.ok) {
      throw new Error(data?.detail || data?.message || "Unable to send reset email.");
    }
  
    return data;
  }
  
  export async function resetPassword(token: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
    });
  
    const data = await res.json().catch(() => ({}));
  
    if (!res.ok) {
      throw new Error(data?.detail || data?.message || "Reset failed");
    }
  
    return data;
  }