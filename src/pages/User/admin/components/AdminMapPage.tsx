import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { fetchActiveLocations, ClockinLocation } from '../../../../lib/clockins';

const containerStyle = { width: '100%', height: '400px' };

const AdminMapPage: React.FC = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
  });
  const [locs, setLocs] = useState<ClockinLocation[]>([]);

  const load = async () => {
    try {
      const { data } = await fetchActiveLocations();
      setLocs(data);
    } catch (err) {
      console.error('Error fetching locations', err);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 300000);
    return () => clearInterval(id);
  }, []);

  if (!isLoaded) return <p>Cargando mapa…</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">User Locations</h2>
      <GoogleMap mapContainerStyle={containerStyle} center={{ lat: 0, lng: 0 }} zoom={2}>
        {locs.map((l) => (
          <Marker key={l.id} position={{ lat: l.location_lat, lng: l.location_long }} label={l.user_name} />
        ))}
      </GoogleMap>
    </div>
  );
};

export default AdminMapPage;
