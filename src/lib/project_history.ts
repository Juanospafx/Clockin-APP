import api from './api';

export const getProjectHistory = (token: string) =>
  api.get('/project_history/', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());
