import type { CSSProperties, JSX} from "react";

export default function ToDoPage(): JSX.Element {
    return (
        <div style={{ color: "white", padding: 40 }}>

            <h1>Education</h1>
            <p>Welcome to Scrum.Edu</p>
            <p>Here you can find resources to learn about Scrum, including:</p>
            <ul>
                <li>Scrum Guide</li>
                <li>Scrum Roles</li>
                <li>Scrum Events</li>
                <li>Scrum Artifacts</li>
            </ul>
            <p>Whether you're new to Scrum or looking to deepen your understanding, Scrum.Edu has something for everyone. Explore the resources and start your Scrum journey today!</p>
            <p>Caroline should have these completed by Sprint #5</p>
        </div>
    );
}

