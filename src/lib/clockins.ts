import api from './api';

export const listForUser = (token: string, userId: string) =>
  api.get(`/clockins/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

export const endClockin = (token: string, id: string, payload: Record<string, unknown>) =>
  api.put(`/clockins/end/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

export const modifyClockin = (token: string, id: string, payload: Record<string, unknown>) =>
  api.patch(`/clockins/modify/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

export const deleteClockin = (token: string, id: string) =>
  api.delete(`/clockins/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

export const startWithPhoto = (token: string, data: FormData) =>
  api.post('/clockins/photo', data, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

export const chartData = (token: string, userId: string) =>
  api.get(`/clockins/${userId}/chart-data`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());
