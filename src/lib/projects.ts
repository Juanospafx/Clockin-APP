import api from './api';

export const getProjects = (token: string) =>
  api.get('/projects', { headers: { Authorization: `Bearer ${token}` } });

export const deleteProject = (token: string, id: string) =>
  api.delete(`/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });

export const updateProject = (token: string, id: string, payload: any) =>
  api.put(`/projects/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });

export const createProject = (token: string, payload: any) =>
  api.post('/projects', payload, { headers: { Authorization: `Bearer ${token}` } });
