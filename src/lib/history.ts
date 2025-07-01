import api from './api';

export const getHistoryAll = (token: string) =>
  api.get('/clockin_history/all', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

export const getHistoryForUser = (token: string, userId: string) =>
  api.get(`/clockin_history/${userId}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

export const updateHistory = (token: string, id: string, payload: Record<string, unknown>) =>
  api.patch(`/clockin_history/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

export const deleteHistory = (token: string, id: string) =>
  api.delete(`/clockin_history/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());
