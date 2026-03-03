import type{ CSSProperties, JSX} from "react";

export default function ProgressPage(): JSX.Element {
    return (
        <div style={{ color: "white", padding: 40 }}>
            <h1>Progress Page</h1>
            <p>This is the Progress page.</p>
            <p> This is where the Burndown Chart, Velocity Chart, & Sprint Report will live</p>
            <img src="/sprint_burndown_chart.png" alt="Sprint Burndown Chart showing task completion over time" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />
        </div>
    );
}
