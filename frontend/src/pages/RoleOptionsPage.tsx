import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import type { CSSProperties, JSX } from "react";
import { updateRole } from "../api/projects";
import { useState } from "react";


const styles: Record<string, CSSProperties> = {
  error: {
  marginTop: 14,
  fontSize: 12,
  color: "#ffb4b4",
  opacity: 0.95,
          },
  shell: {
    minHeight: "100vh",
    width: "100%",
    background: "#0b0f17",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "min(760px, 96vw)",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  },
  header: { marginBottom: 18 },
  title: { margin: 0, fontSize: 34, fontWeight: 800, letterSpacing: -0.3 },
  subtitle: {
    margin: "10px 0 0 0",
    opacity: 0.82,
    fontSize: 15,
    lineHeight: 1.5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
    marginTop: 22,
  },
  pill: {
    width: "100%",
    borderRadius: 999,
    padding: "18px 18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    textAlign: "left",
  },
  left: { display: "flex", alignItems: "center", gap: 14 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 22,
    flexShrink: 0,
  },
  roleTextWrap: { display: "flex", flexDirection: "column" },
  roleTitle: { margin: 0, fontSize: 18, fontWeight: 800 },
  roleDesc: { margin: "4px 0 0 0", fontSize: 13, opacity: 0.8 },
  arrow: { opacity: 0.8, fontSize: 18, fontWeight: 700 },
  footer: {
    marginTop: 18,
    opacity: 0.65,
    fontSize: 12,
    lineHeight: 1.5,
  },
};

type RoleButtonProps = {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
};

function RolePill({
  icon,
  title,
  description,
  onClick,
}: RoleButtonProps): JSX.Element {
  return (
    <motion.button
      type="button"
      style={styles.pill}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <span style={styles.left}>
        <span style={styles.icon}>{icon}</span>
        <span style={styles.roleTextWrap}>
          <span style={styles.roleTitle}>{title}</span>
          <span style={styles.roleDesc}>{description}</span>
        </span>
      </span>
      <span style={styles.arrow}>→</span>
    </motion.button>
  );
}
function roleToUrlKey(role: string): string {
  switch (role) {
    case "Product Owner":
      return "product-owner";
    case "Scrum Facilitator":
      return "scrum-facilitator";
    case "Developer":
      return "developer";
    default:
      return "member";
  }
}

export default function RoleOptionsPage(): JSX.Element {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const setRoleAndGo = async (roleLabel: string, destination: string) => {
    if (!projectId || busy) return;
    setError("");
    setBusy(true);

    try {
      // Update role for *current user* in this project (backend uses current_user)
      await updateRole(projectId, { role: roleLabel });

      const roleKey = roleToUrlKey(roleLabel);
      navigate(`/projects/${projectId}/${roleKey}/${destination}`);
    } catch (err: any) {
      setError(
        err?.message ||
          "Could not update your role. Please try again (and confirm you are logged in)."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.shell}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Choose your role</h1>
          <p style={styles.subtitle}>
            This sets the layout + tools you’ll see. You can change it later in
            Settings.
          </p>
        </div>

        <div style={styles.grid}>
          <RolePill
            icon="💼"
            title="Product Owner"
            description="Prioritize the backlog, manage scope, and align stakeholders."
            onClick={() => setRoleAndGo("Product Owner", "product-owner")}
          />

          <RolePill
            icon="🧭"
            title="Scrum Facilitator"
            description="Run standups, track blockers, and keep the sprint moving."
            onClick={() => setRoleAndGo("Scrum Facilitator", "scrum-facilitator")}
          />

          <RolePill
            icon="💻"
            title="Developer"
            description="Jump into tasks, progress, and sprint insights."
            onClick={() => setRoleAndGo("Developer", "dashboard")}
          />
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}

        <div style={styles.footer}></div>
      </div>
    </div>
  );
}