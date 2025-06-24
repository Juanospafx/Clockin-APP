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
        {points.map(p => (
          <Marker
            key={p.id}
            position={{ lat: p.latitude, lng: p.longitude }}
            label={p.username}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default UserMap;
