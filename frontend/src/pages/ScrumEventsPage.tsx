import type { CSSProperties, JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";

const MODULE_NUMBER = "Module 3";
const MODULE_TITLE = "Scrum Events";
const MODULE_SUBTITLE =
  "Watch the video, then test your knowledge with the quiz below.";

const VIDEO_EMBED_URL = "https://www.youtube.com/embed/_j2SIxR-xxw";
const VIDEO_CAPTION = "Scrum Events Overview";
const VIDEO_DURATION = "0:00";

const ITEMS: { label: string; to: string | null }[] = [
  { label: "Quiz Questions", to: "scrum-exam" },
];

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "16px 20px 48px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "820px",
    margin: "0 auto",
  },
  hero: {
    borderRadius: 24,
    padding: "32px",
    backdropFilter: "blur(10px)",
    marginBottom: 20,
  },
  backButton: {
    marginBottom: "1.2rem",
    background: "rgba(124,58,237,0.15)",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: 999,
    padding: "8px 14px",
    color: "#c4b5fd",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  eyebrow: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#a78bfa",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    margin: "0 0 8px 0",
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: 700,
    margin: "0 0 12px 0",
  },
  subtitle: {
    fontSize: "0.95rem",
    lineHeight: 1.7,
    margin: 0,
  },
  videoFrameWrap: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    background: "#000000",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  videoFrame: {
    width: "100%",
    height: 300,
    border: "none",
    display: "block",
  },
  videoCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    background: "rgba(0,0,0,0.75)",
  },
  videoCaption: {
    fontSize: "0.8rem",
    color: "#d1d5db",
  },
  videoDuration: {
    fontSize: "0.8rem",
    color: "#9ca3af",
  },
  itemList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 24,
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    padding: "14px 20px 14px 24px",
    cursor: "pointer",
    transition: "opacity 0.15s",
    border: "1px solid",
  },
  itemLabel: {
    fontSize: "0.95rem",
    fontWeight: 600,
    letterSpacing: "0.01em",
  },
  itemBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    borderRadius: 999,
    padding: "4px 10px",
    letterSpacing: "0.03em",
  },
  itemRowDisabled: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    padding: "14px 20px 14px 24px",
    cursor: "not-allowed",
    opacity: 0.45,
    border: "1px solid",
  },
  footerNote: {
    marginTop: 8,
    fontSize: "0.8rem",
    textAlign: "center" as const,
    letterSpacing: "0.04em",
  },
};

export default function ScrumEventsPage(): JSX.Element {
  const navigate = useNavigate();
  const { projectId, role } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const pageBg = isDark
    ? "linear-gradient(180deg, #0b0f17 0%, #111827 100%)"
    : "#f8fafc";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const cardBorder = isDark
    ? "1px solid rgba(255,255,255,0.08)"
    : "1px solid rgba(17,24,39,0.08)";
  const textMain = isDark ? "#f9fafb" : "#111827";
  const textMuted = isDark ? "#9ca3af" : "#4b5563";
  const rowBg = isDark ? "rgba(124,58,237,0.10)" : "rgba(124,58,237,0.06)";
  const rowBorder = isDark
    ? "rgba(124,58,237,0.25)"
    : "rgba(124,58,237,0.18)";
  const badgeBg = isDark
    ? "rgba(124,58,237,0.25)"
    : "rgba(124,58,237,0.12)";

  function handleItemClick(to: string | null) {
    if (!to) return;

    navigate(`/projects/${projectId}/${role}/${to}`, {
      state: to === "scrum-exam" ? { topic: "scrumEvents" } : undefined,
    });
  }

  return (
    <SidebarLayout>
      <div style={{ ...styles.page, background: pageBg, color: textMain }}>
        <div style={styles.container}>
          <section
            style={{ ...styles.hero, background: cardBg, border: cardBorder }}
          >
            <button
              onClick={() => navigate(`/projects/${projectId}/${role}/education`)}
              style={styles.backButton}
            >
              ← Back to Learning
            </button>
            <p style={styles.eyebrow}>{MODULE_NUMBER}</p>
            <h1 style={{ ...styles.title, color: textMain }}>{MODULE_TITLE}</h1>
            <p style={{ ...styles.subtitle, color: textMuted }}>
              {MODULE_SUBTITLE}
            </p>
          </section>

          <div style={styles.videoFrameWrap}>
            <iframe
              style={styles.videoFrame}
              src={VIDEO_EMBED_URL}
              title={VIDEO_CAPTION}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div style={styles.videoCardFooter}>
              <span style={styles.videoCaption}>{VIDEO_CAPTION}</span>
              <span style={styles.videoDuration}>{VIDEO_DURATION}</span>
            </div>
          </div>

          <div style={styles.itemList}>
            {ITEMS.map(({ label, to }) => (
              <div
                key={label}
                role={to ? "button" : undefined}
                tabIndex={to ? 0 : undefined}
                onClick={() => handleItemClick(to)}
                onKeyDown={(e) => {
                  if (to && (e.key === "Enter" || e.key === " ")) {
                    handleItemClick(to);
                  }
                }}
                style={{
                  ...(to ? styles.itemRow : styles.itemRowDisabled),
                  background: rowBg,
                  borderColor: rowBorder,
                }}
              >
                <span style={{ ...styles.itemLabel, color: textMain }}>
                  {label}
                </span>
                <span
                  style={{
                    ...styles.itemBadge,
                    background: badgeBg,
                    color: "#c4b5fd",
                  }}
                >
                  {to ? "→" : "Soon"}
                </span>
              </div>
            ))}
          </div>

          <p style={{ ...styles.footerNote, color: textMuted }}>
            {MODULE_NUMBER} of 5 &nbsp;·&nbsp; Sprintwheel Learn
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
}