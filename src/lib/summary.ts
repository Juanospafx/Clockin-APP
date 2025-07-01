import api from './api';

export const getSummaryAll = (token: string) =>
  api.get('/summary/all', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

export const getSummaryForUser = (token: string, userId: string) =>
  api.get(`/summary/${userId}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());
