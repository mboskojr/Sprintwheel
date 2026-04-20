import { api } from "./client";

export type ProjectRole =
  | "Product Owner"
  | "Scrum Facilitator"
  | "Developer";

export type Project = {
  id: string;
  name: string;
  join_code: string;
  sprint_duration: number;
  project_velocity: number;
  role: ProjectRole;
  active_member_count: number;
};

export type ProjectCreate = {
  name: string;
  sprint_duration: number;
};

export type ProjectUpdate = {
  name: string;
  sprint_duration: number;
};

export type ProjectMembership = {
  project_id: string;
  role: ProjectRole;
};

export type JoinProjectInput = {
  role: ProjectRole;
};

export type JoinProjectByCodeInput = {
  join_code: string;
  role: ProjectRole;
};

export type UpdateRoleInput = {
  role: ProjectRole;
};

export type UpdateRoleResponse = {
  status: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
};

export function listProjects() {
  return api<Project[]>("/projects");
}

export function getProject(projectId: string) {
  return api<{
    id: string;
    name: string;
    sprint_duration: number;
    project_velocity: number;
  }>(`/projects/${projectId}`);
}

export function createProject(data: ProjectCreate) {
  return api<{
    id: string;
    name: string;
    sprint_duration: number;
    project_velocity: number;
  }>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProject(projectId: string, data: ProjectUpdate) {
  return api<{
    id: string;
    name: string;
    sprint_duration: number;
    project_velocity: number;
  }>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteProject(projectId: string) {
  return api<{ status: string }>(`/projects/${projectId}`, {
    method: "DELETE",
  });
}

export function joinProject(projectId: string, data: JoinProjectInput) {
  return api<{
    status: string;
    project_id: string;
    role: ProjectRole;
  }>(`/projects/${projectId}/join`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function joinProjectByCode(data: JoinProjectByCodeInput) {
  return api<{
    status: string;
    project_id: string;
    join_code: string;
    role: ProjectRole;
  }>("/projects/join-by-code", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateRole(projectId: string, data: UpdateRoleInput) {
  return api<UpdateRoleResponse>(`/projects/${projectId}/role`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function leaveProject(projectId: string) {
  return api<{ status: string; project_id: string }>(
    `/projects/${projectId}/leave`,
    {
      method: "POST",
    }
  );
}