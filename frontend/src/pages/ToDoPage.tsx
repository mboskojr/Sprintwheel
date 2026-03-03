import type { CSSProperties, JSX} from "react";

export default function ToDoPage(): JSX.Element {
    return (
        <div style={{ color: "white", padding: 40 }}>
            <h1>To-Do/Planning</h1>
            <p>This is the To-Do / Planning page.</p>
            <p> This is where the Task Board, Calendar, & Product Backlog will live</p>
            <p> Calendar Feature (Sprint #4)</p>
            <img src="/calendar-placeholder.png" alt="Calendar showing sprint schedule and important dates" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />
            <p>Task Board</p>
            <img src="/task-board-placeholder.png" alt="Task Board showing tasks in different columns based on their status" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />
            <p> Product Backlog</p>
            <img src="/product_backlog_framework.jpeg" alt="Product Backlog showing list of user stories and tasks" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />

        </div>
    );
}
