import type{ CSSProperties, JSX} from "react";

export default function CommunicationPage(): JSX.Element {
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
}
