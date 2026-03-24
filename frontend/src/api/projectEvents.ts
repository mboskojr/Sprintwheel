import { api } from "./client";

export type EventType =
  | "daily_scrum"
  | "sprint_planning"
  | "review"
  | "retrospective"
  | "refinement"
  | "deadline"
  | "milestone"
  | "custom";

export type ProjectEvent = {
  id: string;
  project_id: string;
  created_by_user_id: string;
  title: string;
  type: EventType;
  start_at: string;
  end_at: string;
  description?: string | null;
  location?: string | null;
  timezone?: string | null;
  rrule?: string | null;
  is_cancelled: boolean;
};

export type ProjectEventCreate = {
  title: string;
  type?: EventType;
  start_at: string;
  end_at: string;
  description?: string | null;
  location?: string | null;
  timezone?: string | null;
  rrule?: string | null;
};

export type ProjectEventUpdate = {
  title?: string;
  type?: EventType;
  start_at?: string;
  end_at?: string;
  description?: string | null;
  location?: string | null;
  timezone?: string | null;
  rrule?: string | null;
  is_cancelled?: boolean;
};

function toISO(date: string | Date): string {
  if (typeof date === "string") return new Date(date).toISOString();
  return date.toISOString();
}

export async function listProjectEvents(
  projectId: string,
  start: string | Date,
  end: string | Date,
  include_cancelled = false
): Promise<ProjectEvent[]> {
  const params = new URLSearchParams({
    start: toISO(start),
    end: toISO(end),
    include_cancelled: String(include_cancelled),
  });

  return api<ProjectEvent[]>(`/projects/${projectId}/events?${params.toString()}`);
}

export async function createProjectEvent(
  projectId: string,
  payload: ProjectEventCreate
): Promise<ProjectEvent> {
  return api<ProjectEvent>(`/projects/${projectId}/events`, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      start_at: toISO(payload.start_at),
      end_at: toISO(payload.end_at),
    }),
  });
}

export async function updateProjectEvent(
  projectId: string,
  eventId: string,
  payload: ProjectEventUpdate
): Promise<ProjectEvent> {
  return api<ProjectEvent>(`/projects/${projectId}/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...payload,
      ...(payload.start_at && { start_at: toISO(payload.start_at) }),
      ...(payload.end_at && { end_at: toISO(payload.end_at) }),
    }),
  });
}

export async function deleteProjectEvent(
  projectId: string,
  eventId: string
): Promise<ProjectEvent> {
  return api<ProjectEvent>(`/projects/${projectId}/events/${eventId}`, {
    method: "DELETE",
  });
}