import type { CSSProperties, JSX } from "react";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";
import { useNavigate, useParams } from "react-router-dom";

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0b0f17 0%, #111827 100%)",
    padding: "32px 20px 48px",
    fontFamily: "Arial, sans-serif",
    color: "#f9fafb",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  hero: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: "32px",
    backdropFilter: "blur(10px)",
    marginBottom: 28,
  },

  eyebrow: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#a78bfa",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  title: {
    fontSize: "2.4rem",
    fontWeight: 700,
    margin: 0,
  },

  subtitle: {
    fontSize: "1rem",
    lineHeight: 1.7,
    color: "#d1d5db",
    marginTop: 14,
    maxWidth: "760px",
  },

  heroRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 22,
  },

  primaryButton: {
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: 999,
    padding: "12px 20px",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondaryButton: {
    backgroundColor: "rgba(124,58,237,0.15)",
    color: "#c4b5fd",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: 999,
    padding: "12px 20px",
    fontWeight: 700,
    cursor: "pointer",
  },

  sectionTitle: {
    fontSize: "1.3rem",
    fontWeight: 700,
    margin: "0 0 16px 0",
  },

  progressCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },

  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  progressText: {
    color: "#9ca3af",
  },

  progressBarWrap: {
    width: "100%",
    height: 10,
    backgroundColor: "#1f2937",
    borderRadius: 999,
    overflow: "hidden",
  },

  progressBar: {
    width: "35%",
    height: "100%",
    backgroundColor: "#7c3aed",
    borderRadius: 999,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 22,
    transition: "0.2s",
  },

  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    backgroundColor: "rgba(124,58,237,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    fontSize: "1.3rem",
  },

  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    marginBottom: 8,
  },

  cardText: {
    fontSize: "0.95rem",
    color: "#9ca3af",
    marginBottom: 16,
    lineHeight: 1.5,
  },

  pillRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },

  pill: {
    backgroundColor: "rgba(124,58,237,0.15)",
    color: "#c4b5fd",
    fontSize: "0.75rem",
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 600,
  },

  cardButton: {
    backgroundColor: "#7c3aed",
    border: "none",
    borderRadius: 999,
    padding: "10px 16px",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },

  footerNote: {
    marginTop: 28,
    color: "#6b7280",
    fontSize: "0.9rem",
  },
};

export default function ToDoPage(): JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const { projectId, role } = useParams();

  return (
    <SidebarLayout>
      <div
        style={{
          ...styles.page,
          background: isDark
            ? styles.page.background
            : "#f8fafc",
          color: isDark ? "#f9fafb" : "#111827",
        }}
      >
        <div style={styles.container}>
          <section
            style={{
              ...styles.hero,
              background: isDark
                ? styles.hero.background
                : "#ffffff",
              border: isDark
                ? styles.hero.border
                : "1px solid rgba(17,24,39,0.08)",
            }}
          >
            <p style={styles.eyebrow}>Learn Scrum</p>
            <h1 style={styles.title}>Scrum.Edu</h1>
            <p
              style={{
                ...styles.subtitle,
                color: isDark ? "#d1d5db" : "#4b5563",
              }}
            >
              Learn Scrum through structured modules designed for real-world
              application. Progress at your own pace and build confidence in agile workflows.
            </p>

            <div style={styles.heroRow}>
              <button style={styles.primaryButton}>Continue Learning</button>
              <button style={styles.secondaryButton}>Browse Topics</button>
            </div>
          </section>

          <section
            style={{
              ...styles.progressCard,
              background: isDark
                ? styles.progressCard.background
                : "#ffffff",
              border: isDark
                ? styles.progressCard.border
                : "1px solid rgba(17,24,39,0.08)",
            }}
          >
            <div style={styles.progressTop}>
              <h2 style={styles.sectionTitle}>Your progress</h2>
              <span
                style={{
                  ...styles.progressText,
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                35% complete
              </span>
            </div>

            <div style={styles.progressBarWrap}>
              <div style={styles.progressBar}></div>
            </div>
          </section>

          <section>
            <h2 style={styles.sectionTitle}>Topics</h2>

            <div style={styles.grid}>
              {["📘", "👥", "📅", "📦", "📝"].map((icon, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.card,
                    background: isDark
                      ? styles.card.background
                      : "#ffffff",
                    border: isDark
                      ? styles.card.border
                      : "1px solid rgba(17,24,39,0.08)",
                  }}
                >
                  <div style={styles.iconCircle}>{icon}</div>
                  <h3 style={styles.cardTitle}>
                    {["Scrum Guide", "Scrum Roles", "Scrum Events", "Scrum Artifacts", "Scrum Exam"][i]}
                  </h3>
                  <p
                    style={{
                      ...styles.cardText,
                      color: isDark ? "#9ca3af" : "#4b5563",
                    }}
                  >
                    {
                      [
                        "Learn the core framework and principles of Scrum.",
                        "Understand each role and its responsibilities.",
                        "Explore key Scrum ceremonies and workflows.",
                        "Learn how progress and work are tracked in Scrum.",
                        "Test your understanding of Scrum concepts."
                      ][i]
                    }
                  </p>
                  <button
                    style={styles.cardButton}
                    onClick={() => {
                      if (i === 4) {
                        navigate(`/projects/${projectId}/${role}/scrum-exam`);
                      }
                    }}
                  >
                    {["Start", "Learn", "Explore", "View", "Take Exam"][i]}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div
            style={{
              ...styles.footerNote,
              color: isDark ? "#6b7280" : "#9ca3af",
            }}
          >
            Content in progress — expected by Sprint #5
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}