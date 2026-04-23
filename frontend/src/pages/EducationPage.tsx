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
  sectionTitle: {
    fontSize: "1.3rem",
    fontWeight: 700,
    margin: "0 0 16px 0",
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
    display: "flex",
    flexDirection: "column",
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
  cardButton: {
    backgroundColor: "#7c3aed",
    border: "none",
    borderRadius: 999,
    padding: "10px 16px",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "auto",
  },
};

export default function EducationPage(): JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const { projectId, role } = useParams();

  return (
    <SidebarLayout>
      <div
        style={{
          ...styles.page,
          background: isDark ? styles.page.background : "#f8fafc",
          color: isDark ? "#f9fafb" : "#111827",
        }}
      >
        <div style={styles.container}>
          <section
            style={{
              ...styles.hero,
              background: isDark ? styles.hero.background : "#ffffff",
              border: isDark
                ? styles.hero.border
                : "1px solid rgba(17,24,29,0.08)",
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
              Learn Scrum through structored modules, designed to be used in the
              real-world. Progress at your own pace & build confidence in agile
              workflows!
            </p>
          </section>

          <section>
            <h2 style={styles.sectionTitle}>Topics</h2>
            <div style={styles.grid}>
              {["📘", "👥", "📅", "📦", "📝"].map((icon, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.card,
                    background: isDark ? styles.card.background : "#ffffff",
                    border: isDark
                      ? styles.card.border
                      : "1px solid rgba(17,24,39,0.08)",
                  }}
                >
                  <div style={styles.iconCircle}>{icon}</div>
                  <h3 style={styles.cardTitle}>
                    {
                      [
                        "Scrum Guide",
                        "Scrum Roles",
                        "Scrum Events",
                        "Scrum Artifacts",
                        "Scrum Exam",
                      ][i]
                    }
                  </h3>
                  <p
                    style={{
                      ...styles.cardText,
                      color: isDark ? "#9ca3af" : "#4b5563",
                    }}
                  >
                    {
                      [
                        "Learn the core framework & principles of Scrum.",
                        "Understand each role and its responsibilites.",
                        "Explore key Scrum workflows.",
                        "Learn how progress and work are tracked in Scrum.",
                        "Test your understanding of Scrum concepts.",
                      ][i]
                    }
                  </p>
                  <button
                    style={styles.cardButton}
                    onClick={() => {
                      const routes = [
                        "scrum-guide",
                        "scrum-roles",
                        "scrum-events",
                        "scrum-artifacts",
                        "scrum-exam",
                      ];
                      navigate(`/projects/${projectId}/${role}/${routes[i]}`);
                    }}
                  >
                    {
                      [
                        "Start Here",
                        "Learning Scrum",
                        "Event Exploration",
                        "Understanding Artifacts",
                        "Test Yourself",
                      ][i]
                    }
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </SidebarLayout>
  );
}