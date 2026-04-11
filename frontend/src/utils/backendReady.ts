const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForBackendReady(
  timeoutMs = 75000,
  intervalMs = 2500
): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${API_BASE}/health`, {
        method: "GET",
        cache: "no-store",
      });

      if (res.ok) return true;
    } catch {
      // Backend still waking up
    }

    await sleep(intervalMs);
  }

  return false;
}