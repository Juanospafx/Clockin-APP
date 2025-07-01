import api from './api';

export const getProjects = (token: string) =>
  api.get('/projects', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

export const deleteProject = (token: string, id: string) =>
  api.delete(`/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

export const updateProject = (token: string, id: string, payload: Record<string, unknown>) =>
  api.put(`/projects/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

export const createProject = (token: string, payload: Record<string, unknown>) =>
  api.post('/projects', payload, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());
