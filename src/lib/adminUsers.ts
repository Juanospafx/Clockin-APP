import api, { authHeaders } from './api';
import { AdminUser as User } from '../pages/User/admin/components/AdminTable';

const ADMIN_API = '/admin/users';

export function getUsers() {
  return api.get<User[]>(ADMIN_API, { headers: authHeaders() });
}

export function deleteUser(id: string) {
  return api.delete(`${ADMIN_API}/${id}`, { headers: authHeaders() });
}

export function saveUser(id: string | null, payload: any) {
  if (id) {
    return api.put(`${ADMIN_API}/${id}`, payload, { headers: authHeaders() });
  }
  return api.post(ADMIN_API, payload, { headers: authHeaders() });
}

export function changePassword(id: string, newPassword: string) {
  return api.put(`${ADMIN_API}/${id}/password`, { new_password: newPassword }, { headers: authHeaders() });
}
