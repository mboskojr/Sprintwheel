// src/pages/NewProject.tsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import React, { useMemo, useState } from "react";
import { createProject, getProject, joinProject } from "../api/projects";

type Status = "idle" | "loading" | "success" | "error";

const styles: Record<string, React.CSSProperties> = {
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
    width: "min(880px, 96vw)",
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

  panel: {
    borderRadius: 20,
    padding: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  panelTitleWrap: { display: "flex", alignItems: "center", gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 20,
    flexShrink: 0,
  },
  panelTitle: { margin: 0, fontSize: 18, fontWeight: 800 },
  panelDesc: { margin: "6px 0 0 0", fontSize: 13, opacity: 0.8 },

  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
    marginTop: 12,
  },
  input: {
  width: "100%",
  maxWidth: 420,
  boxSizing: "border-box",
  borderRadius: 12,
  padding: "12px 12px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  outline: "none",
  fontSize: 14,
},
  inlineRow: {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
},
  button: {
    borderRadius: 999,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  buttonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 1.5,
  },
  error: {
    marginTop: 10,
    fontSize: 12,
    color: "#ffb4b4",
    lineHeight: 1.5,
  },
  success: {
    marginTop: 10,
    fontSize: 12,
    color: "#b9ffcc",
    lineHeight: 1.5,
  },
};

export default function NewProject(): JSX.Element {
  const navigate = useNavigate();

  // Create Project state
  const [projectName, setProjectName] = useState<string>("New Project");
  const [sprintDuration, setSprintDuration] = useState<number>(14);
  const [createStatus, setCreateStatus] = useState<Status>("idle");
  const [createMsg, setCreateMsg] = useState<string>("");

  // Join Project state
  const [joinProjectId, setJoinProjectId] = useState<string>("");
  const [joinStatus, setJoinStatus] = useState<Status>("idle");
  const [joinMsg, setJoinMsg] = useState<string>("");

  const isBusy = useMemo(
    () => createStatus === "loading" || joinStatus === "loading",
    [createStatus, joinStatus]
  );

  async function handleCreateProject() {
    if (isBusy) return;

    const name = projectName.trim() || "New Project";
    const duration = Number.isFinite(sprintDuration) ? sprintDuration : 14;

    setCreateStatus("loading");
    setCreateMsg("");
    try {
      const created = await createProject({
        name,
        sprint_duration: duration,
      });

      setCreateStatus("success");
      setCreateMsg(`Created project “${created.name}”. Redirecting…`);

      navigate(`/projects/${created.id}/dashboard`);
    } catch (err: any) {
      setCreateStatus("error");
      setCreateMsg(
        err?.message ||
          "Could not create the project. Please try again (and check backend/auth)."
      );
    }
  }

  async function handleJoinProject() {
    if (isBusy) return;

    const id = joinProjectId.trim();
    if (!id) {
      setJoinStatus("error");
      setJoinMsg("Please enter a project ID.");
      return;
    }

    setJoinStatus("loading");
    setJoinMsg("");

    try {
      // 1) Verify project exists
      await getProject(id);

      // 2) Join it (role required by your API shape; set a default for now)
      await joinProject(id, { role: "Developer" });

      setJoinStatus("success");
      setJoinMsg("Joined project. Redirecting…");

      navigate(`/projects/${id}/role-options`);
    } catch (err: any) {
      // If your api() throws Response-like errors, this will still fall back safely.
      const msg =
        err?.status === 404 || /404|not found/i.test(String(err?.message))
          ? "Project not found. Double-check the project ID."
          : err?.message ||
            "Could not join that project. Please try again (and check backend/auth).";

      setJoinStatus("error");
      setJoinMsg(msg);
    }
  }

  function onJoinKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleJoinProject();
  }

  return (
    <div style={styles.shell}>
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div style={styles.header}>
          <h1 style={styles.title}>Projects</h1>
          <p style={styles.subtitle}>
            Create a new project, or join an existing one with its Project ID.
          </p>
        </div>

        <div style={styles.grid}>
          {/* Create New Project */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitleWrap}>
                <span style={styles.icon}>✨</span>
                <div>
                  <h2 style={styles.panelTitle}>Create New Project</h2>
                  <p style={styles.panelDesc}>
                    Start fresh. We’ll create it and send you straight to the
                    dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.formRow}>
              <input
                style={styles.input}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
                disabled={isBusy}
              />
              <input
                style={styles.input}
                value={String(sprintDuration)}
                onChange={(e) => setSprintDuration(Number(e.target.value))}
                placeholder="Sprint duration (days)"
                inputMode="numeric"
                disabled={isBusy}
              />

              <motion.button
                type="button"
                style={{
                  ...styles.button,
                  ...(isBusy ? styles.buttonDisabled : {}),
                  width: "fit-content",
                }}
                onClick={handleCreateProject}
                disabled={isBusy}
                whileHover={isBusy ? undefined : { y: -2 }}
                whileTap={isBusy ? undefined : { scale: 0.98 }}
              >
                {createStatus === "loading" ? "Creating…" : "Create New Project"}
              </motion.button>

              {createStatus === "error" && (
                <div style={styles.error}>{createMsg}</div>
              )}
              {createStatus === "success" && (
                <div style={styles.success}>{createMsg}</div>
              )}
              {createStatus === "idle" && (
                <div style={styles.hint}>
                  Tip: you can rename and adjust sprint settings later.
                </div>
              )}
            </div>
          </div>

          {/* Join Project */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitleWrap}>
                <span style={styles.icon}>🔗</span>
                <div>
                  <h2 style={styles.panelTitle}>Join Project</h2>
                  <p style={styles.panelDesc}>
                    Enter a Project ID to join. If it exists, we’ll add you and
                    take you to role setup.
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.inlineRow}>
                <input
                  style={styles.input}
                  value={joinProjectId}
                  onChange={(e) => setJoinProjectId(e.target.value)}
                  onKeyDown={onJoinKeyDown}
                  placeholder="Project ID (e.g., 3f9a2c...)"
                  disabled={isBusy}
                />

                <motion.button
                  type="button"
                  style={{
                    ...styles.button,
                    ...(isBusy ? styles.buttonDisabled : {}),
                  }}
                  onClick={handleJoinProject}
                  disabled={isBusy}
                  whileHover={isBusy ? undefined : { y: -2 }}
                  whileTap={isBusy ? undefined : { scale: 0.98 }}
                >
                  {joinStatus === "loading" ? "Joining…" : "Enter"}
                </motion.button>
              </div>

              {joinStatus === "error" && (
                <div style={styles.error}>{joinMsg}</div>
              )}
              {joinStatus === "success" && (
                <div style={styles.success}>{joinMsg}</div>
              )}
              {joinStatus === "idle" && (
                <div style={styles.hint}>
                  Press <b>Enter</b> to submit quickly.
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}