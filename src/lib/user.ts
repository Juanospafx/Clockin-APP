import api, { authHeaders } from './api';

export interface UserMe {
  id: string;
  username: string;
  role: string;
  email: string;
  profile_photo?: string | null;
}

export function getCurrentUser() {
  return api.get<UserMe>('/users/me', { headers: authHeaders() });
}

export function updateMe(payload: FormData) {
  return api.put<UserMe>('/users/me', payload, { headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' } });
}

export function updatePassword(data: { old_password: string; new_password: string }) {
  return api.put('/users/me/password', data, { headers: authHeaders() });
}
