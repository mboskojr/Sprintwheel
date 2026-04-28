import type { CSSProperties, JSX, ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";
import { api } from "../api/client";

type Story = {
  id: string;
  project_id: string;
  sprint_id: string | null;
  title: string;
  description: string | null;
  points: number | null;
  isDone: boolean;
  priority: number;
  date_completed: string | null;
};

type GeneratedBacklogItem = {
  tempId: string;
  title: string;
  description: string;
  points: number;
};

type BacklogPreviewItem = {
  id: string;
  title: string;
  description: string | null;
  points: number | null;
  isDone: boolean;
};

type ProjectFormData = {
  projectName: string;
  sprintGoal: string;
  status: string;
  repoLink: string;
  vercelLink: string;
  microcharter: string;
  projectSummary: string;
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
  sprintGoal: "",
  status: "",
  repoLink: "",
  vercelLink: "",
  microcharter: "",
  projectSummary:
    "This is where you can manage the project focus, generate backlog ideas, and save deployment links like GitHub and Vercel.",
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
  "navigation",
  "dashboard",
  "collaboration",
  "workflow automation",
];

const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21, 34] as const;

function getSafeExternalUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizePoints(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 1;
  return FIBONACCI_POINTS.includes(value as (typeof FIBONACCI_POINTS)[number])
    ? value
    : 1;
}

function isPlaceholderStory(story: Story): boolean {
  const title = story.title.trim().toLowerCase();
  const description = (story.description ?? "").trim().toLowerCase();

  return (
    title === "main board" ||
    title === "main backlog" ||
    title === "product backlog" ||
    title === "main board product" ||
    (title === "main board product" && !description) ||
    (title === "main board" && !description)
  );
}

function cleanStories(data: Story[]): BacklogPreviewItem[] {
  return data
    .filter((story) => !isPlaceholderStory(story))
    .map((story) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      points: normalizePoints(story.points),
      isDone: story.isDone,
    }));
}

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
      test: /collaboration|team/i,
      title: "Strengthen collaboration workflow",
      description:
        "Support better collaboration and coordination across project work.",
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

export default function ProjectDetailsPage(): JSX.Element {
  const navigate = useNavigate();
  const { projectId, role } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const storageKey = useMemo(
    () => `project-details-${projectId ?? "default"}`,
    [projectId]
  );

  const backlogRoute = useMemo(() => {
    if (!projectId) return "/projects";

    return role
      ? `/projects/${projectId}/${role}/product-backlog`
      : `/projects/${projectId}/product-backlog`;
  }, [projectId, role]);

  const [formData, setFormData] = useState<ProjectFormData>(emptyForm);
  const [submittedData, setSubmittedData] = useState<ProjectFormData | null>(null);
  const [isEditing, setIsEditing] = useState(true);

  const [microInputs, setMicroInputs] =
    useState<MicrocharterInputs>(emptyMicroInputs);

  const [generatedItems, setGeneratedItems] = useState<GeneratedBacklogItem[]>([]);
  const [addingGeneratedIds, setAddingGeneratedIds] = useState<Set<string>>(
    () => new Set()
  );
  const [addedGeneratedIds, setAddedGeneratedIds] = useState<Set<string>>(
    () => new Set()
  );

  const [backlogPreviewItems, setBacklogPreviewItems] = useState<
    BacklogPreviewItem[]
  >([]);
  const [backlogPreviewLoading, setBacklogPreviewLoading] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);

    if (!savedData) return;

    try {
      const parsedData: ProjectFormData = JSON.parse(savedData);
      setFormData(parsedData);
      setSubmittedData(parsedData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to parse saved project details:", error);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    setBacklogPreviewLoading(true);

    api<Story[]>(`/stories/backlog?project_id=${projectId}`)
      .then((data) => {
        if (!isMounted) return;
        const cleaned = cleanStories(Array.isArray(data) ? data : []);
        const topPriority = cleaned.filter((story) => !story.isDone).slice(0, 4);
        setBacklogPreviewItems(topPriority);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("Failed to fetch backlog preview:", error);
        setBacklogPreviewItems([]);
      })
      .finally(() => {
        if (isMounted) {
          setBacklogPreviewLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, addedGeneratedIds]);

  const displayProjectName = useMemo(
    () => submittedData?.projectName || formData.projectName || "Project Details",
    [submittedData, formData.projectName]
  );

  const savedRepoLink = useMemo(
    () => getSafeExternalUrl(formData.repoLink),
    [formData.repoLink]
  );

  const savedVercelLink = useMemo(
    () => getSafeExternalUrl(formData.vercelLink),
    [formData.vercelLink]
  );

  const githubCreateUrl = "https://github.com/new";
  const vercelCreateUrl = "https://vercel.com/new";

  const generatedPreviewItems = useMemo(
    () => generatedItems.slice(0, 4),
    [generatedItems]
  );

  const generatedCountNotAdded = useMemo(() => {
    return generatedItems.filter(
      (item) =>
        !addedGeneratedIds.has(item.tempId) &&
        !addingGeneratedIds.has(item.tempId)
    ).length;
  }, [generatedItems, addedGeneratedIds, addingGeneratedIds]);

  const backlogBarWidth = useMemo(() => {
    return `${Math.min(
      Math.max(backlogPreviewItems.length, generatedItems.length) * 18,
      88
    )}%`;
  }, [backlogPreviewItems.length, generatedItems.length]);

  const saveForm = useCallback(
    (nextData: ProjectFormData): void => {
      setFormData(nextData);
      setSubmittedData(nextData);
      localStorage.setItem(storageKey, JSON.stringify(nextData));
    },
    [storageKey]
  );

  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ): void => {
      const { name, value } = e.target;

      setFormData((prev) => {
        if (prev[name as keyof ProjectFormData] === value) return prev;
        return {
          ...prev,
          [name]: value,
        };
      });
    },
    []
  );

  const handleMicroInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const { name, value } = e.target;

      setMicroInputs((prev) => {
        if (prev[name as keyof MicrocharterInputs] === value) return prev;
        return {
          ...prev,
          [name]: value,
        };
      });
    },
    []
  );

  const handleFeatureToggle = useCallback((feature: string): void => {
    setMicroInputs((prev) => {
      const exists = prev.features.includes(feature);

      return {
        ...prev,
        features: exists
          ? prev.features.filter((f) => f !== feature)
          : [...prev.features, feature],
      };
    });
  }, []);

  const buildMicrocharterFromTemplate = useCallback((): string => {
    const { systemType, users, goal, features, outcome } = microInputs;

    if (!systemType.trim() || !users.trim() || !goal.trim()) {
      return "";
    }

    const featureText =
      features.length > 0 ? features.join(", ") : "core functionality";

    const outcomeText = outcome.trim() || "improve overall user experience";

    return `Build a ${systemType.trim()} for ${users.trim()} that helps them ${goal.trim()}. The system should include ${featureText} to ${outcomeText}.`;
  }, [microInputs]);

  const handleGenerateMicrocharter = useCallback((): void => {
    const generated = buildMicrocharterFromTemplate();

    if (!generated) {
      alert("Fill in system type, users, and goal first.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      microcharter: generated,
    }));
  }, [buildMicrocharterFromTemplate]);

  const handleSubmit = useCallback(
    (e?: FormEvent<HTMLFormElement>): void => {
      e?.preventDefault();
      saveForm(formData);
      setIsEditing(false);
    },
    [formData, saveForm]
  );

  const handleSaveMicrocharter = useCallback((): void => {
    saveForm(formData);
  }, [formData, saveForm]);

  const handleReset = useCallback((): void => {
    setFormData(emptyForm);
    setSubmittedData(null);
    setMicroInputs(emptyMicroInputs);
    setGeneratedItems([]);
    setAddingGeneratedIds(new Set());
    setAddedGeneratedIds(new Set());
    localStorage.removeItem(storageKey);
    setIsEditing(true);
  }, [storageKey]);

  const handleEdit = useCallback((): void => {
    if (submittedData) {
      setFormData(submittedData);
    }
    setIsEditing(true);
  }, [submittedData]);

  const handleCancelEdit = useCallback((): void => {
    if (submittedData) {
      setFormData(submittedData);
      setIsEditing(false);
    } else {
      setFormData(emptyForm);
    }
  }, [submittedData]);

  const handleGenerateBacklog = useCallback((): void => {
    const sourceText = formData.microcharter.trim();

    if (!sourceText) {
      alert("Add a microcharter first.");
      return;
    }

    saveForm(formData);
    const generated = generateBacklogFromMicrocharter(sourceText);
    setGeneratedItems(generated);
    setAddedGeneratedIds(new Set());
  }, [formData, saveForm]);

  const handleAddGeneratedToBacklog = useCallback(
    async (item: GeneratedBacklogItem): Promise<void> => {
      if (!projectId) {
        alert("Project ID is missing.");
        return;
      }

      setAddingGeneratedIds((prev) => {
        const next = new Set(prev);
        next.add(item.tempId);
        return next;
      });

      try {
        await api(`/stories/backlog`, {
          method: "POST",
          body: JSON.stringify({
            project_id: projectId,
            title: item.title,
            description: item.description,
            points: item.points,
            priority: 1,
          }),
        });

        setAddedGeneratedIds((prev) => {
          const next = new Set(prev);
          next.add(item.tempId);
          return next;
        });
      } catch (err) {
        console.error("Error creating generated backlog item:", err);
        alert("Could not add this item to the backlog.");
      } finally {
        setAddingGeneratedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.tempId);
          return next;
        });
      }
    },
    [projectId]
  );

  const handleAddAllGeneratedToBacklog = useCallback((): void => {
    generatedItems.forEach((item) => {
      const alreadyAdded = addedGeneratedIds.has(item.tempId);
      const isAdding = addingGeneratedIds.has(item.tempId);

      if (!alreadyAdded && !isAdding) {
        void handleAddGeneratedToBacklog(item);
      }
    });
  }, [generatedItems, addedGeneratedIds, addingGeneratedIds, handleAddGeneratedToBacklog]);

  const pageStyle: CSSProperties = {
    color: isDark ? "white" : "#111827",
    padding: 36,
    minHeight: "100vh",
    textAlign: "left",
    background: isDark
      ? "radial-gradient(circle at top left, rgba(124,58,237,0.20), transparent 24%), radial-gradient(circle at top right, rgba(59,130,246,0.16), transparent 24%), linear-gradient(180deg, #0b0f17 0%, #111827 100%)"
      : "#f8fafc",
  };

  const shellStyle: CSSProperties = {
    maxWidth: 1120,
    margin: "0 auto",
    display: "grid",
    gap: 22,
  };

  const cardStyle: CSSProperties = {
    padding: 22,
    borderRadius: 22,
    minHeight: 0,
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    background: isDark ? "rgba(255,255,255,0.10)" : "#ffffff",
    border: isDark
      ? "1px solid rgba(255,255,255,0.16)"
      : "1px solid rgba(17,24,39,0.08)",
    boxShadow: isDark
      ? "0 10px 30px rgba(0,0,0,0.22)"
      : "0 10px 30px rgba(15,23,42,0.08)",
  };

  const pillCardStyle: CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
    border: isDark
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(17,24,39,0.08)",
    borderRadius: 24,
    padding: "28px 30px",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: isDark
      ? "0 14px 40px rgba(0,0,0,0.22)"
      : "0 14px 40px rgba(15,23,42,0.08)",
  };

  const sectionTitleStyle: CSSProperties = {
    margin: 0,
    marginBottom: 14,
    color: isDark ? "white" : "#111827",
    fontSize: 26,
    fontWeight: 800,
  };

  const eyebrowStyle: CSSProperties = {
    margin: 0,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#c4b5fd",
  };

  const blueTitleStyle: CSSProperties = {
    margin: 0,
    marginBottom: 12,
    fontSize: 36,
    fontWeight: 800,
    lineHeight: 1.1,
    color: isDark ? "white" : "#111827",
  };

  const summaryTextStyle: CSSProperties = {
    margin: "6px 0",
    color: isDark ? "rgba(255,255,255,0.82)" : "#4b5563",
    maxWidth: 820,
    lineHeight: 1.6,
    fontSize: 16,
  };

  const helperTextStyle: CSSProperties = {
    marginTop: 4,
    marginBottom: 0,
    fontSize: 13,
    color: isDark ? "rgba(255,255,255,0.72)" : "#64748b",
  };

  const labelStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontWeight: 700,
    color: isDark ? "#e5e7eb" : "#1f2937",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    outline: "none",
    background: isDark ? "rgba(255,255,255,0.12)" : "#f3f4f6",
    border: isDark
      ? "1px solid rgba(255,255,255,0.16)"
      : "1px solid rgba(17,24,39,0.08)",
    color: isDark ? "rgba(255,255,255,0.88)" : "#111827",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    fontSize: 14,
    boxSizing: "border-box",
  };

  const selectStyle: CSSProperties = {
  ...inputStyle,
  background: isDark ? "rgba(17,24,39,0.92)" : "#1f2937",
  color: "white",
  border: isDark
    ? "1px solid rgba(255,255,255,0.18)"
    : "1px solid rgba(17,24,39,0.08)",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
};

  const textareaStyle: CSSProperties = {
    ...inputStyle,
    minHeight: 120,
    resize: "vertical",
    fontFamily: "inherit",
  };

  const buttonRowStyle: CSSProperties = {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 14,
  };

  const primaryButtonStyle: CSSProperties = {
    padding: "10px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 8px 20px rgba(37,99,235,0.28)",
  };

  const secondaryButtonStyle: CSSProperties = {
    padding: "10px 16px",
    borderRadius: 12,
    background: isDark ? "rgba(255,255,255,0.14)" : "#ffffff",
    border: isDark
      ? "1px solid rgba(255,255,255,0.16)"
      : "1px solid rgba(17,24,39,0.08)",
    color: isDark ? "white" : "#111827",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    cursor: "pointer",
    fontWeight: 700,
  };

  const splitGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 22,
  };

  const backlogBarTrackStyle: CSSProperties = {
    width: "100%",
    height: 54,
    borderRadius: 16,
    border: isDark
      ? "1px solid rgba(255,255,255,0.16)"
      : "1px solid rgba(17,24,39,0.08)",
    background: isDark ? "rgba(255,255,255,0.08)" : "#ffffff",
    padding: 8,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    marginTop: 16,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  };

  const backlogBarFillStyle: CSSProperties = {
    width: backlogBarWidth,
    height: "100%",
    borderRadius: 12,
    background:
      "linear-gradient(90deg, rgba(147,197,253,0.95), rgba(96,165,250,0.95))",
  };

  const previewItemStyle: CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.12)" : "#ffffff",
    border: isDark
      ? "1px solid rgba(255,255,255,0.16)"
      : "1px solid rgba(17,24,39,0.08)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    padding: 14,
    borderRadius: 16,
    color: isDark ? "white" : "#111827",
    boxShadow: isDark
      ? "0 6px 20px rgba(0,0,0,0.16)"
      : "0 6px 20px rgba(15,23,42,0.06)",
  };

  const linkStyle: CSSProperties = {
    color: "#2563eb",
    fontWeight: 700,
    textDecoration: "none",
    wordBreak: "break-all",
  };

  const miniCardStyle: CSSProperties = {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    background: isDark ? "rgba(255,255,255,0.08)" : "#f9fafb",
    border: isDark
      ? "1px solid rgba(255,255,255,0.14)"
      : "1px solid rgba(17,24,39,0.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  };

  const statsPillStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: 999,
    background: isDark ? "rgba(37,99,235,0.18)" : "#dbeafe",
    color: isDark ? "#93c5fd" : "#2563eb",
    fontWeight: 800,
    fontSize: 13,
  };

  return (
    <SidebarLayout>
      <div style={pageStyle}>
        <div style={shellStyle}>
          <section style={pillCardStyle}>
            <div style={eyebrowStyle}>Project Management</div>
            <h1 style={blueTitleStyle}>{displayProjectName}</h1>

            {isEditing ? (
              <div style={{ display: "grid", gap: 16, marginTop: 18 }}>
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
                  Project Summary
                  <textarea
                    name="projectSummary"
                    value={formData.projectSummary}
                    onChange={handleChange}
                    style={{
                      ...textareaStyle,
                      minHeight: 150,
                      fontSize: 18,
                      lineHeight: 1.55,
                    }}
                  />
                </label>

                <div style={splitGridStyle}>
                  <label style={labelStyle}>
                    Project Status
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      style={selectStyle}
                    >
                      <option
                        value=""
                        style={{ backgroundColor: "#111827", color: "white" }}
                      >
                        Select status
                      </option>

                      <option
                        value="Not Started"
                        style={{ backgroundColor: "#111827", color: "white" }}
                      >
                        Not Started
                      </option>

                      <option
                        value="In Progress"
                        style={{ backgroundColor: "#111827", color: "white" }}
                      >
                        In Progress
                      </option>

                      <option
                        value="Blocked"
                        style={{ backgroundColor: "#111827", color: "white" }}
                      >
                        Blocked
                      </option>

                      <option
                        value="Completed"
                        style={{ backgroundColor: "#111827", color: "white" }}
                      >
                        Completed
                      </option>
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
                </div>

                <div style={buttonRowStyle}>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    style={primaryButtonStyle}
                  >
                    Save Project Details
                  </button>

                  <button
                    type="button"
                    onClick={submittedData ? handleCancelEdit : handleReset}
                    style={secondaryButtonStyle}
                  >
                    {submittedData ? "Cancel" : "Reset"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={summaryTextStyle}>
                  {submittedData?.projectSummary || emptyForm.projectSummary}
                </p>

                <div style={{ ...buttonRowStyle, marginTop: 18 }}>
                  <span style={statsPillStyle}>
                    {submittedData?.status || "No status"}
                  </span>

                  {submittedData?.sprintGoal && (
                    <span style={statsPillStyle}>
                      Sprint Goal Set
                    </span>
                  )}
                </div>

                <div style={buttonRowStyle}>
                  <button
                    type="button"
                    onClick={handleEdit}
                    style={primaryButtonStyle}
                  >
                    Edit Project
                  </button>
                </div>
              </>
            )}
          </section>

          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <h2 style={sectionTitleStyle}>Project Backlog</h2>
            </div>

            <div style={backlogBarTrackStyle}>
              <div style={backlogBarFillStyle} />
            </div>

            <div style={buttonRowStyle}>
              <button
                type="button"
                onClick={handleGenerateBacklog}
                style={primaryButtonStyle}
              >
                Generate Backlog
              </button>

              {generatedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddAllGeneratedToBacklog}
                  style={secondaryButtonStyle}
                >
                  Add All to Backlog ({generatedCountNotAdded})
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate(backlogRoute)}
                style={secondaryButtonStyle}
              >
                Open Product Backlog
              </button>
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              <div style={eyebrowStyle}>Backlog Preview</div>

              {backlogPreviewLoading ? (
                <div style={previewItemStyle}>Loading backlog preview...</div>
              ) : backlogPreviewItems.length > 0 ? (
                backlogPreviewItems.map((item) => (
                  <div key={item.id} style={previewItemStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{item.title}</div>
                      <div style={{ opacity: 0.7, whiteSpace: "nowrap" }}>
                        {item.points} pts
                      </div>
                    </div>

                    <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                      {item.description || "No description"}
                    </div>

                    {item.isDone && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#22c55e",
                          marginTop: 4,
                        }}
                      >
                        ✓ Completed
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={previewItemStyle}>No existing backlog items yet.</div>
              )}
            </div>

            {generatedItems.length > 0 && (
              <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
                <div style={eyebrowStyle}>Generated Suggestions</div>

                {generatedPreviewItems.map((item) => {
                  const isAdding = addingGeneratedIds.has(item.tempId);
                  const isAdded = addedGeneratedIds.has(item.tempId);

                  return (
                    <div key={item.tempId} style={previewItemStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 14,
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, marginBottom: 6 }}>
                            {item.title}
                          </div>
                          <div
                            style={{
                              color: isDark
                                ? "rgba(255,255,255,0.75)"
                                : "#4b5563",
                              fontSize: 14,
                            }}
                          >
                            {item.description}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleAddGeneratedToBacklog(item)}
                          style={
                            isAdded || isAdding
                              ? secondaryButtonStyle
                              : primaryButtonStyle
                          }
                          disabled={isAdded || isAdding}
                        >
                          {isAdding
                            ? "Adding..."
                            : isAdded
                            ? "Added"
                            : `Add (${item.points} pts)`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Project Microcharter</h2>
            <p style={helperTextStyle}>
              Build the microcharter here, save it, then turn it into backlog items.
            </p>

            <div style={miniCardStyle}>
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 10,
                  color: isDark ? "white" : "#111827",
                }}
              >
                Microcharter Builder
              </h3>

              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle}>
                  What are you building?
                  <input
                    name="systemType"
                    value={microInputs.systemType}
                    onChange={handleMicroInputChange}
                    placeholder="e.g. project management platform"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Who is it for?
                  <input
                    name="users"
                    value={microInputs.users}
                    onChange={handleMicroInputChange}
                    placeholder="e.g. student teams"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  What problem does it solve?
                  <input
                    name="goal"
                    value={microInputs.goal}
                    onChange={handleMicroInputChange}
                    placeholder="Describe the main problem"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  What is the desired outcome?
                  <input
                    name="outcome"
                    value={microInputs.outcome}
                    onChange={handleMicroInputChange}
                    placeholder="optional"
                    style={inputStyle}
                  />
                </label>

                <div>
                  <div style={{ ...eyebrowStyle, marginBottom: 8 }}>
                    Key Features
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
                              ? "#2563eb"
                              : isDark
                              ? "rgba(255,255,255,0.04)"
                              : "#ffffff",
                            color: selected
                              ? "white"
                              : isDark
                              ? "white"
                              : "#111827",
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

            <div style={miniCardStyle}>
              <label style={labelStyle}>
                Microcharter
                <textarea
                  name="microcharter"
                  value={formData.microcharter}
                  onChange={handleChange}
                  placeholder="Write the project microcharter here"
                  style={{ ...textareaStyle, minHeight: 150 }}
                />
              </label>

              <div style={buttonRowStyle}>
                <button
                  type="button"
                  onClick={handleSaveMicrocharter}
                  style={primaryButtonStyle}
                >
                  Save Microcharter
                </button>

                <button
                  type="button"
                  onClick={handleGenerateBacklog}
                  style={secondaryButtonStyle}
                >
                  Save + Generate Backlog
                </button>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Create Git Repo</h2>

            <p style={helperTextStyle}>
              Paste the repo link you want saved to this project, or open GitHub to create one first.
            </p>

            <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
              <input
                type="text"
                name="repoLink"
                value={formData.repoLink}
                onChange={handleChange}
                placeholder="https://github.com/your-username/your-repo"
                style={inputStyle}
              />

              <div style={buttonRowStyle}>
                <button
                  type="button"
                  onClick={() => saveForm(formData)}
                  style={primaryButtonStyle}
                >
                  Save Repo Link
                </button>

                <a
                  href={githubCreateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...secondaryButtonStyle,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Create Repo on GitHub
                </a>

                {savedRepoLink && (
                  <a
                    href={savedRepoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...secondaryButtonStyle,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    Open Saved Repo
                  </a>
                )}
              </div>

              {savedRepoLink && (
                <div style={previewItemStyle}>
                  <span style={{ marginRight: 8 }}>↳</span>
                  <a
                    href={savedRepoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                  >
                    {savedRepoLink}
                  </a>
                </div>
              )}
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Create Vercel App</h2>

            <p style={helperTextStyle}>
              Paste the deployed app URL you want saved here, or open Vercel to create the project first.
            </p>

            <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
              <input
                type="text"
                name="vercelLink"
                value={formData.vercelLink}
                onChange={handleChange}
                placeholder="https://your-project.vercel.app"
                style={inputStyle}
              />

              <div style={buttonRowStyle}>
                <button
                  type="button"
                  onClick={() => saveForm(formData)}
                  style={primaryButtonStyle}
                >
                  Save Vercel Link
                </button>

                <a
                  href={vercelCreateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...secondaryButtonStyle,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Create App on Vercel
                </a>

                {savedVercelLink && (
                  <a
                    href={savedVercelLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...secondaryButtonStyle,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    Open Saved App
                  </a>
                )}
              </div>

              {savedVercelLink && (
                <div style={previewItemStyle}>
                  <span style={{ marginRight: 8 }}>↳</span>
                  <a
                    href={savedVercelLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                  >
                    {savedVercelLink}
                  </a>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </SidebarLayout>
  );
}