import api from './api';

export const getMe = (token: string) =>
  api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });

export const updateMe = (token: string, data: FormData) =>
  api.put('/users/me', data, { headers: { Authorization: `Bearer ${token}` } });

export const changeMyPassword = (token: string, payload: any) =>
  api.put('/users/me/password', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const adminGetUsers = (token: string) =>
  api.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } });

export const adminCreateUser = (token: string, payload: any) =>
  api.post('/admin/users', payload, { headers: { Authorization: `Bearer ${token}` } });

export const adminUpdateUser = (token: string, id: string, payload: any) =>
  api.put(`/admin/users/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });

export const adminDeleteUser = (token: string, id: string) =>
  api.delete(`/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });

export const adminChangePassword = (token: string, id: string, payload: any) =>
  api.put(`/admin/users/${id}/password`, payload, { headers: { Authorization: `Bearer ${token}` } });
