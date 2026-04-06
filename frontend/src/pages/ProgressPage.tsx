import{ useState, useEffect, type CSSProperties, type JSX } from "react";
import SprintBurndownChart from "../components/SprintBurndownChart"; //FOR STATIC OLD ONE, PLS KEEP FOR NOW
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";


import { useSprintBurndownData } from "../hooks/useBurndown";
import { BurndownChartUI } from "../components/BurndownChartUI";
import { useParams } from "react-router-dom"; 

export default function ProgressPage(): JSX.Element {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const containerStyle: CSSProperties = {
        padding: 40,
        minHeight: "100vh",
        background: isDark ? "#0b0f17" : "#f8fafc",
        color: isDark ? "white" : "#111827",
    };

    const chartWrapperStyle: CSSProperties = {
        padding: 40,
        marginTop: 16,
        borderRadius: 16,
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(17,24,39,0.04)",
        border: isDark
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(17,24,39,0.1)",
    };

    const velocityCardStyle: CSSProperties = {
      padding: 40,
      marginTop: 16,
      borderRadius: 16,
      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(17,24,39,0.04)",
      border: isDark 
        ? "1px solid rgba(255,255,255,0.1)"
        : "1px solid rgba(17,24,39,0.1)",
      //minWidth: "200px",
      //color: "white"
    }

    const { projectId } = useParams<{ projectId: string }>();
    const [sprintId, setSprintId] = useState<string>("");

  useEffect(() => {
    if (!projectId) return;

    fetch(`http://127.0.0.1:8000/sprints?project_id=${projectId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then((sprints: any[]) => {

        const activeSprint = sprints.find(s => s.is_active);

        if (activeSprint) {
          setSprintId(activeSprint.id);
        } else {
          console.warn("No active sprint found for this project.");
        }
      })
      .catch((err) => console.error("Error resolving sprint:", err));
  }, [projectId]);

    const { chartData, sprintNumber, velocity, expectedVelocity, loading } = useSprintBurndownData(sprintId);    


  return (
    <SidebarLayout>
      <div style={containerStyle}>
        <h1>Progress Page</h1>
        <p>This is where the Burndown Chart, Velocity Chart, & Sprint Report will live</p>


        <h1 style={{ fontSize: "32px", fontWeight: 700 }}>
          {loading ? "Loading..." : `Sprint ${sprintNumber} Burndown`}
        </h1>

        <div style={ chartWrapperStyle }>
          {!sprintId ? (
              <p style={{ color: "#111" }}>No active sprint found for this project.</p>
            ) : loading ? (
              <p style={{ color: "#111" }}>Fetching burndown array...</p>
            ) : chartData.length > 0 ? (
              <BurndownChartUI data={chartData} />
            ) : (
              <p style={{ color: "#111" }}>No data found for this sprint.</p>
            )}
        </div>

        <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
          <div style={velocityCardStyle}>
            <h3 style={{ margin: 0, fontSize: "20px", opacity: 0.8}}>
              Current Velocity
            </h3>
            <p 
              style={{ 
                margin: "10px 0 0 0", 
                fontSize: "42px", 
                fontWeight: 800,
                color: "#7C4DFF" 
              }}
            >
              {loading ? "--" : velocity}
              <span 
                style={{
                  fontSize: "18px", 
                  fontWeight: 400, 
                  marginLeft: "8px",
                  //color: "white" 
                }}
              >
                pts
              </span>
            </p>
          </div>

          <div style={velocityCardStyle}>
            <h3 style={{ margin: 0, fontSize: "20px", opacity: 0.8 }}>
              Expected Velocity
            </h3>
            <p 
              style={{ 
                margin: "10px 0 0 0", 
                fontSize: "42px", 
                fontWeight: 800, 
                color: "#94A3B8" 
              }}
            >
              {loading ? "--" : expectedVelocity}
              <span 
                style={{ 
                  fontSize: "18px", 
                  fontWeight: 400, 
                  marginLeft: "8px",
                  //color: "white"
                }}
              >
                pts
              </span>
            </p>
          </div>
        </div>


        <h2>Sprint #BLANK Burndown Chart</h2>
        <div style={chartWrapperStyle}>
          <SprintBurndownChart />
        </div>    

      </div>
    </SidebarLayout>
  );
}