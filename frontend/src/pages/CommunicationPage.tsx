import type{ CSSProperties, JSX} from "react";

export default function CommunicationPage(): JSX.Element {
    return (
        <div style={{ color: "white", padding: 40 }}>
            <h1>Communication</h1>
            <p>Information Radiator/Kanban Board</p>
            <p> This is where the Information Radiator and Kanban Board will live</p>
            <p> It will function as a message board where it will display availible tasks sourced from the Product Backlog</p>
            <p>It will be a central hub for team communication and task visibility.</p>
            <p> It will also include a section for team announcements, updates, and important information related to the project.</p>
            <img src="/kanban_board.png" alt="Kanban board mockup displaying task cards organized in columns for the Communication Page, showing sprint planning and team task visibility interface" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />
            <p>Like This ^</p>
            <p>Sprint #5</p>
        </div>
    );
}   
