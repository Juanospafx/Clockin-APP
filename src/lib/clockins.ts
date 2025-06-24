import api, { authHeaders } from './api';

export interface ClockinLocation {
  id: string;
  user_id: string;
  user_name: string;
  location_lat: number;
  location_long: number;
}

export function updateLocation(clockinId: string, latitude: number, longitude: number) {
  return api.patch(`/clockins/location/${clockinId}`, { latitude, longitude }, { headers: authHeaders() });
}

export function fetchActiveLocations() {
  return api.get<ClockinLocation[]>(`/clockins/active-locations`, { headers: authHeaders() });
}
