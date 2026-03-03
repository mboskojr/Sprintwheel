import { api } from "./client";

export type Project = {
  id: string;
  name: string;
  sprint_duration: number;
};

export function listProjects() {
  return api<Project[]>("/projects");
}