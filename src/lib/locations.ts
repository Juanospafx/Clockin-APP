import api from './api';

export interface LocationPayload {
  latitude: number;
  longitude: number;
  clockin_id?: string;
}

export const postLocation = (token: string, payload: LocationPayload) =>
  api.post('/locations', payload, { headers: { Authorization: `Bearer ${token}` } });

export interface LocationWithUser extends LocationPayload {
  id: string;
  user_id: string;
  timestamp: string;
  username: string;
}

export const getAllLocations = (token: string) =>
  api.get<LocationWithUser[]>(
    '/locations/all',
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const getLocationsByClockin = (token: string, clockinId: string) =>
  api.get(`/locations/clockin/${clockinId}`, { headers: { Authorization: `Bearer ${token}` } });
