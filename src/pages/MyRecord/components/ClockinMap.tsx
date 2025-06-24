import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface Props {
  points: { latitude: number; longitude: number; id: string }[];
}

const ClockinMap: React.FC<Props> = ({ points }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'], 
    id: 'script-loader',     
    version: 'weekly',      
  });

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading map…</div>;

  const center = points.length
    ? { lat: points[0].latitude, lng: points[0].longitude }
    : { lat: 18.4861, lng: -69.9312 };

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '300px' }}
      center={center}
      zoom={10}
    >
      {points.map((p) => (
        <Marker key={p.id} position={{ lat: p.latitude, lng: p.longitude }} />
      ))}
    </GoogleMap>
  );
};

export default ClockinMap;
