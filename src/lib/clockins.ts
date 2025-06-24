import api from './api';

export const listForUser = (token: string, userId: string) =>
  api.get(`/clockins/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });

export const endClockin = (token: string, id: string, payload: any) =>
  api.put(`/clockins/end/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });

export const modifyClockin = (token: string, id: string, payload: any) =>
  api.patch(`/clockins/modify/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });

export const deleteClockin = (token: string, id: string) =>
  api.delete(`/clockins/${id}`, { headers: { Authorization: `Bearer ${token}` } });

export const startWithPhoto = (token: string, data: FormData) =>
  api.post('/clockins/photo', data, { headers: { Authorization: `Bearer ${token}` } });

export interface ChartPoint {
  month: number;
  hours: number;
}

export const chartData = (userId: string) =>
  api.get<ChartPoint[]>(`/clockins/${userId}/chart-data`);
