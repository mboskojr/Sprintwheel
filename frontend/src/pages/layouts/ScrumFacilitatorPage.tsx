/* import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    overflow: "hidden",
  },

  content: {
    position: "relative",
    zIndex: 1,
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
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    alignItems: "stretch",
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginTop: 20,
  },

  calendarSection: {
    marginTop: 20,
    marginBottom: 20,
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
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
};

export default function ScrumFacilitatorPage(): JSX.Element {
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

  function dismiss() {
    sessionStorage.setItem("dashboard_revealed", "true");
    setRevealed(true);
  }

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
                onClick={dismiss}
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <p
                    style={{
                      ...styles.glassEyebrow,
                      color: isDark ? styles.glassEyebrow.color : "#6b7280",
                    }}
                  >
                    Scrum Facilitator
                  </p>
                  <h1
                    style={{
                      ...styles.glassTitle,
                      color: isDark ? "white" : "#111827",
                    }}
                  >
                    Hi {user?.name ?? "there"}, welcome to your workspace!
                  </h1>
                  <p
                    style={{
                      ...styles.glassSubtitle,
                      color: isDark ? styles.glassSubtitle.color : "#4b5563",
                    }}
                  >
                    Manage impediments, retrospectives, meetings, and team scrum
                    support tools from one central page.
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
                      dismiss();
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
                  Scrum Facilitator Dashboard
                </motion.h1>
                <p
                  style={{
                    ...styles.pageSubtitle,
                    color: isDark ? styles.pageSubtitle.color : "#4b5563",
                  }}
                >
                  A central view for removing blockers, supporting team cadence,
                  organizing retrospectives, and managing scrum operations.
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
                  Impediment Tracker
                </h2>
                <p
                  style={{
                    ...styles.cardDescription,
                    color: isDark ? styles.cardDescription.color : "#4b5563",
                  }}
                >
                  Track blockers surfaced by the team and monitor issues that
                  may slow sprint progress or delivery.
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
                    src="/impediment_tracker.jpeg"
                    alt="Impediment tracker preview"
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
                  Retrospective Notes
                </h2>
                <p
                  style={{
                    ...styles.cardDescription,
                    color: isDark ? styles.cardDescription.color : "#4b5563",
                  }}
                >
                  Review sprint feedback, identify improvement areas, and
                  organize follow-up actions for future sprint cycles.
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
                    src="/task-board-placeholder.png"
                    alt="Retrospective notes preview"
                    style={styles.image}
                  />
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
                  Set a Meeting
                </h2>
                <p
                  style={{
                    ...styles.cardDescription,
                    color: isDark ? styles.cardDescription.color : "#4b5563",
                  }}
                >
                  Schedule team ceremonies, syncs, and follow-up discussions to
                  maintain sprint alignment.
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
                    alt="Meeting scheduling preview"
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
                  Admin Scrum Edu
                </h2>
                <p
                  style={{
                    ...styles.cardDescription,
                    color: isDark ? styles.cardDescription.color : "#4b5563",
                  }}
                >
                  Assign learning modules and educational support to developers
                  and product owners as needed.
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
                    src="/education-module-placeholder.png"
                    alt="Scrum education preview"
                    style={styles.image}
                  />
                </div>
              </div>
            </section>

            {projectId && role && (
              <section style={styles.calendarSection}>
                <DashboardCalendarPreview
                  projectId={projectId}
                  role={role}
                  title="All Projects Calendar"
                  subtitle="View this week’s events across all projects. Click anywhere to open the full calendar page."
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
                  Once a project is created, it will appear here so the scrum
                  facilitator dashboard can show active team context and sprint
                  support tools.
                </p>
              </section>
            )}
          </motion.div>
        </div>
      </main>
    </SidebarLayout>
  );
} */ 

  import { motion, AnimatePresence } from "framer-motion";
  import { useEffect, useMemo, useState } from "react";
  import type { CSSProperties, JSX } from "react";
  import { useNavigate, useParams } from "react-router-dom";
  import { me } from "../../api/auth";
  import { listProjects, type Project } from "../../api/projects";
  import SidebarLayout from "../../components/SidebarLayout";
  import DashboardCalendarPreview from "../../components/DashboardCalendarPreview";
  import { useTheme } from "../ThemeContext";
  
  type User = { id: string; name: string; email: string; role: string };
  
  function MiniPagePreview({
    path,
    isDark,
    height = 320,
    scale = 0.43,
  }: {
    path: string;
    isDark: boolean;
    height?: number;
    scale?: number;
  }) {
    const frameHeight = height / scale;
  
    return (
      <div
        style={{
          marginTop: 14,
          position: "relative",
          height,
          width: "100%",
          overflow: "hidden",
          borderRadius: 16,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.08)"}`,
          background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${100 / scale}%`,
            height: frameHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
            background: isDark ? "#0f172a" : "#ffffff",
          }}
        >
          <iframe
            title={`preview-${path}`}
            src={path}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              background: isDark ? "#0f172a" : "#ffffff",
            }}
          />
        </div>
  
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? "linear-gradient(to bottom, rgba(15,23,42,0.02), rgba(15,23,42,0.08))"
              : "linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0.06))",
            pointerEvents: "none",
          }}
        />
  
        <div
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background: isDark ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.92)",
            color: isDark ? "rgba(255,255,255,0.85)" : "#374151",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.08)"}`,
            backdropFilter: "blur(8px)",
            pointerEvents: "none",
          }}
        >
          Live Preview
        </div>
      </div>
    );
  }
  
  export default function ScrumFacilitatorPage(): JSX.Element {
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
    const [revealed, setRevealed] = useState(
      () => sessionStorage.getItem("dashboard_revealed") === "true"
    );
  
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
      listProjects()
        .then((data) => {
          setProjects(data);
          setActiveProjectId(projectId ?? (data[0]?.id ?? null));
        })
        .catch((e: any) => setProjectError(e?.message ?? "Unable to load projects."))
        .finally(() => setLoadingProjects(false));
    }, [user, projectId]);
  
    const activeProject = useMemo(
      () => projects.find((p) => p.id === activeProjectId) ?? null,
      [projects, activeProjectId]
    );
  
    const dismiss = () => {
      sessionStorage.setItem("dashboard_revealed", "true");
      setRevealed(true);
    };
  
    const communicationPath =
      activeProjectId && role ? `/projects/${activeProjectId}/${role}/communication` : "";
    const calendarPath =
      activeProjectId && role ? `/projects/${activeProjectId}/${role}/calendar` : "";
    const educationPath =
      activeProjectId && role ? `/projects/${activeProjectId}/${role}/education` : "";
  
    const bg = isDark
      ? "radial-gradient(circle at top left, rgba(99,102,241,0.14), transparent 28%), linear-gradient(180deg, #0b0f17 0%, #0f172a 45%, #0b0f17 100%)"
      : "#f1f5f9";
  
    const baseShadow = isDark
      ? "0 12px 32px rgba(0,0,0,0.18)"
      : "0 4px 24px rgba(15,23,42,0.07)";
  
    const hoverShadow = isDark
      ? "0 18px 44px rgba(0,0,0,0.3)"
      : "0 8px 32px rgba(15,23,42,0.13)";
  
    const card: CSSProperties = {
      background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.08)"}`,
      borderRadius: 20,
      padding: 20,
      boxShadow: baseShadow,
      transition: "box-shadow 0.15s, transform 0.15s",
    };
  
    const cardTitle: CSSProperties = {
      margin: 0,
      fontSize: 17,
      fontWeight: 700,
      color: isDark ? "white" : "#111827",
    };
  
    const cardDesc: CSSProperties = {
      margin: "5px 0 0",
      fontSize: 13,
      lineHeight: 1.5,
      color: isDark ? "rgba(255,255,255,0.58)" : "#6b7280",
    };
  
    const eyebrow: CSSProperties = {
      margin: "0 0 4px",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1.4,
      textTransform: "uppercase" as const,
      color: isDark ? "rgba(255,255,255,0.38)" : "#9ca3af",
    };
  
    const sectionLabel: CSSProperties = {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1.5,
      textTransform: "uppercase" as const,
      color: isDark ? "rgba(255,255,255,0.38)" : "#9ca3af",
      margin: "0 0 12px",
    };
  
    const arrow = (
      <span
        style={{
          fontSize: 16,
          color: isDark ? "rgba(255,255,255,0.38)" : "#9ca3af",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        ↗
      </span>
    );
  
    const clickCard = (path: string): CSSProperties => ({
      ...card,
      cursor: path ? "pointer" : "default",
    });
  
    const onEnter = (e: React.MouseEvent<HTMLDivElement>, active: boolean) => {
      if (!active) return;
      e.currentTarget.style.boxShadow = hoverShadow;
      e.currentTarget.style.transform = "translateY(-2px)";
    };
  
    const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.boxShadow = baseShadow;
      e.currentTarget.style.transform = "translateY(0)";
    };
  
    return (
      <SidebarLayout>
        <main
          style={{
            width: "100%",
            minHeight: "100vh",
            padding: 24,
            background: bg,
            color: isDark ? "white" : "#111827",
            position: "relative",
          }}
        >
          <AnimatePresence>
            {!revealed && (
              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 30,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  padding: "70px 24px",
                  background: isDark ? "rgba(11,15,23,0.62)" : "rgba(241,245,249,0.82)",
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                onClick={dismiss}
              >
                <motion.div
                  style={{
                    width: "min(580px,94%)",
                    borderRadius: 28,
                    padding: "44px 36px",
                    textAlign: "center",
                    background: isDark ? "rgba(255,255,255,0.07)" : "#ffffff",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(17,24,39,0.08)"}`,
                    backdropFilter: "blur(24px)",
                    boxShadow: isDark
                      ? "0 24px 70px rgba(0,0,0,0.4)"
                      : "0 24px 70px rgba(15,23,42,0.12)",
                  }}
                  initial={{ opacity: 0, y: 28, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.97 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af",
                    }}
                  >
                    Scrum Master
                  </p>
                  <h1
                    style={{
                      margin: "0 0 12px",
                      fontSize: "clamp(1.8rem,4vw,2.8rem)",
                      fontWeight: 800,
                      color: isDark ? "white" : "#111827",
                      lineHeight: 1.1,
                    }}
                  >
                    Hi {user?.name ?? "there"}, welcome!
                  </h1>
                  <p
                    style={{
                      margin: "0 auto 24px",
                      maxWidth: 420,
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: isDark ? "rgba(255,255,255,0.65)" : "#4b5563",
                    }}
                  >
                    Manage impediments, ceremonies, team education, and scrum support tools from one central page.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss();
                    }}
                    style={{
                      padding: "12px 28px",
                      borderRadius: 999,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(17,24,39,0.1)"}`,
                      background: isDark ? "rgba(249,115,22,0.22)" : "#fff7ed",
                      color: isDark ? "white" : "#c2410c",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Enter Workspace →
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
  
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    margin: 0,
                    fontSize: "clamp(1.8rem,4vw,2.6rem)",
                    fontWeight: 800,
                    color: isDark ? "white" : "#111827",
                    lineHeight: 1.05,
                  }}
                >
                  Scrum Master
                </motion.h1>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: 14,
                    color: isDark ? "rgba(255,255,255,0.55)" : "#6b7280",
                  }}
                >
                  Impediments · Ceremonies · Education
                </p>
              </div>
  
              <div style={{ ...card, padding: "12px 18px", minWidth: 200 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: isDark ? "rgba(255,255,255,0.38)" : "#9ca3af",
                  }}
                >
                  Active Project
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 16,
                    fontWeight: 700,
                    color: isDark ? "white" : "#111827",
                  }}
                >
                  {activeProject?.name ?? "—"}
                </p>
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 12,
                    color: isDark ? "rgba(255,255,255,0.45)" : "#6b7280",
                  }}
                >
                  {loadingProjects
                    ? "Loading…"
                    : projectError
                    ? projectError
                    : activeProject
                    ? `${activeProject.active_member_count} member${activeProject.active_member_count === 1 ? "" : "s"}`
                    : "No active project"}
                </p>
              </div>
            </div>
  
            {projectId && role && (
              <div style={{ marginBottom: 28 }}>
                <p style={sectionLabel}>📅 Calendar</p>
                <DashboardCalendarPreview
                  projectId={projectId}
                  role={role}
                  title="All Projects Calendar"
                  subtitle="This week's events. Click to open the full calendar."
                />
              </div>
            )}
  
            <p style={sectionLabel}>🔧 Facilitation Workspace</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: 16,
              }}
            >
              <div
                style={clickCard(communicationPath)}
                onClick={() => communicationPath && navigate(communicationPath)}
                onMouseEnter={(e) => onEnter(e, !!communicationPath)}
                onMouseLeave={onLeave}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <p style={eyebrow}>Blockers</p>
                    <h2 style={cardTitle}>Impediment Tracker</h2>
                    <p style={cardDesc}>
                      A smaller live version of the actual Communication page.
                    </p>
                  </div>
                  {communicationPath && arrow}
                </div>
                {communicationPath && (
                  <MiniPagePreview
                    path={communicationPath}
                    isDark={isDark}
                    height={320}
                    scale={0.43}
                  />
                )}
              </div>
  
              <div
                style={clickCard(calendarPath)}
                onClick={() => calendarPath && navigate(calendarPath)}
                onMouseEnter={(e) => onEnter(e, !!calendarPath)}
                onMouseLeave={onLeave}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <p style={eyebrow}>Ceremonies</p>
                    <h2 style={cardTitle}>Set a Meeting</h2>
                    <p style={cardDesc}>
                      A smaller live version of the actual Calendar page.
                    </p>
                  </div>
                  {calendarPath && arrow}
                </div>
                {calendarPath && (
                  <MiniPagePreview
                    path={calendarPath}
                    isDark={isDark}
                    height={320}
                    scale={0.43}
                  />
                )}
              </div>
  
              <div
                style={clickCard(educationPath)}
                onClick={() => educationPath && navigate(educationPath)}
                onMouseEnter={(e) => onEnter(e, !!educationPath)}
                onMouseLeave={onLeave}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <p style={eyebrow}>Education Admin</p>
                    <h2 style={cardTitle}>Scrum Edu</h2>
                    <p style={cardDesc}>
                      A smaller live version of the actual Education page.
                    </p>
                  </div>
                  {educationPath && arrow}
                </div>
                {educationPath && (
                  <MiniPagePreview
                    path={educationPath}
                    isDark={isDark}
                    height={320}
                    scale={0.43}
                  />
                )}
              </div>
            </div>
  
            {projects.length === 0 && !loadingProjects && !projectError && (
              <div style={{ ...card, marginTop: 20, textAlign: "center", padding: 40 }}>
                <p style={{ fontSize: 30, margin: "0 0 10px" }}>🚀</p>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: isDark ? "white" : "#111827",
                  }}
                >
                  No Projects Yet
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 13,
                    color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280",
                  }}
                >
                  Once a project is created, it will appear here.
                </p>
              </div>
            )}
          </motion.div>
        </main>
      </SidebarLayout>
    );
  }