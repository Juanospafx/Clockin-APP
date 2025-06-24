import React, { useEffect, useState } from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import axios from "axios";

interface Point {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface Props {
  clockinId: string;
  onClose: () => void;
}

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY!;
const containerStyle = { width: "100%", height: "100%" };

const ClockinMap: React.FC<Props> = ({ clockinId, onClose }) => {
  const [points, setPoints] = useState<Point[]>([]);
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: apiKey });

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    axios
      .get<Point[]>(`http://localhost:8000/clockins/${clockinId}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setPoints(r.data))
      .catch(() => setPoints([]));
  }, [clockinId]);

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Cargando mapa…</div>;

  const center = points.length
    ? { lat: points[0].latitude, lng: points[0].longitude }
    : { lat: 18.4861, lng: -69.9312 };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-4 rounded shadow-lg w-full max-w-xl h-[500px] flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Clockin Locations</h2>
          <button onClick={onClose} className="text-red-500">Close</button>
        </div>
        <div className="flex-1">
          <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
            {points.map((p) => (
              <Marker key={p.id} position={{ lat: p.latitude, lng: p.longitude }} />
            ))}
            {points.length > 1 && (
              <Polyline
                path={points.map((p) => ({ lat: p.latitude, lng: p.longitude }))}
                options={{ strokeColor: "#3366FF" }}
              />
            )}
          </GoogleMap>
        </div>
      </div>
    </div>
  );
};

export default ClockinMap;
