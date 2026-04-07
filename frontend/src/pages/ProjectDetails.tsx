import type { CSSProperties, JSX, ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";
import { API_BASE } from "../api/base";


type Member = {
  user_id: string;
  name: string;
  email: string;
  role: string;
};

type GeneratedBacklogItem = {
  tempId: string;
  title: string;
  description: string;
  points: number;
};

type ProjectFormData = {
  projectName: string;
  scrumMaster: string;
  productOwner: string;
  developer: string;
  sprintGoal: string;
  expectedDeadline: string;
  status: string;
  repoLink: string;
  microcharter: string;
};

type MicrocharterInputs = {
  systemType: string;
  users: string;
  goal: string;
  features: string[];
  outcome: string;
};

const emptyForm: ProjectFormData = {
  projectName: "",
  scrumMaster: "",
  productOwner: "",
  developer: "",
  sprintGoal: "",
  expectedDeadline: "",
  status: "",
  repoLink: "",
  microcharter: "",
};

const emptyMicroInputs: MicrocharterInputs = {
  systemType: "",
  users: "",
  goal: "",
  features: [],
  outcome: "",
};

const featureOptions = [
  "backlog generation",
  "timeline tracking",
  "role assignment",
  "navigation",
  "dashboard",
  "collaboration",
  "workflow automation",
];

const API = API_BASE;

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

function formatDeadline(dateString: string): string {
  if (!dateString) return "—";

  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

export default function ProjectDetailsPage(): JSX.Element {
  const navigate = useNavigate();
  const { projectId, role } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const storageKey = `project-details-${projectId ?? "default"}-${role ?? "default"}`;
  const calendarStorageKey = `project-calendar-deadline-${projectId ?? "default"}`;
  const calendarRouteBase = `/projects/${projectId}/${role}/calendar`;

  const [formData, setFormData] = useState<ProjectFormData>(emptyForm);
  const [submittedData, setSubmittedData] = useState<ProjectFormData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isEditing, setIsEditing] = useState(true);

  const [microInputs, setMicroInputs] = useState<MicrocharterInputs>(emptyMicroInputs);

  const [generatedItems, setGeneratedItems] = useState<GeneratedBacklogItem[]>([]);
  const [addingGeneratedIds, setAddingGeneratedIds] = useState<string[]>([]);
  const [addedGeneratedIds, setAddedGeneratedIds] = useState<string[]>([]);

  const [calendarWindowOpen, setCalendarWindowOpen] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      try {
        const parsedData: ProjectFormData = JSON.parse(savedData);
        setFormData(parsedData);
        setSubmittedData(parsedData);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to parse saved project details:", error);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (!projectId) return;

    fetch(`${API}/projects/${projectId}/members`, {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Failed to fetch project members:", error);
        setMembers([]);
      });
  }, [projectId]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  function handleMicroInputChange(e: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setMicroInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleFeatureToggle(feature: string): void {
    setMicroInputs((prev) => {
      const exists = prev.features.includes(feature);

      return {
        ...prev,
        features: exists
          ? prev.features.filter((f) => f !== feature)
          : [...prev.features, feature],
      };
    });
  }

  function buildMicrocharterFromTemplate(): string {
    const { systemType, users, goal, features, outcome } = microInputs;

    if (!systemType.trim() || !users.trim() || !goal.trim()) {
      return "";
    }

    const featureText =
      features.length > 0 ? features.join(", ") : "core functionality";

    const outcomeText = outcome.trim() || "improve overall user experience";

    return `Build a ${systemType.trim()} for ${users.trim()} that helps them ${goal.trim()}. The system should include ${featureText} to ${outcomeText}.`;
  }

  function handleGenerateMicrocharter(): void {
    const generated = buildMicrocharterFromTemplate();

    if (!generated) {
      alert("Fill in system type, users, and goal first.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      microcharter: generated,
    }));
  }

  function syncDeadlineToCalendar(deadline: string): void {
    localStorage.setItem(
      calendarStorageKey,
      JSON.stringify({
        projectId: projectId ?? "",
        role: role ?? "",
        expectedDeadline: deadline,
        updatedAt: new Date().toISOString(),
      })
    );
  }

  function getCalendarRoute(deadline?: string): string {
    if (!deadline) return calendarRouteBase;
    const params = new URLSearchParams({ expectedDeadline: deadline });
    return `${calendarRouteBase}?${params.toString()}`;
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setSubmittedData(formData);
    localStorage.setItem(storageKey, JSON.stringify(formData));
    syncDeadlineToCalendar(formData.expectedDeadline);
    setIsEditing(false);
  };

  const handleReset = (): void => {
    setFormData(emptyForm);
    setSubmittedData(null);
    setMicroInputs(emptyMicroInputs);
    setGeneratedItems([]);
    setAddingGeneratedIds([]);
    setAddedGeneratedIds([]);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(calendarStorageKey);
    setIsEditing(true);
  };

  const handleEdit = (): void => {
    if (submittedData) {
      setFormData(submittedData);
    }
    setIsEditing(true);
  };

  const handleCancelEdit = (): void => {
    if (submittedData) {
      setFormData(submittedData);
      setIsEditing(false);
    } else {
      setFormData(emptyForm);
    }
  };

  const handleUpdateDeadlineOnly = (): void => {
    const latest = isEditing ? formData.expectedDeadline : submittedData?.expectedDeadline ?? "";
    syncDeadlineToCalendar(latest);
  };

  const handleOpenCalendar = (): void => {
    const latest = isEditing ? formData.expectedDeadline : submittedData?.expectedDeadline ?? "";
    syncDeadlineToCalendar(latest);
    setCalendarWindowOpen(true);
  };

  const getMemberDisplayName = (memberId: string): string => {
    const member = members.find((m) => m.user_id === memberId);
    return member ? member.name || member.email : "—";
  };

  function generateBacklogFromMicrocharter(text: string): GeneratedBacklogItem[] {
    const clean = text.trim();
    if (!clean) return [];

    const sentenceChunks = clean
      .split(/[.!?]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    const keywordMap = [
      {
        test: /navigation|menu|find|browse/i,
        title: "Improve navigation experience",
        description:
          "Create or refine navigation so users can move through the platform more easily.",
        points: 3,
      },
      {
        test: /user flow|workflow|friction|task completion/i,
        title: "Refine user flow",
        description:
          "Identify friction points in the current workflow and simplify task completion steps.",
        points: 3,
      },
      {
        test: /collaboration|team|assignment|role/i,
        title: "Build team assignment workflow",
        description:
          "Support clearer assignment of people, roles, and responsibilities within a project.",
        points: 2,
      },
      {
        test: /backlog|story|task/i,
        title: "Improve backlog organization",
        description:
          "Add or refine backlog structure so tasks can be generated, reviewed, and managed clearly.",
        points: 2,
      },
      {
        test: /visibility|dashboard|overview/i,
        title: "Create project visibility improvements",
        description:
          "Add clearer project overview elements so stakeholders can quickly understand status and goals.",
        points: 2,
      },
      {
        test: /redesign|ui|ux|interface/i,
        title: "Design updated interface",
        description:
          "Create updated UI components that align with the project vision and usability needs.",
        points: 3,
      },
      {
        test: /timeline|milestone|schedule|deadline/i,
        title: "Create deadline tracking",
        description:
          "Add deadline or milestone support to help keep delivery dates and project phases visible.",
        points: 2,
      },
      {
        test: /repo|github|git/i,
        title: "Add repository integration support",
        description:
          "Support linking and displaying the project repository inside project details.",
        points: 1,
      },
      {
        test: /dashboard/i,
        title: "Build dashboard view",
        description:
          "Create a dashboard that gives users quick visibility into project status and work.",
        points: 2,
      },
      {
        test: /automation|automate/i,
        title: "Add workflow automation support",
        description:
          "Introduce automation to reduce repetitive work and improve project flow.",
        points: 2,
      },
    ];

    const generated: GeneratedBacklogItem[] = [];
    let nextId = Date.now();

    for (const sentence of sentenceChunks) {
      let matched = false;

      for (const entry of keywordMap) {
        if (entry.test.test(sentence)) {
          const alreadyExists = generated.some(
            (item) => item.title.toLowerCase() === entry.title.toLowerCase()
          );

          if (!alreadyExists) {
            generated.push({
              tempId: String(nextId++),
              title: entry.title,
              description: entry.description,
              points: entry.points,
            });
          }

          matched = true;
        }
      }

      if (!matched) {
        generated.push({
          tempId: String(nextId++),
          title:
            sentence.length > 55
              ? `${sentence.slice(0, 55).trim()}...`
              : sentence.charAt(0).toUpperCase() + sentence.slice(1),
          description: `Generated from microcharter: ${sentence}`,
          points: 2,
        });
      }
    }

    const defaultFallbacks = [
      {
        title: "Define MVP scope",
        description:
          "Translate the microcharter into a clear first-phase scope for delivery.",
        points: 2,
      },
      {
        title: "Write user stories",
        description:
          "Convert project goals into user stories and actionable backlog tasks.",
        points: 2,
      },
      {
        title: "Prioritize implementation tasks",
        description:
          "Order generated backlog items by importance, dependency, and feasibility.",
        points: 2,
      },
    ];

    for (const fallback of defaultFallbacks) {
      const existsInGenerated = generated.some(
        (item) => item.title.toLowerCase() === fallback.title.toLowerCase()
      );

      if (!existsInGenerated) {
        generated.push({
          tempId: String(nextId++),
          title: fallback.title,
          description: fallback.description,
          points: fallback.points,
        });
      }
    }

    return generated;
  }

  function handleGenerateBacklog(): void {
    const sourceText = (
      isEditing ? formData.microcharter : submittedData?.microcharter ?? ""
    ).trim();

    const generated = generateBacklogFromMicrocharter(sourceText);
    setGeneratedItems(generated);
    setAddedGeneratedIds([]);
  }

  function handleAddGeneratedToBacklog(item: GeneratedBacklogItem): void {
    if (!projectId) return;

    setAddingGeneratedIds((prev) => [...prev, item.tempId]);

    fetch(`${API}/stories/backlog`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({
        project_id: projectId,
        title: item.title,
        description: item.description,
        points: item.points,
        priority: 1,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          console.error("Create backlog story failed:", data);
          throw new Error("Failed to create backlog story");
        }

        return data;
      })
      .then(() => {
        setAddedGeneratedIds((prev) => [...prev, item.tempId]);
      })
      .catch((err) => {
        console.error("Error creating generated backlog item:", err);
      })
      .finally(() => {
        setAddingGeneratedIds((prev) => prev.filter((id) => id !== item.tempId));
      });
  }

  function handleAddAllGeneratedToBacklog(): void {
    generatedItems.forEach((item) => {
      const alreadyAdded = addedGeneratedIds.includes(item.tempId);
      const isAdding = addingGeneratedIds.includes(item.tempId);

      if (!alreadyAdded && !isAdding) {
        handleAddGeneratedToBacklog(item);
      }
    });
  }

  const generatedCountNotAdded = useMemo(() => {
    return generatedItems.filter(
      (item) =>
        !addedGeneratedIds.includes(item.tempId) &&
        !addingGeneratedIds.includes(item.tempId)
    ).length;
  }, [generatedItems, addedGeneratedIds, addingGeneratedIds]);

  const activeDeadline = isEditing
    ? formData.expectedDeadline
    : submittedData?.expectedDeadline ?? "";

  const calendarRoute = getCalendarRoute(activeDeadline);

  const pageStyle: CSSProperties = {
    color: isDark ? "white" : "#111827",
    padding: 40,
    minHeight: "100vh",
    background: isDark ? "#0b0f17" : "#f8fafc",
  };

  const headingStyle: CSSProperties = {
    marginBottom: 20,
    color: isDark ? "white" : "#111827",
  };

  const sectionStyle: CSSProperties = {
    marginTop: 30,
    padding: 24,
    borderRadius: 16,
    background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
    border: isDark
      ? "1px solid rgba(255,255,255,0.1)"
      : "1px solid rgba(17,24,39,0.1)",
    boxShadow: isDark ? "none" : "0 8px 24px rgba(15,23,42,0.06)",
  };

  const sectionTitleStyle: CSSProperties = {
    marginTop: 0,
    marginBottom: 16,
    color: isDark ? "white" : "#111827",
  };

  const formStyle: CSSProperties = {
    display: "grid",
    gap: 16,
  };

  const labelStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontWeight: 600,
    color: isDark ? "#e5e7eb" : "#1f2937",
  };

  const inputStyle: CSSProperties = {
    padding: "12px 14px",
    borderRadius: 10,
    border: isDark
      ? "1px solid rgba(255,255,255,0.14)"
      : "1px solid rgba(17,24,39,0.12)",
    background: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    color: isDark ? "white" : "#111827",
    outline: "none",
    fontSize: 14,
  };

  const textareaStyle: CSSProperties = {
    ...inputStyle,
    minHeight: 100,
    resize: "vertical",
    fontFamily: "inherit",
  };

  const buttonRowStyle: CSSProperties = {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 8,
  };

  const primaryButtonStyle: CSSProperties = {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: "#7c3aed",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  };

  const secondaryButtonStyle: CSSProperties = {
    padding: "10px 16px",
    borderRadius: 10,
    border: isDark
      ? "1px solid rgba(255,255,255,0.14)"
      : "1px solid rgba(17,24,39,0.12)",
    background: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    color: isDark ? "white" : "#111827",
    cursor: "pointer",
    fontWeight: 600,
  };

  const infoGridStyle: CSSProperties = {
    display: "grid",
    gap: 14,
  };

  const infoCardStyle: CSSProperties = {
    padding: 16,
    borderRadius: 12,
    background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    border: isDark
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(17,24,39,0.08)",
  };

  const infoLabelStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6,
    color: isDark ? "#cbd5e1" : "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  };

  const infoValueStyle: CSSProperties = {
    margin: 0,
    color: isDark ? "white" : "#111827",
    whiteSpace: "pre-wrap",
  };

  const repoLinkStyle: CSSProperties = {
    color: "#7c3aed",
    fontWeight: 600,
    textDecoration: "none",
    wordBreak: "break-all",
  };

  const helperTextStyle: CSSProperties = {
    marginTop: 4,
    marginBottom: 0,
    fontSize: 13,
    color: isDark ? "#94a3b8" : "#64748b",
  };

  const generatedListStyle: CSSProperties = {
    display: "grid",
    gap: 14,
  };

  const generatedItemStyle: CSSProperties = {
    padding: 16,
    borderRadius: 12,
    background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    border: isDark
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(17,24,39,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  };

  const pointsBadgeStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: isDark ? "rgba(124,58,237,0.16)" : "#ede9fe",
    color: "#7c3aed",
    marginBottom: 8,
  };

  const featureWrapStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  };

  const modalOverlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
  };

  const modalHeaderStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 12,
    flexWrap: "wrap",
  };

  const modalTitleStyle: CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    color: isDark ? "white" : "#111827",
  };

  const modalSubtitleStyle: CSSProperties = {
    marginTop: 4,
    fontSize: 14,
    color: isDark ? "#94a3b8" : "#64748b",
  };

  const calendarWindowStyle: CSSProperties = {
    width: "95vw",
    maxWidth: "1400px",
    height: "88vh",
    background: isDark ? "#111827" : "#ffffff",
    borderRadius: 16,
    border: isDark
      ? "1px solid rgba(255,255,255,0.10)"
      : "1px solid rgba(17,24,39,0.08)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const calendarIframeStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: 12,
    background: isDark ? "#0b0f17" : "#ffffff",
  };

  return (
    <SidebarLayout>
      <div style={pageStyle}>
        <h1 style={headingStyle}>Project Details Page</h1>
        <p>Enter and manage your Scrum project details below.</p>

        {isEditing && (
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Scrum Project Form</h2>
            <p style={helperTextStyle}>
              Your saved project details will stay here even after refresh.
            </p>

            <form onSubmit={handleSubmit} style={formStyle}>
              <label style={labelStyle}>
                Project Name
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  placeholder="Enter project name"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Scrum Master
                <select
                  name="scrumMaster"
                  value={formData.scrumMaster}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select scrum master</option>
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Product Owner
                <select
                  name="productOwner"
                  value={formData.productOwner}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select product owner</option>
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Developer
                <select
                  name="developer"
                  value={formData.developer}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select developer</option>
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Sprint Goal
                <textarea
                  name="sprintGoal"
                  value={formData.sprintGoal}
                  onChange={handleChange}
                  placeholder="Describe the sprint goal"
                  style={textareaStyle}
                />
              </label>

              <div style={infoCardStyle}>
                <h3 style={sectionTitleStyle}>Microcharter Builder</h3>
                <p style={helperTextStyle}>
                  Fill in the blanks to generate a stronger microcharter for backlog creation.
                </p>

                <div style={formStyle}>
                  <input
                    name="systemType"
                    placeholder="What are you building? (e.g. project management platform)"
                    value={microInputs.systemType}
                    onChange={handleMicroInputChange}
                    style={inputStyle}
                  />

                  <input
                    name="users"
                    placeholder="Who is it for? (e.g. student teams)"
                    value={microInputs.users}
                    onChange={handleMicroInputChange}
                    style={inputStyle}
                  />

                  <input
                    name="goal"
                    placeholder="What problem does it solve?"
                    value={microInputs.goal}
                    onChange={handleMicroInputChange}
                    style={inputStyle}
                  />

                  <input
                    name="outcome"
                    placeholder="What is the desired outcome? (optional)"
                    value={microInputs.outcome}
                    onChange={handleMicroInputChange}
                    style={inputStyle}
                  />

                  <div>
                    <div style={infoLabelStyle}>Key Features</div>
                    <div style={featureWrapStyle}>
                      {featureOptions.map((feature) => {
                        const selected = microInputs.features.includes(feature);

                        return (
                          <button
                            key={feature}
                            type="button"
                            onClick={() => handleFeatureToggle(feature)}
                            style={{
                              ...secondaryButtonStyle,
                              background: selected
                                ? "#7c3aed"
                                : isDark
                                ? "rgba(255,255,255,0.04)"
                                : "#ffffff",
                              color: selected ? "white" : isDark ? "white" : "#111827",
                              border: selected
                                ? "none"
                                : isDark
                                ? "1px solid rgba(255,255,255,0.14)"
                                : "1px solid rgba(17,24,39,0.12)",
                            }}
                          >
                            {feature}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={buttonRowStyle}>
                    <button
                      type="button"
                      onClick={handleGenerateMicrocharter}
                      style={primaryButtonStyle}
                    >
                      Generate Microcharter
                    </button>
                  </div>
                </div>
              </div>

              <label style={labelStyle}>
                Microcharter
                <textarea
                  name="microcharter"
                  value={formData.microcharter}
                  onChange={handleChange}
                  placeholder="Write the project microcharter here"
                  style={{ ...textareaStyle, minHeight: 140 }}
                />
              </label>

              <label style={labelStyle}>
                Expected Deadline
                <input
                  type="date"
                  name="expectedDeadline"
                  value={formData.expectedDeadline}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Project Status
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select status</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>

              <label style={labelStyle}>
                GitHub Repository Link
                <input
                  type="text"
                  name="repoLink"
                  value={formData.repoLink}
                  onChange={handleChange}
                  placeholder="https://github.com/your-username/your-repo"
                  style={inputStyle}
                />
              </label>

              <div style={buttonRowStyle}>
                <button type="submit" style={primaryButtonStyle}>
                  Save Project Details
                </button>

                <button
                  type="button"
                  onClick={submittedData ? handleCancelEdit : handleReset}
                  style={secondaryButtonStyle}
                >
                  {submittedData ? "Cancel" : "Reset"}
                </button>

                <button
                  type="button"
                  onClick={handleGenerateBacklog}
                  style={secondaryButtonStyle}
                >
                  Generate Backlog
                </button>

                <button
                  type="button"
                  onClick={handleUpdateDeadlineOnly}
                  style={secondaryButtonStyle}
                >
                  Update Calendar Deadline
                </button>

                <button
                  type="button"
                  onClick={handleOpenCalendar}
                  style={secondaryButtonStyle}
                >
                  Open Calendar
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/projects/${projectId}/${role}/product-backlog`)}
                  style={secondaryButtonStyle}
                >
                  Open Product Backlog
                </button>
              </div>
            </form>
          </section>
        )}

        {submittedData && (
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Project Details</h2>

            <div style={infoGridStyle}>
              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Project Name</div>
                <p style={infoValueStyle}>{submittedData.projectName || "—"}</p>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Scrum Master</div>
                <p style={infoValueStyle}>
                  {submittedData.scrumMaster
                    ? getMemberDisplayName(submittedData.scrumMaster)
                    : "—"}
                </p>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Product Owner</div>
                <p style={infoValueStyle}>
                  {submittedData.productOwner
                    ? getMemberDisplayName(submittedData.productOwner)
                    : "—"}
                </p>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Developer</div>
                <p style={infoValueStyle}>
                  {submittedData.developer
                    ? getMemberDisplayName(submittedData.developer)
                    : "—"}
                </p>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Sprint Goal</div>
                <p style={infoValueStyle}>{submittedData.sprintGoal || "—"}</p>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Microcharter</div>
                <p style={infoValueStyle}>{submittedData.microcharter || "—"}</p>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Expected Deadline</div>
                <p style={infoValueStyle}>{formatDeadline(submittedData.expectedDeadline)}</p>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Project Status</div>
                <p style={infoValueStyle}>{submittedData.status || "—"}</p>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Repository</div>
                {submittedData.repoLink ? (
                  <a
                    href={submittedData.repoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={repoLinkStyle}
                  >
                    Open Repository
                  </a>
                ) : (
                  <p style={infoValueStyle}>—</p>
                )}
              </div>
            </div>

            <div style={buttonRowStyle}>
              <button type="button" onClick={handleEdit} style={primaryButtonStyle}>
                Edit Project
              </button>

              <button
                type="button"
                onClick={handleGenerateBacklog}
                style={secondaryButtonStyle}
              >
                Generate Backlog
              </button>

              <button
                type="button"
                onClick={handleUpdateDeadlineOnly}
                style={secondaryButtonStyle}
              >
                Update Calendar Deadline
              </button>

              <button
                type="button"
                onClick={handleOpenCalendar}
                style={secondaryButtonStyle}
              >
                Open Calendar
              </button>

              <button
                type="button"
                onClick={() => navigate(`/projects/${projectId}/${role}/product-backlog`)}
                style={secondaryButtonStyle}
              >
                Open Product Backlog
              </button>

              <button type="button" onClick={handleReset} style={secondaryButtonStyle}>
                Clear Project
              </button>
            </div>
          </section>
        )}

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Expected Deadline</h2>
          <p style={helperTextStyle}>
            This replaces the old timeline notes field. Save or update the deadline anytime,
            then open the calendar to use the latest date.
          </p>

          <div style={infoCardStyle}>
            <div style={infoLabelStyle}>Current Deadline</div>
            <p style={infoValueStyle}>{formatDeadline(activeDeadline)}</p>

            <div style={buttonRowStyle}>
              <button
                type="button"
                onClick={handleUpdateDeadlineOnly}
                style={primaryButtonStyle}
              >
                Sync Deadline to Calendar
              </button>

              <button
                type="button"
                onClick={handleOpenCalendar}
                style={secondaryButtonStyle}
              >
                Open Calendar
              </button>

              <button
                type="button"
                onClick={() => navigate(calendarRoute)}
                style={secondaryButtonStyle}
              >
                Go to Full Calendar Page
              </button>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Generated Backlog</h2>
          <p style={helperTextStyle}>
            Starter backlog items generated from the microcharter.
          </p>

          {generatedItems.length > 0 && (
            <div style={buttonRowStyle}>
              <button
                type="button"
                onClick={handleAddAllGeneratedToBacklog}
                style={secondaryButtonStyle}
              >
                Add All to Backlog ({generatedCountNotAdded})
              </button>
            </div>
          )}

          {generatedItems.length === 0 ? (
            <div style={infoCardStyle}>
              <div style={infoLabelStyle}>No generated items</div>
              <p style={infoValueStyle}>
                Add a microcharter and click Generate Backlog.
              </p>
            </div>
          ) : (
            <div style={generatedListStyle}>
              {generatedItems.map((item) => {
                const isAdding = addingGeneratedIds.includes(item.tempId);
                const isAdded = addedGeneratedIds.includes(item.tempId);

                return (
                  <div key={item.tempId} style={generatedItemStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={pointsBadgeStyle}>{item.points} pts</div>
                      <div style={infoLabelStyle}>{item.title}</div>
                      <p style={infoValueStyle}>{item.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddGeneratedToBacklog(item)}
                      style={isAdded || isAdding ? secondaryButtonStyle : primaryButtonStyle}
                      disabled={isAdded || isAdding}
                    >
                      {isAdding ? "Adding..." : isAdded ? "Added" : "Add to Backlog"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {calendarWindowOpen && (
          <div
            style={modalOverlayStyle}
            onClick={() => setCalendarWindowOpen(false)}
          >
            <div
              style={calendarWindowStyle}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={modalHeaderStyle}>
                <div>
                  <div style={modalTitleStyle}>Project Calendar</div>
                  <div style={modalSubtitleStyle}>
                    The current expected deadline is passed through localStorage and the URL.
                  </div>
                </div>

                <div style={buttonRowStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      window.open(calendarRoute, "_blank", "noopener,noreferrer")
                    }
                    style={secondaryButtonStyle}
                  >
                    Open in New Tab
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalendarWindowOpen(false)}
                    style={secondaryButtonStyle}
                  >
                    Close
                  </button>
                </div>
              </div>

              <iframe
                title="Project Calendar"
                src={calendarRoute}
                style={calendarIframeStyle}
              />
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}