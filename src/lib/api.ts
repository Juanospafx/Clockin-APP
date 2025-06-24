import axios from 'axios';

export const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
});

export function authHeaders() {
  const token = localStorage.getItem('token') || '';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export default api;
