import api from './api';

export const getSummaryAll = (token: string) =>
  api.get('/summary/all', { headers: { Authorization: `Bearer ${token}` } });

export const getSummaryForUser = (token: string, userId: string) =>
  api.get(`/summary/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
