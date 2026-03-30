import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const API_BASE = "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

function timeAgo(dateStr: string): string {
  const normalized =
    dateStr.endsWith("Z") || dateStr.includes("+")
      ? dateStr
      : dateStr + "Z";
  const date = new Date(normalized);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  if (days < 7) return `${days}d ${hrs % 24}h ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatExactTime(dateStr: string): string {
  const normalized =
    dateStr.endsWith("Z") || dateStr.includes("+")
      ? dateStr
      : dateStr + "Z";
  return new Date(normalized).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getNotificationIcon(message: string): string {
  if (message.includes("added to")) return "🎉";
  if (message.includes("assigned")) return "📋";
  if (message.includes("Assignee") || message.includes("assignee")) return "🔄";
  if (message.includes("cancelled")) return "❌";
  if (message.includes("updated")) return "✏️";
  if (message.includes("event") || message.includes("Event")) return "📅";
  if (message.includes("sprint") || message.includes("Sprint")) return "🏃";
  if (message.includes("completed") || message.includes("done")) return "✅";
  if (message.includes("story") || message.includes("Story")) return "📖";
  if (message.includes("role")) return "🎭";
  return "🔔";
}

function OctopusMascot({ hasUnread, size = 40 }: { hasUnread: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: hasUnread ? "drop-shadow(0 0 6px #7f77dd)" : "none",
        transition: "filter 0.3s",
        flexShrink: 0,
      }}
    >
      <ellipse cx="32" cy="26" rx="18" ry="16" fill="#7f77dd" />
      <ellipse cx="26" cy="20" rx="6" ry="4" fill="#afa9ec" opacity="0.5" />
      <circle cx="26" cy="24" r="4" fill="white" />
      <circle cx="38" cy="24" r="4" fill="white" />
      <circle cx="27" cy="24" r="2" fill="#1a1a2e" />
      <circle cx="39" cy="24" r="2" fill="#1a1a2e" />
      <circle cx="28" cy="23" r="0.8" fill="white" />
      <circle cx="40" cy="23" r="0.8" fill="white" />
      <path d="M27 30 Q32 34 37 30" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <ellipse cx="22" cy="28" rx="3" ry="1.5" fill="#ed93b1" opacity="0.6" />
      <ellipse cx="42" cy="28" rx="3" ry="1.5" fill="#ed93b1" opacity="0.6" />
      <path d="M16 38 Q12 44 14 50 Q16 56 13 60" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M21 42 Q19 48 21 54 Q23 58 20 62" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M27 44 Q27 50 29 56 Q30 60 28 63" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M33 44 Q35 50 33 56 Q32 60 34 63" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M39 42 Q41 48 39 54 Q37 58 40 62" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M44 38 Q48 44 46 50 Q44 56 47 60" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="13" cy="60" r="2" fill="#534ab7" />
      <circle cx="20" cy="62" r="2" fill="#534ab7" />
      <circle cx="28" cy="63" r="2" fill="#534ab7" />
      <circle cx="34" cy="63" r="2" fill="#534ab7" />
      <circle cx="40" cy="62" r="2" fill="#534ab7" />
      <circle cx="47" cy="60" r="2" fill="#534ab7" />
    </svg>
  );
}

function NotifRow({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const icon = getNotificationIcon(n.message);

  return (
    <div
      onClick={() => !n.is_read && onRead(n.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        gap: 14,
        padding: "14px 22px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        cursor: n.is_read ? "default" : "pointer",
        background: n.is_read
          ? hovered ? "rgba(255,255,255,0.02)" : "transparent"
          : hovered ? "rgba(127,119,221,0.12)" : "rgba(127,119,221,0.06)",
        transition: "background 0.15s",
      }}
    >
      <div style={{
        flexShrink: 0,
        width: 42,
        height: 42,
        borderRadius: "50%",
        background: n.is_read ? "rgba(255,255,255,0.05)" : "rgba(127,119,221,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 19,
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: 14,
          color: n.is_read ? "#5f5e5a" : "#c2c0b6",
          lineHeight: 1.55,
          wordBreak: "break-word",
        }}>
          {n.message}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#7f77dd", fontWeight: 500 }}>
            {timeAgo(n.created_at)}
          </span>
          <span style={{ fontSize: 11, color: "#444441" }}>
            · {formatExactTime(n.created_at)}
          </span>
          {!n.is_read && (
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7f77dd", display: "inline-block" }} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationBell({ size = 32 }: { size?: number }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const bellRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch("/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.top, left: rect.right + 14 });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const panel = document.getElementById("notif-panel");
      if (
        bellRef.current && !bellRef.current.contains(e.target as Node) &&
        panel && !panel.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAsRead = async (id: string) => {
    await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    setLoading(true);
    await apiFetch("/notifications/read-all", { method: "PATCH" });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setLoading(false);
  };

  const panel = open ? createPortal(
    <div
      id="notif-panel"
      style={{
        position: "fixed",
        top: panelPos.top,
        left: panelPos.left,
        width: 440,
        maxHeight: "82vh",
        background: "#13131a",
        border: "1px solid rgba(127,119,221,0.25)",
        borderRadius: 18,
        boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(127,119,221,0.08)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "20px 22px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "linear-gradient(160deg, #1a1a2e 0%, #13131a 100%)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
          <OctopusMascot hasUnread={unreadCount > 0} size={60} />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Notifications</div>
            <div style={{ color: "#7f77dd", fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>
              {unreadCount > 0
                ? `${unreadCount} new — Ollie delivered ${unreadCount > 1 ? "them" : "it"}! 🐙`
                : "All caught up! Ollie is resting 🐙"}
            </div>
          </div>
          {unreadCount > 0 && (
            <span style={{ background: "#e24b4a", color: "#fff", fontSize: 13, fontWeight: 700, borderRadius: 12, padding: "3px 10px", flexShrink: 0 }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={loading}
            style={{
              width: "100%",
              background: "rgba(127,119,221,0.1)",
              border: "1px solid rgba(127,119,221,0.25)",
              color: "#afa9ec",
              borderRadius: 10,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            ✓ Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "52px 20px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <OctopusMascot hasUnread={false} size={68} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#888780", marginBottom: 8 }}>No notifications yet</div>
            <div style={{ fontSize: 13, color: "#444441", lineHeight: 1.6 }}>
              Ollie will swim over as soon as<br />something happens!
            </div>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <>
                <div style={{ padding: "11px 22px 7px", fontSize: 11, fontWeight: 700, color: "#7f77dd", textTransform: "uppercase", letterSpacing: 1, background: "rgba(127,119,221,0.05)" }}>
                  New
                </div>
                {unread.map(n => <NotifRow key={n.id} n={n} onRead={markAsRead} />)}
              </>
            )}
            {read.length > 0 && (
              <>
                <div style={{ padding: "11px 22px 7px", fontSize: 11, fontWeight: 700, color: "#444441", textTransform: "uppercase", letterSpacing: 1 }}>
                  Earlier
                </div>
                {read.map(n => <NotifRow key={n.id} n={n} onRead={markAsRead} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div ref={bellRef} style={{ display: "inline-flex" }}>
        <button
          onClick={() => setOpen(o => !o)}
          title="Notifications"
          style={{
            position: "relative",
            background: open ? "rgba(127,119,221,0.15)" : "transparent",
            border: open ? "1px solid rgba(127,119,221,0.35)" : "1px solid transparent",
            borderRadius: 12,
            cursor: "pointer",
            padding: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          <OctopusMascot hasUnread={unreadCount > 0} size={size} />
          {unreadCount > 0 && (
            <span style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: "#e24b4a",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 10,
              minWidth: 17,
              height: 17,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              border: "2px solid #0a0e16",
              lineHeight: 1,
            }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>
      {panel}
    </>
  );
}