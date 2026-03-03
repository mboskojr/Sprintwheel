import { api } from "./client";

export type Project = {
  id: string;
  name: string;
  sprint_duration: number;
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
  role: string;
};

export type JoinProjectInput = {
  role: string;
};

export type UpdateRoleInput = {
  role: string;
};


export function listProjects() {
  return api<Project[]>("/projects");
}

export function getProject(projectId: string) {
  return api<Project>(`/projects/${projectId}`);
}

export function createProject(data: ProjectCreate) {
  return api<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


export function updateProject(projectId: string, data: ProjectUpdate) {
  return api<Project>(`/projects/${projectId}`, {
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
    role: string;
  }>(`/projects/${projectId}/join`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateRole(projectId: string, data: UpdateRoleInput) {
  return api<{
    status: string;
    project_id: string;
    user_id: string;
    role: string;
  }>(`/projects/${projectId}/role`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
