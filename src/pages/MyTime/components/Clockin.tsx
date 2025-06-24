// src/pages/MyTime/components/Clockin.tsx

import React, { useEffect, useRef, useState } from "react";
import { getProjects } from "../../../lib/projects";
import { startWithPhoto } from "../../../lib/clockins";
import { useNavigate } from "react-router-dom";
import { useJsApiLoader } from "@react-google-maps/api";
import MapContainer from "./MapContainer";

interface Project { id: string; name: string; }
interface ClockinOut {
  id: string;
  start_time: string;
}
interface ClockinProps {
  token: string;
  onStarted: (payload: { id: string; startTime: string }) => void;
}

const SESSION_STORAGE_KEY = "clockinSession";
const GM_LIBS = ["places"] as const;

const Clockin: React.FC<ClockinProps> = ({ token, onStarted }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState({
    state: "", city: "", street: "", street_number: "", postal_code: ""
  });
  const [status, setStatus] = useState<"idle"|"pending"|"failed">("idle");

  const userId = localStorage.getItem("user_id") || "";
  const storageKey = `${SESSION_STORAGE_KEY}_${userId}`;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: GM_LIBS,
  });

  // 1) Si no hay token, vamos a login
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // 2) Carga de proyectos
  useEffect(() => {
    if (!token) return;
    getProjects(token)
      .then(({ data }) => setProjects(data))
      .catch(() => alert("Error cargando proyectos"));
  }, [token]);

  // 3) Inicializar cámara
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(st => {
        streamRef.current = st;
        if (videoRef.current) videoRef.current.srcObject = st;
      })
      .catch(console.error);
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  // 4) Geolocalización
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setCoords({ lat: coords.latitude, lng: coords.longitude }),
      console.error,
      { enableHighAccuracy: true }
    );
  }, []);

  const handleCaptureAndStart = () => {
    if (!selectedProject) return alert("❗ Selecciona un proyecto");
    if (!coords) return alert("❗ Confirma tu ubicación");

    const video = videoRef.current!, canvas = canvasRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async blob => {
      if (!blob) return alert("❗ No se pudo capturar");

      const form = new FormData();
      form.append("project_id", selectedProject);
      form.append("latitude", coords.lat.toString());
      form.append("longitude", coords.lng.toString());
      form.append("state", address.state);
      form.append("city", address.city);
      form.append("street", address.street);
      form.append("street_number", address.street_number);
      form.append("postal_code", address.postal_code);
      form.append("file", blob, "clockin.jpg");

      try {
        setStatus("pending");
        // **Todos los usuarios usan este endpoint**
        const { data: clk } = await startWithPhoto(token, form);
        // Guardamos la sesión SOLO para este userId
        localStorage.setItem(
          storageKey,
          JSON.stringify({ id: clk.id, startTime: clk.start_time })
        );
        streamRef.current?.getTracks().forEach(t => t.stop());
        onStarted({ id: clk.id, startTime: clk.start_time });
        setStatus("idle");
      } catch (err: any) {
        setStatus("failed");
        console.error(err);
        alert(err.response?.data?.detail || "Error iniciando clockin");
      }
    }, "image/jpeg");
  };

  if (loadError) return <div>Error cargando mapa</div>;
  if (!isLoaded) return <div>Cargando mapa…</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-10">
      {/* Captura */}
      <div className="w-full lg:w-1/2 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Clockin</h2>
        <select
          className="w-full border rounded px-3 py-2 mb-4"
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          <option value="" disabled>-- Selecciona un proyecto --</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <video ref={videoRef} autoPlay className="w-full rounded border mb-4" />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {status === "pending" && (
          <p className="mt-2"><strong>Procesando...</strong></p>
        )}
        <button
          onClick={handleCaptureAndStart}
          disabled={status === "pending"}
          className="mt-4 bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {status === "pending" ? "Procesando..." : "Capture & Start"}
        </button>
      </div>
      {/* Mapa */}
      <div className="w-full lg:w-1/2 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Confirm Location</h2>
        <MapContainer
          onLocationSelect={(lat, lng) => setCoords({ lat, lng })}
          onAddressSelect={addr => setAddress(addr)}
          geofenceRadius={100}
        />
      </div>
    </div>
  );
};

export default Clockin;
