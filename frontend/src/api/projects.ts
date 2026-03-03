import { api } from "./client";

export type Project = {
  id: string;
  name: string;
  sprint_duration: number;
};

//get /projects
export function listProjects() {
  return api<Project[]>("/projects");
}

//post /projects
export function createProject(body: { name: string; sprint_duration: number}) {
  return api<Project>("/projects",{
    method: "POST",
    body: JSON.stringify(body),
  });
}

