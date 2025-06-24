import api from './api';

export interface LocationPayload {
  latitude: number;
  longitude: number;
  clockin_id?: string;
}

export const postLocation = (token: string, payload: LocationPayload) =>
  api.post('/locations', payload, { headers: { Authorization: `Bearer ${token}` } });

export const getAllLocations = (token: string) =>
  api.get('/locations/all', { headers: { Authorization: `Bearer ${token}` } });

export const getLocationsByClockin = (token: string, clockinId: string) =>
  api.get(`/locations/clockin/${clockinId}`, { headers: { Authorization: `Bearer ${token}` } });
