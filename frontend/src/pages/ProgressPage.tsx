import { useEffect, useState, type CSSProperties, type JSX } from "react";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";
import { api } from "../api/client";
import { useSprintBurndownData } from "../hooks/useBurndown";
import { BurndownChartUI } from "../components/BurndownChartUI";
import { useNavigate, useParams } from "react-router-dom";

interface Sprint {
  id: string;
  sprint_number: number;
  sprint_name?: string;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
}

export default function ProgressPage(): JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const { projectId, role } = useParams<{ projectId: string; role: string }>();

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [sprintId, setSprintId] = useState<string>("");
  const [loadingSprints, setLoadingSprints] = useState<boolean>(true);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;

    async function fetchProjectSprints() {
      setLoadingSprints(true);
      try {
        const data = await api<Sprint[]>(`/sprints?project_id=${projectId}`);
        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];
        setSprints(list);

        setSprintId((prev) => {
          if (prev && list.some((s) => s.id === prev)) return prev;
          const preferred = list.find((s) => s.is_active) ?? list[0] ?? null;
          return preferred?.id ?? "";
        });
      } catch (err) {
        console.error("Error resolving sprint:", err);
        if (!cancelled) {
          setSprints([]);
          setSprintId("");
        }
      } finally {
        if (!cancelled) setLoadingSprints(false);
      }
    }

    void fetchProjectSprints();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const { chartData, sprintNumber, velocity, expectedVelocity, loading } =
    useSprintBurndownData(projectId ?? "", sprintId);

  const containerStyle: CSSProperties = {
    padding: 40,
    minHeight: "100vh",
    background: isDark ? "#0b0f17" : "#f8fafc",
    color: isDark ? "white" : "#111827",
  };

  const mainContentStyle: CSSProperties = {
    display: "flex",
    gap: "24px",
    alignItems: "flex-start",
    width: "100%",
    marginTop: "24px",
  };

  const chartWrapperStyle: CSSProperties = {
    flex: 3,
    padding: 32,
    marginTop: 16,
    marginBottom: 30,
    borderRadius: 16,
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(17,24,39,0.04)",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(17,24,39,0.1)",
  };

  const velocityBlockStyle: CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };

  const velocityCardStyle: CSSProperties = {
    padding: 20,
    marginTop: 16,
    borderRadius: 16,
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(17,24,39,0.04)",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(17,24,39,0.1)",
  };

  const primaryButtonStyle: CSSProperties = {
    padding: "14px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#7c3aed",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  };

  return (
    <SidebarLayout>
      <div style={containerStyle}>
        <h1 style={{ fontSize: "42px", fontWeight: 800, marginBottom: 8 }}>Sprint Progress</h1>
        <p style={{ fontSize: "18px", opacity: 0.85 }}>
          View burndown for the active sprint or any past sprint.
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 20 }}>
          <select
            value={sprintId}
            onChange={(e) => setSprintId(e.target.value)}
            style={{
              minWidth: 260,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #cbd5e1",
              fontSize: 16,
            }}
            disabled={loadingSprints || sprints.length === 0}
          >
            <option value="">Select sprint</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sprint_name || `Sprint ${s.sprint_number}`}
                {s.is_active ? " (Active)" : ""}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              if (projectId && role) navigate(`/projects/${projectId}/${role}/sprint-setup`);
            }}
            style={primaryButtonStyle}
          >
            Manage Sprints
          </button>
        </div>

        <h2 style={{ fontSize: "32px", fontWeight: 700, marginTop: 28 }}>
          {loading || loadingSprints
            ? "Loading..."
            : sprintId
              ? `Sprint ${sprintNumber} Burndown`
              : "No sprint selected"}
        </h2>

        <div style={mainContentStyle}>
          <div style={chartWrapperStyle}>
            {!sprintId ? (
              <p style={{ color: "#7C4DFF" }}>No sprint selected.</p>
            ) : loading ? (
              <p style={{ color: "#7C4DFF" }}>Fetching burndown data...</p>
            ) : chartData.length > 0 ? (
              <BurndownChartUI data={chartData} />
            ) : (
              <p style={{ color: "#7C4DFF" }}>No burndown data found for this sprint.</p>
            )}
          </div>

          <div style={velocityBlockStyle}>
            <div style={velocityCardStyle}>
              <h3 style={{ margin: 0, fontSize: "20px", opacity: 0.8 }}>Current Velocity</h3>
              <p style={{ margin: "10px 0 0 0", fontSize: "42px", fontWeight: 800, color: "#7C4DFF" }}>
                {loading ? "--" : velocity}
                <span style={{ fontSize: "18px", fontWeight: 400, marginLeft: "8px" }}>pts</span>
              </p>
            </div>

            <div style={velocityCardStyle}>
              <h3 style={{ margin: 0, fontSize: "20px", opacity: 0.8 }}>Expected Velocity</h3>
              <p style={{ margin: "10px 0 0 0", fontSize: "42px", fontWeight: 800, color: "#94A3B8" }}>
                {loading ? "--" : expectedVelocity}
                <span style={{ fontSize: "18px", fontWeight: 400, marginLeft: "8px" }}>pts</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}