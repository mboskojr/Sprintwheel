import { useEffect, useState } from "react";
import { createProject, listProjects, type Project } from "../api/projects";

export default function ProjectsDebug() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState("");

  async function refresh() {
    const data = await listProjects();
    setProjects(data);
  }

  useEffect(() => {
    refresh().catch((e) => setStatus(e.message));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Projects Debug</h2>

      <button
        onClick={async () => {
          try {
            setStatus("Creating...");
            await createProject({ name: "Test Project", sprint_duration: 14 });
            await refresh();
            setStatus("Created ✅");
          } catch (e: any) {
            setStatus(e.message || "Error");
          }
        }}
      >
        Create Test Project
      </button>

      <div style={{ marginTop: 10 }}>{status}</div>

      <pre style={{ marginTop: 10 }}>{JSON.stringify(projects, null, 2)}</pre>
    </div>
  );
}