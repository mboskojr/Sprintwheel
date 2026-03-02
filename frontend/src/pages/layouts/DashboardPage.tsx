import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CSSProperties, JSX } from "react";
import { me } from "../../api/auth"; 
import { listProjects, type Project } from "../../api/projects";

type User = { id: string; name: string; email: string; role: string };

/** inline styles for quick layout + vibes */
const styles: Record<string, CSSProperties> = {
  shell: {
    display: "flex",
    height: "100vh",
    width: "100%",
    background: "#0b0f17",
    color: "white",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    padding: 14,
    background: "#0a0e16",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    transition: "width 0.2s ease",
    overflow: "hidden",
  },
  sidebarTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  brand: { margin: 0, fontSize: 18, fontWeight: 700 },
  collapseBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
  },
  nav: { display: "flex", flexDirection: "column", gap: 12 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
    background: "rgba(255,255,255,0.06)",
  },
  icon: { fontSize: 20, width: 28, textAlign: "center" },
  navLabel: { fontSize: 14, fontWeight: 600 },
  main: { flex: 1, padding: 24, overflow: "auto" },

  // task board placeholder section (temporary)
  taskBoard: { width: "100%", marginTop: 16 },
  taskBoardTitle: {
    margin: "0 0 12px 0",
    textAlign: "center",
  },
  taskBoardImage: {
    width: "100%",
    height: "auto",
    display: "block",
    borderRadius: 12,
    objectFit: "cover",
  },

  // education module placeholder section (temporary)
  education: { width: "100%", marginTop: 32 },
  educationTitle: {
    margin: "0 0 12px 0",
    textAlign: "center",
  },
  educationImage: {
    width: "100%",
    height: "auto",
    display: "block",
    borderRadius: 12,
    objectFit: "cover",
  },

  // side-by-side module (temporary)
  dualSection: {
    width: "100%",
    marginTop: 40,
  },
  dualGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
  },
  dualCard: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
  },
  dualTitle: {
    margin: "0 0 12px 0",
    textAlign: "center",
    fontSize: 16,
    fontWeight: 600,
  },
  dualImage: {
    width: "100%",
    height: "auto",
    borderRadius: 12,
    display: "block",
  },
  
};

function NavItem({
  icon,
  label,
  collapsed,
}: {
  icon: string;
  label: string;
  collapsed: boolean;
}): JSX.Element {
  return (
    <div style={styles.navItem} title={collapsed ? label : undefined}>
      <span style={styles.icon}>{icon}</span>
      {!collapsed && <span style={styles.navLabel}>{label}</span>}
    </div>
  );
}

export default function DashboardPage(): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectError, setProjectError] = useState<string>("");
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    // Always verify token → fetch current user from backend
    me(token)
      .then((u: User) => {
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      })
      .catch(() => {
        // token invalid/expired → force re-login
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
    
          if (data.length > 0) {
            setActiveProjectId(data[0].id);
          }
        })
        .catch((e: any) => {
          setProjectError(e.message);
        })
        .finally(() => {
          setLoadingProjects(false);
        });
    }, [user]);

  return (
    <div style={styles.shell}>
      <aside
        style={{
          ...styles.sidebar,
          width: collapsed ? 60 : 200,
        }}
      >
        {/* sidebar header (keeping it cute + simple) */}
        <div style={styles.sidebarTop}>
          {!collapsed && <h2 style={styles.brand}>SprintWheel</h2>}
          <button
            style={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="toggle sidebar"
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>

        {/* sidebar nav (these are placeholders for now) */}
        <nav style={styles.nav}>
          <NavItem icon="📝" label="To-Do / Planning" collapsed={collapsed} />
          <NavItem icon="📧" label="Communication" collapsed={collapsed} />
          <NavItem icon="📊" label="Progress" collapsed={collapsed} />
          <NavItem icon="📌" label="Project Details" collapsed={collapsed} />
          <NavItem icon="🧠" label="Education" collapsed={collapsed} />
          <NavItem icon="⚙️" label="Settings" collapsed={collapsed} />
        </nav>
      </aside>

      {/* main dashboard content */}
      <main className="app-background" style={styles.main}>
        <div className="hero">
          {/* intro copy – i’ll personalize this later */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            🤓 Hi {user?.name ?? "there"}, welcome to the Dashboard! 🤓 
          </motion.h1>
          <div style={{ marginTop: 20 }}>
              <h3>Your Projects</h3>

              {loadingProjects && <p>Loading projects...</p>}
              {projectError && <p style={{ color: "red" }}>{projectError}</p>}

              {projects.length === 0 && !loadingProjects && (
                <p>No projects yet.</p>
              )}

              {projects.length > 0 && (
                <select
                  value={activeProjectId ?? ""}
                  onChange={(e) => setActiveProjectId(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          {/* task board placeholder lives right under the intro */}
          <section style={styles.taskBoard}>
            <h2 style={styles.taskBoardTitle}>Task Board</h2>
            <img
              src="/task-board-placeholder.png"
              alt="task board coming soon"
              style={styles.taskBoardImage}
            />
          </section>

          {/* education placeholder (same vibe, different section) */}
          <section style={styles.education}>
            <h2 style={styles.educationTitle}>Education</h2>
            <img
              src="/education-module-placeholder.png"
              alt="education coming soon"
              style={styles.educationImage}
            />
          </section>

          {/* side-by-side section */}
          <section style={styles.dualSection}>
            <div style={styles.dualGrid}>
              <div style={styles.dualCard}>
                <h3 style={styles.dualTitle}>Sprint Overview</h3>
                <img
                  src="/sprint-overview-placeholder.png"
                  alt="sprint overview coming soon"
                  style={styles.dualImage}
                />
              </div>

              <div style={styles.dualCard}>
                <h3 style={styles.dualTitle}>Progress Insights</h3>
                <img
                  src="/progress-insights-placeholder.png"
                  alt="progress insights coming soon"
                  style={styles.dualImage}
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}