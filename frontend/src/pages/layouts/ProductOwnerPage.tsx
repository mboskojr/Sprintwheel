import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { CSSProperties, JSX } from "react";
import { useNavigate } from "react-router-dom";
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
};

function NavItem({
  icon,
  label,
  collapsed,
  to,
}: {
  icon: string;
  label: string;
  collapsed: boolean;
  to: string;
}): JSX.Element {
  const navigate = useNavigate();

  return (
    <div
      style={styles.navItem}
      title={collapsed ? label : undefined}
      role="button"
      tabIndex={0}
      onClick={() => navigate(to)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate(to);
      }}
    >
      <span style={styles.icon}>{icon}</span>
      {!collapsed && <span style={styles.navLabel}>{label}</span>}
    </div>
  );
}

export default function ProductOwnerPage(): JSX.Element {
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

        <nav style={styles.nav}>
          <NavItem icon="📝" label="To-Do / Planning" collapsed={collapsed} to="/to-do/planning" />
          <NavItem icon="📧" label="Communication" collapsed={collapsed} to="/communication" />
          <NavItem icon="📊" label="Progress" collapsed={collapsed} to="/progress" />
          <NavItem icon="📌" label="Project Details" collapsed={collapsed} to="/project-details" />
          <NavItem icon="🧠" label="Education" collapsed={collapsed} to="/education" />
          <NavItem icon="⚙️" label="Settings" collapsed={collapsed} to="/settings" />
        </nav>
      </aside>

      <main className="app-background" style={styles.main}>
        <div className="hero">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            Hi {user?.name ?? "there"}, welcome to the Dashboard! 
          </motion.h1>
          <div style={{ color: "white", padding: 40 }}>
            <p>This is the Product Owner page.</p>
            <h2>Project Microcharter</h2>
            <p> Project Microcharter details will be found here.</p>
            <h2>Product Backlog</h2>
            <img
              src="/product_backlog_framework.jpeg"
              alt="Product Backlog showing list of user stories and tasks"
              style={{ maxWidth: "100%", height: "auto", marginTop: 20 }}
            />
            <p>
              Function: takes data from Task Board and computes it here allows PO to drag & drop
              assignments for particular sprints
            </p>

            <h2>Product Roadmap</h2>
            <img
              src="/product_roadmap_placeholder.png"
              alt="Product Roadmap showing timeline of product development and key milestones"
              style={{ maxWidth: "100%", height: "auto", marginTop: 20 }}
            />

            <h2>Team Progress</h2>
            <p>Function: streamlined from velocity, burndown chart and serves as info radiator devs can post here</p>
            <p>Allows PO to create acceptance criteria & answer team questions</p>
          </div>
        </div>
      </main>
    </div>
  );
}
