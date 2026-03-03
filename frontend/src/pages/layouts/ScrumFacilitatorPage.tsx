import { motion } from "framer-motion";
import { useState } from "react";
import type { CSSProperties, JSX } from "react";
import { useNavigate } from "react-router-dom";

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

export default function ScrumFacilitatorPage(): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

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
            Hi Scrum Facilitator, welcome to the Dashboard.
          </motion.h1>
          <div style={{ color: "white", padding: 40 }}>
            <p>This is the Scrum Facilitator page.</p>
            <h2>Impediment Tracker</h2>
            <p> Impediment Tracker details will be found here.</p>
            
            <h2>Retrospective Notes</h2>
            <p>
              Function: takes data from Task Board and computes it here allows PO to drag & drop
              assignments for particular sprints
            </p>

            <h2>Set a Meeting</h2>
            <p> Meeting scheduling feature will be found here.</p>
            
            <h2>Admin Scrum Edu</h2>
            <p> Assign Modules to Devs & PO</p>
          </div>
        </div>
      </main>
    </div>
  );
}