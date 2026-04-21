import type { CSSProperties, JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE NOTES — copy this file for Modules 2-4, then change:
//   1. MODULE_NUMBER  (e.g. "Module 2")
//   2. MODULE_TITLE   (e.g. "Scrum Roles")
//   3. MODULE_SUBTITLE
//   4. VIDEO_URL      — replace "#" with your YouTube share/embed URL
//   5. VIDEO_CAPTION  (e.g. "Introduction to Scrum Roles")
//   6. VIDEO_DURATION (e.g. "5:14")
//   7. ITEMS list     — the clickable rows below the video
// ─────────────────────────────────────────────────────────────────────────────

const MODULE_NUMBER  = "Module 1";
const MODULE_TITLE   = "What is Scrum?";
const MODULE_SUBTITLE =
  "Watch the introduction video, then test your knowledge with the quiz below.";

// Replace "#" with your YouTube URL when ready.
// Easiest option: use the YouTube share link (e.g. "https://youtu.be/abc123").
// Clicking will open in a new tab. To embed inline instead, swap the <a> block
// for a <iframe> — ask for help with that when you're ready.
const VIDEO_URL      = "#";
const VIDEO_CAPTION  = "Introduction to Scrum";
const VIDEO_DURATION = "4:32";

// Each item appears as a clickable row beneath the video.
// { label } — display text
// { to }    — internal route to navigate to, OR null to disable for now
// Replace null with a path string when the destination page exists.
const ITEMS: { label: string; to: string | null }[] = [
  { label: "Quiz Questions", to: "scrum-exam" },
];

// ─────────────────────────────────────────────────────────────────────────────

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

  // Top card — eyebrow + title + subtitle + back button
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
    marginBottom: 10,
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

  // Video placeholder — wrapped in an <a> tag so it's clickable
  videoLink: {
    display: "block",
    textDecoration: "none",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },

  videoBlock: {
    width: "100%",
    background: "#000000",
    borderRadius: 12,
    height: 260,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    cursor: "pointer",
  },

  // Play icon in the center of the video block
  playIcon: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "rgba(124,58,237,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.4rem",
    marginBottom: 12,
    color: "white",
    flexShrink: 0,
  },

  videoLabel: {
    fontSize: "0.85rem",
    color: "#d1d5db",
    fontWeight: 500,
    letterSpacing: "0.03em",
  },

  // Bottom bar of the video block — caption + duration
  videoFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
    borderRadius: "0 0 12px 12px",
  },

  videoCaption: {
    fontSize: "0.78rem",
    color: "#d1d5db",
    letterSpacing: "0.03em",
  },

  videoDuration: {
    fontSize: "0.78rem",
    color: "#9ca3af",
    letterSpacing: "0.04em",
    fontVariantNumeric: "tabular-nums",
  },

  // Row items beneath the video
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

  // Disabled item row (null destination)
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

export default function ScrumGuidePage(): JSX.Element {
  const navigate = useNavigate();
  const { projectId, role } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // ── Color values that flip between dark and light mode ──────────────────
  const pageBg    = isDark ? "linear-gradient(180deg, #0b0f17 0%, #111827 100%)" : "#f8fafc";
  const cardBg    = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const cardBorder = isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(17,24,39,0.08)";
  const textMain  = isDark ? "#f9fafb" : "#111827";
  const textMuted = isDark ? "#9ca3af" : "#4b5563";
  const rowBg     = isDark ? "rgba(124,58,237,0.10)" : "rgba(124,58,237,0.06)";
  const rowBorder = isDark ? "rgba(124,58,237,0.25)" : "rgba(124,58,237,0.18)";
  const badgeBg   = isDark ? "rgba(124,58,237,0.25)" : "rgba(124,58,237,0.12)";
  // ─────────────────────────────────────────────────────────────────────────

  function handleItemClick(to: string | null) {
    if (!to) return;

    navigate(`/projects/${projectId}/${role}/${to}`, {
      state: to === "scrum-exam" ? { topic: "scrumGuide" } : undefined,
    });
  }

  return (
    <SidebarLayout>
      <div
        style={{
          ...styles.page,
          background: pageBg,
          color: textMain,
        }}
      >
        <div style={styles.container}>

          {/* ── Hero card ─────────────────────────────────────────────── */}
          <section
            style={{
              ...styles.hero,
              background: cardBg,
              border: cardBorder,
            }}
          >
            <button
              onClick={() => navigate(`/projects/${projectId}/${role}/education`)}
              style={styles.backButton}
            >
              ← Back to Learning
            </button>

            <p style={styles.eyebrow}>{MODULE_NUMBER}</p>
            <h1 style={{ ...styles.title, color: textMain }}>{MODULE_TITLE}</h1>
            <p style={{ ...styles.subtitle, color: textMuted }}>{MODULE_SUBTITLE}</p>
          </section>

          {/* ── Video block ───────────────────────────────────────────── */}
          {/*
            VIDEO_URL is "#" until you have a YouTube link.
            When ready, paste your YouTube share URL (e.g. "https://youtu.be/abc123")
            into the VIDEO_URL constant at the top of this file.
            The link opens in a new tab. If you want in-page embedding instead,
            replace this <a> block with a <iframe> — ask for help when ready.
          */}
          <a
            href={VIDEO_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.videoLink}
            aria-label={`Watch: ${VIDEO_CAPTION}`}
          >
            <div style={styles.videoBlock}>
              <div style={styles.playIcon}>▶</div>
              <span style={styles.videoLabel}>Click to watch</span>

              <div style={styles.videoFooter}>
                <span style={styles.videoCaption}>{VIDEO_CAPTION}</span>
                <span style={styles.videoDuration}>{VIDEO_DURATION}</span>
              </div>
            </div>
          </a>

          {/* ── Item rows ─────────────────────────────────────────────── */}
          <div style={styles.itemList}>
            {ITEMS.map(({ label, to }) => (
              <div
                key={label}
                role={to ? "button" : undefined}
                tabIndex={to ? 0 : undefined}
                onClick={() => handleItemClick(to)}
                onKeyDown={(e) => {
                  if (to && (e.key === "Enter" || e.key === " ")) handleItemClick(to);
                }}
                style={{
                  ...(to ? styles.itemRow : styles.itemRowDisabled),
                  background: rowBg,
                  borderColor: rowBorder,
                }}
              >
                <span style={{ ...styles.itemLabel, color: textMain }}>{label}</span>
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

          {/* ── Footer ────────────────────────────────────────────────── */}
          <p style={{ ...styles.footerNote, color: textMuted }}>
            {MODULE_NUMBER} of 5 &nbsp;·&nbsp; Sprintwheel Learn
          </p>

        </div>
      </div>
    </SidebarLayout>
  );
}
