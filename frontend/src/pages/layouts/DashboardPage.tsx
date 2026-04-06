import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { CSSProperties, JSX } from "react";
import { me } from "../../api/auth";
import { listProjects, type Project } from "../../api/projects";
import SidebarLayout from "../../components/SidebarLayout";
import DashboardCalendarPreview from "../../components/DashboardCalendarPreview";
import { useTheme } from "../ThemeContext";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const styles: Record<string, CSSProperties> = {
  main: {
    width: "100%",
    minHeight: "100vh",
    padding: 24,
    background:
      "radial-gradient(circle at top left, rgba(99,102,241,0.14), transparent 28%), linear-gradient(180deg, #0b0f17 0%, #0f172a 45%, #0b0f17 100%)",
    color: "white",
    position: "relative",
    overflow: "hidden",
  },

  shell: {
    position: "relative",
    width: "100%",
    minHeight: "calc(100vh - 48px)",
  },

  content: {
    position: "relative",
    zIndex: 1,
    width: "100%",
  },

  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 24,
  },

  heroText: {
    flex: "1 1 420px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "clamp(2rem, 4vw, 3rem)",
    lineHeight: 1.05,
    fontWeight: 700,
  },

  pageSubtitle: {
    margin: "10px 0 0 0",
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
    lineHeight: 1.5,
    maxWidth: 620,
  },

  projectChip: {
    flex: "0 0 260px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  },

  chipLabel: {
    margin: 0,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.58)",
  },

  chipValue: {
    margin: "6px 0 0 0",
    fontSize: 18,
    fontWeight: 650,
  },

  chipSubtext: {
    margin: "8px 0 0 0",
    fontSize: 13,
    color: "rgba(255,255,255,0.66)",
    lineHeight: 1.4,
  },

  topGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 20,
    width: "100%",
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 20,
    marginTop: 20,
    width: "100%",
  },

  calendarSection: {
    marginTop: 20,
    marginBottom: 20,
  },

  card: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
    boxSizing: "border-box",
  },

  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 650,
  },

  cardDescription: {
    margin: "8px 0 16px 0",
    fontSize: 14,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.68)",
  },

  imageWrap: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.03)",
  },

  image: {
    display: "block",
    width: "100%",
    height: "auto",
    objectFit: "cover",
  },

  emptyState: {
    marginTop: 20,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 18,
  },

  emptyTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 650,
  },

  emptyText: {
    margin: "8px 0 0 0",
    fontSize: 14,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.68)",
  },

  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 30,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 80,
    background: "rgba(11, 15, 23, 0.38)",
    cursor: "pointer",
  },

  glassCard: {
    width: "min(760px, 94%)",
    borderRadius: 30,
    padding: "42px 34px",
    textAlign: "center",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
  },

  glassEyebrow: {
    margin: "0 0 12px 0",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.58)",
  },

  glassTitle: {
    margin: 0,
    fontSize: "clamp(2rem, 5vw, 3.8rem)",
    lineHeight: 1.05,
    fontWeight: 750,
  },

  glassSubtitle: {
    margin: "14px auto 0 auto",
    maxWidth: 560,
    fontSize: 16,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.8)",
  },

  enterButton: {
    marginTop: 26,
    padding: "14px 22px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    fontSize: 14,
    fontWeight: 650,
    letterSpacing: 0.2,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
  },

  todoPreviewCard: {
    width: "100%",
    borderRadius: 18,
    padding: 16,
    cursor: "pointer",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
    overflow: "hidden",
    boxSizing: "border-box",
  },

  todoPreviewTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  todoPreviewEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.6)",
  },

  todoPreviewArrow: {
    fontSize: 18,
    color: "rgba(255,255,255,0.75)",
  },

  todoPreviewBody: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  todoPreviewTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 650,
  },

  todoPreviewText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.75)",
  },

  todoPreviewViewport: {
    marginTop: 8,
    width: "100%",
    height: 420,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
  },

  todoPreviewIframe: {
    width: "100%",
    height: "100%",
    border: "none",
    background: "#0f172a",
    display: "block",
    pointerEvents: "none",
  },
};

export default function DashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const { projectId, role } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectError, setProjectError] = useState("");
  const [revealed, setRevealed] = useState(() => {
    return sessionStorage.getItem("dashboard_revealed") === "true";
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    me(token)
      .then((u: User) => {
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    setLoadingProjects(true);
    setProjectError("");

    listProjects()
      .then((data) => {
        setProjects(data);
        if (projectId) {
          setActiveProjectId(projectId);
        } else if (data.length > 0) {
          setActiveProjectId(data[0].id);
        }
      })
      .catch((e: any) => {
        setProjectError(e?.message ?? "Unable to load projects.");
      })
      .finally(() => {
        setLoadingProjects(false);
      });
  }, [user, projectId]);

  const activeProject = useMemo(() => {
    return projects.find((project) => project.id === activeProjectId) ?? null;
  }, [projects, activeProjectId]);

  const resolvedRole = role ?? user?.role ?? "developer";

  const todoPreviewPath =
    activeProjectId && resolvedRole
      ? `/projects/${activeProjectId}/${resolvedRole}/to-do/planning`
      : "";

  const progressPreviewPath =
    activeProjectId && resolvedRole
      ? `/projects/${activeProjectId}/${resolvedRole}/progress`
      : "";
  
  const eduPreviewPath =
    activeProjectId && resolvedRole
      ? `/projects/${activeProjectId}/${resolvedRole}/education`
      : "";

  return (
    <SidebarLayout>
     <main
  style={{
    ...styles.main,
    background: isDark
      ? "radial-gradient(circle at top left, rgba(99,102,241,0.14), transparent 28%), linear-gradient(180deg, #0b0f17 0%, #0f172a 45%, #0b0f17 100%)"
      : "#f8fafc",
    color: isDark ? "white" : "#111827",
  }}
>
        <div style={styles.shell}>
          <AnimatePresence>
            {!revealed && (
              <motion.div
                style={{
                  ...styles.overlay,
                  background: isDark
                    ? "rgba(11, 15, 23, 0.38)"
                    : "rgba(248, 250, 252, 0.62)",
                }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                onClick={() => {
                  sessionStorage.setItem("dashboard_revealed", "true");
                  setRevealed(true);
                }}
              >
                <motion.div
                  style={{
                    ...styles.glassCard,
                    background: isDark ? styles.glassCard.background : "#ffffff",
                    border: isDark
                      ? styles.glassCard.border
                      : "1px solid rgba(17,24,39,0.08)",
                    boxShadow: isDark
                      ? styles.glassCard.boxShadow
                      : "0 24px 70px rgba(15,23,42,0.10)",
                  }}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    sessionStorage.setItem("dashboard_revealed", "true");
                    setRevealed(true);
                  }}
                >
                  <p
                    style={{
                      ...styles.glassEyebrow,
                      color: isDark ? styles.glassEyebrow.color : "#6b7280",
                    }}
                  >
                    Sprintwheel
                  </p>
                  <h1
                    style={{
                      ...styles.glassTitle,
                      color: isDark ? "white" : "#111827",
                    }}
                  >
                    Hi {user?.name ?? "there"}, welcome to the Dashboard!
                  </h1>
                  <p
                    style={{
                      ...styles.glassSubtitle,
                      color: isDark ? styles.glassSubtitle.color : "#4b5563",
                    }}
                  >
                    View your workspace, project visibility, sprint snapshots,
                    and learning resources in one place.
                  </p>

                  <button
                    type="button"
                    style={{
                      ...styles.enterButton,
                      background: isDark ? styles.enterButton.background : "#f3f4f6",
                      border: isDark
                        ? styles.enterButton.border
                        : "1px solid rgba(17,24,39,0.08)",
                      color: isDark ? "white" : "#111827",
                      boxShadow: isDark
                        ? styles.enterButton.boxShadow
                        : "0 8px 24px rgba(15,23,42,0.08)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      sessionStorage.setItem("dashboard_revealed", "true");
                      setRevealed(true);
                    }}
                  >
                    Enter Workspace
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            style={styles.content}
            initial={{ opacity: 0.82 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <section style={styles.hero}>
              <div style={styles.heroText}>
                <motion.h1
                  style={{
                    ...styles.pageTitle,
                    color: isDark ? "white" : "#111827",
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  Dashboard
                </motion.h1>
                <p
                  style={{
                    ...styles.pageSubtitle,
                    color: isDark ? styles.pageSubtitle.color : "#4b5563",
                  }}
                >
                  A central view of team activity, project context, sprint
                  visibility, and educational support content.
                </p>
              </div>

              <div
                style={{
                  ...styles.projectChip,
                  background: isDark ? styles.projectChip.background : "#ffffff",
                  border: isDark
                    ? styles.projectChip.border
                    : "1px solid rgba(17,24,39,0.08)",
                  boxShadow: isDark
                    ? styles.projectChip.boxShadow
                    : "0 10px 30px rgba(15,23,42,0.08)",
                }}
              >
                <p
                  style={{
                    ...styles.chipLabel,
                    color: isDark ? styles.chipLabel.color : "#6b7280",
                  }}
                >
                  Active Project
                </p>
                <p
                  style={{
                    ...styles.chipValue,
                    color: isDark ? "white" : "#111827",
                  }}
                >
                  {activeProject?.name ?? "No project selected"}
                </p>
                <p
                  style={{
                    ...styles.chipSubtext,
                    color: isDark ? styles.chipSubtext.color : "#6b7280",
                  }}
                >
                  {loadingProjects
                    ? "Loading projects..."
                    : projectError
                    ? projectError
                    : `${projects.length} project${projects.length === 1 ? "" : "s"} available`}
                </p>
              </div>
            </section>

            <section style={styles.topGrid}>
              <div
                style={{
                  ...styles.card,
                  background: isDark ? styles.card.background : "#ffffff",
                  border: isDark
                    ? styles.card.border
                    : "1px solid rgba(17,24,39,0.08)",
                  boxShadow: isDark
                    ? styles.card.boxShadow
                    : "0 12px 32px rgba(15,23,42,0.08)",
                }}
              >
                <h2
                  style={{
                    ...styles.cardTitle,
                    color: isDark ? "white" : "#111827",
                  }}
                >
                  To-Do / Planning
                </h2>
                <p
                  style={{
                    ...styles.cardDescription,
                    color: isDark ? styles.cardDescription.color : "#4b5563",
                  }}
                >
                  Open the full planning workspace to manage sprint tasks, board
                  movement, and team workflow.
                </p>

                <div
                  style={{
                    ...styles.todoPreviewCard,
                    background: isDark ? styles.todoPreviewCard.background : "#ffffff",
                    border: isDark
                      ? styles.todoPreviewCard.border
                      : "1px solid rgba(17,24,39,0.08)",
                    boxShadow: isDark
                      ? styles.todoPreviewCard.boxShadow
                      : "0 12px 32px rgba(15,23,42,0.08)",
                  }}
                  onClick={() => {
                    if (todoPreviewPath) navigate(todoPreviewPath);
                  }}
                >
                  <div style={styles.todoPreviewTop}>
                    <span
                      style={{
                        ...styles.todoPreviewEyebrow,
                        color: isDark ? styles.todoPreviewEyebrow.color : "#6b7280",
                      }}
                    >
                      Task Board
                    </span>
                    <span
                      style={{
                        ...styles.todoPreviewArrow,
                        color: isDark ? styles.todoPreviewArrow.color : "#6b7280",
                      }}
                    >
                      ↗
                    </span>
                  </div>

                  <div style={styles.todoPreviewBody}>
                    <h3
                      style={{
                        ...styles.todoPreviewTitle,
                        color: isDark ? "white" : "#111827",
                      }}
                    >
                      Preview
                    </h3>
                    <p
                      style={{
                        ...styles.todoPreviewText,
                        color: isDark ? styles.todoPreviewText.color : "#4b5563",
                      }}
                    >
                      View your drag-and-drop sprint board and open the full
                      planning page.
                    </p>

                    <div
                      style={{
                        ...styles.todoPreviewViewport,
                        border: isDark
                          ? styles.todoPreviewViewport.border
                          : "1px solid rgba(17,24,39,0.08)",
                        background: isDark
                          ? styles.todoPreviewViewport.background
                          : "#f8fafc",
                      }}
                    >
                      {todoPreviewPath ? (
                        <iframe
                          src={todoPreviewPath}
                          title="To-Do page preview"
                          style={{
                            ...styles.todoPreviewIframe,
                            background: isDark ? "#0f172a" : "#ffffff",
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  ...styles.card,
                  background: isDark ? styles.card.background : "#ffffff",
                  border: isDark
                    ? styles.card.border
                    : "1px solid rgba(17,24,39,0.08)",
                  boxShadow: isDark
                    ? styles.card.boxShadow
                    : "0 12px 32px rgba(15,23,42,0.08)",
                }}
              >
                <h2
                  style={{
                    ...styles.cardTitle,
                    color: isDark ? "white" : "#111827",
                  }}
                >
                  Education
                </h2>
                <p
                  style={{
                    ...styles.cardDescription,
                    color: isDark ? styles.cardDescription.color : "#4b5563",
                  }}
                >
                  Learning materials, guidance, and platform support resources
                  for the team.
                </p>
                
                <div
                  style={{
                    ...styles.todoPreviewCard,
                    background: isDark ? styles.todoPreviewCard.background : "#ffffff",
                    border: isDark
                      ? styles.todoPreviewCard.border
                      : "1px solid rgba(17,24,39,0.08)",
                      boxShadow: isDark
                        ? styles.todoPreviewCard.boxShadow
                        : "0 12px 32px rgba(15,23,42,0.08)",
                  }}
                  onClick={() => {
                    if (eduPreviewPath) navigate(eduPreviewPath);
                  }}
                >
                  <div style={styles.todoPreviewTop}>
                    <span
                      style={{
                        ...styles.todoPreviewEyebrow,
                        color: isDark ? styles.todoPreviewEyebrow.color : "#6b7280",
                      }}
                    >
                      Scrum Edu
                    </span>
                    <span
                      style={{
                        ...styles.todoPreviewArrow,
                        color: isDark ? styles.todoPreviewArrow.color : "#6b7280",
                      }}
                    >
                      ↗
                    </span>
                  </div>

                  <div style={styles.todoPreviewBody}>
                    <h3
                      style={{
                        ...styles.todoPreviewTitle,
                        color: isDark ? "white" : "#111827",
                      }}
                    >
                      Preview
                    </h3>

                    <p
                      style={{
                        ...styles.todoPreviewText,
                        color: isDark ? styles.todoPreviewText.color :"#4b5563",
                      }}
                    >
                      View your learning modules and open the full Scrum Edu page.
                    </p>

                    <div
                      style={{
                        ...styles.todoPreviewViewport,
                        border: isDark
                          ? styles.todoPreviewViewport.border
                          : "1px solid rgba(17,24,39,0.08)",
                        background: isDark
                          ? styles.todoPreviewViewport.background
                          : "#f8fafc",
                      }}
                    >
                      {eduPreviewPath ? (
                        <iframe
                          src={eduPreviewPath}
                          title="Scrum Edu preview"
                          style={{
                            ...styles.todoPreviewIframe,
                            background: isDark ? "#0f172a" : "#ffffff",
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section style={styles.bottomGrid}>
              <div
                style={{
                  ...styles.card,
                  background: isDark ? styles.card.background : "#ffffff",
                  border: isDark
                    ? styles.card.border
                    : "1px solid rgba(17,24,39,0.08)",
                  boxShadow: isDark
                    ? styles.card.boxShadow
                    : "0 12px 32px rgba(15,23,42,0.08)",
                }}
              >
                <h2
                  style={{
                    ...styles.cardTitle,
                    color: isDark ? "white" : "#111827",
                  }}
                >
                  Sprint Overview
                </h2>
                <p
                  style={{
                    ...styles.cardDescription,
                    color: isDark ? styles.cardDescription.color : "#4b5563",
                  }}
                >
                  A quick summary of active sprint status, workload, and current
                  pace.
                </p>
                <div
                  style={{
                    ...styles.imageWrap,
                    border: isDark
                      ? styles.imageWrap.border
                      : "1px solid rgba(17,24,39,0.08)",
                    background: isDark ? styles.imageWrap.background : "#f8fafc",
                  }}
                >
                  <img
                    src="/sprint-overview-placeholder.png"
                    alt="Sprint overview preview"
                    style={styles.image}
                  />
                </div>
              </div>

              <div
                style={{
                  ...styles.card,
                  background: isDark ? styles.card.background : "#ffffff",
                  border: isDark
                    ? styles.card.border
                    : "1px solid rgba(17,24,39,0.08)",
                  boxShadow: isDark
                    ? styles.card.boxShadow
                    : "0 12px 32px rgba(15,23,42,0.08)",
                }}
              >
                <h2
                  style={{
                    ...styles.cardTitle,
                    color: isDark ? "white" : "#111827",
                  }}
                >
                  Progress Insights
                </h2>
                <p
                  style={{
                    ...styles.cardDescription,
                    color: isDark ? styles.cardDescription.color : "#4b5563",
                  }}
                >
                  High-level visibility into progress trends, delivery health,
                  and momentum.
                </p>

                <div
                  style={{
                    ...styles.todoPreviewCard,
                    background: isDark ? styles.todoPreviewCard.background : "#ffffff",
                    border: isDark
                      ? styles.todoPreviewCard.border
                      : "1px solid rgba(17,24,39,0.08)",
                      boxShadow: isDark
                        ? styles.todoPreviewCard.boxShadow
                        : "0 12px 32px rgba(15,23,42,0.08)",
                  }}
                  onClick={() => {
                    if (progressPreviewPath) navigate(progressPreviewPath);
                  }}
                  >
                    <div style={styles.todoPreviewTop}>
                      <span
                      style={{
                        ...styles.todoPreviewEyebrow,
                        color: isDark ? styles.todoPreviewEyebrow.color : "#6b7280",
                      }}
                      >
                        Sprint Burndown Chart
                      </span>
                      <span
                        style={{
                          ...styles.todoPreviewArrow,
                          color: isDark ? styles.todoPreviewArrow.color : "#6b7280",
                        }}
                      >
                        ↗
                      </span>
                    </div>
                    <div style={styles.todoPreviewBody}>
                      <h3
                        style={{
                          ...styles.todoPreviewTitle,
                          color: isDark ? "white" : "#111827",
                        }}
                      >
                        Preview
                      </h3>

                      <p
                        style={{
                          ...styles.todoPreviewText,
                          color: isDark ? styles.todoPreviewText.color : "#4b5563",
                        }}
                      >
                        View your velocity and sprint burndown chart and open the full progress page.
                      </p>

                      <div
                        style={{
                          ...styles.todoPreviewViewport,
                          border: isDark
                            ? styles.todoPreviewViewport.border
                            : "1px solid rgba(17,24,39,0.08)",
                          background: isDark ? styles.todoPreviewViewport.background : "#f8fafc",
                          }}
                      >
                        {progressPreviewPath ? (
                          <iframe
                            src={progressPreviewPath}
                            title="Progress page preview"
                            style={{
                              ...styles.todoPreviewIframe,
                              background: isDark ? "#0f172a" : "#ffffff",
                            }}
                          />
                        ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {projectId && resolvedRole && (
              <section style={styles.calendarSection}>
                <DashboardCalendarPreview
                  projectId={projectId}
                  role={resolvedRole}
                  title="Project Calendar"
                  subtitle="View this month’s schedule at a glance. Click anywhere on the calendar to open the full calendar page."
                />
              </section>
            )}

            {projects.length === 0 && !loadingProjects && !projectError && (
              <section
                style={{
                  ...styles.emptyState,
                  background: isDark ? styles.emptyState.background : "#ffffff",
                  border: isDark
                    ? styles.emptyState.border
                    : "1px solid rgba(17,24,39,0.08)",
                }}
              >
                <h3
                  style={{
                    ...styles.emptyTitle,
                    color: isDark ? "white" : "#111827",
                  }}
                >
                  No Projects Yet
                </h3>
                <p
                  style={{
                    ...styles.emptyText,
                    color: isDark ? styles.emptyText.color : "#4b5563",
                  }}
                >
                  Once a project is created, it will appear here so the
                  dashboard can highlight active work and team progress.
                </p>
              </section>
            )}
          </motion.div>
        </div>
      </main>
    </SidebarLayout>
  );
}