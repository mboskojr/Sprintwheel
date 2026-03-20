/*import type{ CSSProperties, JSX} from "react";
import { useEffect, useState } from "react";
import { listProjects, type Project } from "../api/projects";


 export default function ProjectDetailsPage(): JSX.Element {
    return (
        <div style={{ color: "white", padding: 40 }}>
            <h1>Project Details Page</h1>
            <p>This is the Project Details page.</p>
            <p> This is where the Project Overview, Team Members, & Project Timeline will live</p>
            <p>Project Overview</p>
            <p> Microcharter, Prototyping, Story Mapping</p>
            <img src="/project_overview.png" alt="Project Overview showing high-level summary of project goals and objectives" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />
            <p>Team Members</p>
            <img src="/team_members_placeholder.png" alt="Team Members showing list of team members with their roles and contact information" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />
            <p>Project Timeline</p>
            <img src="/project_timeline_placeholder.png" alt="Project Timeline showing key milestones and deadlines for the project" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />
        </div>
    );
} */ 

import type { CSSProperties, JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ProjectDetailsPage(): JSX.Element {
  const navigate = useNavigate();
  const { projectId, role } = useParams();

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Project Details Page</h1>
      <p>This is the Project Details page.</p>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Project Overview</h2>
        <img
          src="/project_overview.png"
          alt="Project Overview showing high-level summary of project goals and objectives"
          style={imageStyle}
        />
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Product Backlog</h2>
        <p>
          Plan your product features here! 
        </p>

        <button
          type="button"
          onClick={() => navigate(`/projects/${projectId}/${role}/product-backlog`)}
          style={backlogButtonStyle}
        >
          Open Product Backlog
        </button>
      </section>

    </div>
  );
}

const pageStyle: CSSProperties = {
    color: "white",
    padding: 40,
    minHeight: "100vh",
    background: "#0f172a",
  };

const headingStyle: CSSProperties = {
  marginBottom: 20,
};

const sectionStyle: CSSProperties = {
  marginTop: 30,
  padding: 20,
  borderRadius: 16,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
};

const imageStyle: CSSProperties = {
  maxWidth: "100%",
  height: "auto",
  marginTop: 20,
  borderRadius: 12,
};

const backlogButtonStyle: CSSProperties = {
  marginTop: 12,
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#7c3aed",
  color: "white",
  cursor: "pointer",
  fontWeight: 600,
};
