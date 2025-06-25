import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { getAllLocations } from '../../../lib/locations';

interface Point {
  id: string;
  latitude: number;
  longitude: number;
  username: string;
}

const UserMap: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const token = localStorage.getItem('token') || '';
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const { data } = await getAllLocations(token);
        setPoints(data as unknown as Point[]);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
    const int = setInterval(fetchData, 300000);
    return () => clearInterval(int);
  }, [token]);

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading map…</div>;

  const center = points[0]
    ? { lat: points[0].latitude, lng: points[0].longitude }
    : { lat: 18.4861, lng: -69.9312 };

  return (
    <div className="p-4">
      <GoogleMap mapContainerStyle={{ width: '100%', height: '300px' }} center={center} zoom={6}>
        {points.map((p) => {
          const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
              <circle cx="32" cy="32" r="16" fill="#3b82f6" stroke="white" stroke-width="2" />
              <text x="32" y="38" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${p.username}</text>
            </svg>`;
          return (
            <Marker
              key={p.id}
              position={{ lat: p.latitude, lng: p.longitude }}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 20),
              }}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
};

export default UserMap;
