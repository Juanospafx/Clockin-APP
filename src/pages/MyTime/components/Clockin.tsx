// src/pages/MyTime/components/Clockin.tsx

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useJsApiLoader } from "@react-google-maps/api";
import MapContainer from "./MapContainer";

interface Project { id: string; name: string; }
interface ClockinOut {
  id: string;
  start_time: string;
  photo_path?: string;
  approved?: boolean;
}
interface TaskResponse { task_id: string; }
interface TaskStatusResponse {
  status: string;
  clockin?: ClockinOut;
  error?: string;
}

interface ClockinProps {
  token: string;
  onStarted: (payload: { id: string; startTime: string }) => void;
}

const SESSION_STORAGE_KEY = "clockinSession";
const GM_LIBS = ["places"] as const;
const POLLING_INTERVAL = 2000; // 2 segundos

const Clockin: React.FC<ClockinProps> = ({ token, onStarted }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollingRef = useRef<number | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<{
    state: string;
    city: string;
    street: string;
    street_number: string;
    postal_code: string;
  }>({ state: "", city: "", street: "", street_number: "", postal_code: "" });

  const [role, setRole] = useState<"admin" | "office" | "field">("field");
  const [status, setStatus] = useState<"idle" | "sent" | "pending" | "failed">("idle");
  const [taskId, setTaskId] = useState<string | null>(null);

  const userId = localStorage.getItem("user_id") || "";
  const storageKey = `${SESSION_STORAGE_KEY}_${userId}`;
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: GM_LIBS,
  });

  // 1) Obtener rol real
  useEffect(() => {
    if (!token) return navigate("/login");
    axios.get<{ role: string }>("http://localhost:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setRole(res.data.role as any))
    .catch(() => {
      alert("No autorizado");
      navigate("/login");
    });
  }, [token, navigate]);

  // 2) Cargar proyectos
  useEffect(() => {
    if (!token) return;
    axios.get<Project[]>("http://localhost:8000/projects", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(r => setProjects(r.data))
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

  // 5) Limpiar polling
  useEffect(() => {
    return () => {
      if (pollingRef.current !== null) clearInterval(pollingRef.current);
    };
  }, []);

  // Polling para estado de detección
  const handlePolling = async (id: string) => {
    try {
      const { data } = await axios.get<TaskStatusResponse>(
        `http://localhost:8000/detection/task-status/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.status === "completed" && data.clockin) {
        // Si no aprueba, mostramos alerta y no iniciamos
        if (data.clockin.approved === false) {
          if (pollingRef.current !== null) clearInterval(pollingRef.current);
          setStatus("idle");
          return alert("No cumples los requisitos de EPP; no puedes iniciar.");
        }

        if (pollingRef.current !== null) clearInterval(pollingRef.current);
        setStatus("idle");
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            id: data.clockin.id,
            startTime: data.clockin.start_time,
          })
        );
        streamRef.current?.getTracks().forEach(t => t.stop());
        onStarted({ id: data.clockin.id, startTime: data.clockin.start_time });
      } else if (data.status === "failed") {
        if (pollingRef.current !== null) clearInterval(pollingRef.current);
        setStatus("failed");
        alert(data.error || "Falló la detección EPP");
      }
    } catch (error) {
      if (pollingRef.current !== null) clearInterval(pollingRef.current);
      setStatus("failed");
      console.error("Error en polling:", error);
      alert("Error verificando estado de detección");
    }
  };

  // Capturar imagen y enviar al endpoint adecuado
  const handleCaptureAndStart = async () => {
    if (!selectedProject) return alert("❗ Selecciona un proyecto");
    if (!coords) return alert("❗ Confirma tu ubicación");

    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async blob => {
      if (!blob) return alert("❗ No se pudo capturar");

      const form = new FormData();
      form.append("project_id", selectedProject);
      form.append("latitude", String(coords.lat));
      form.append("longitude", String(coords.lng));
      form.append("state", address.state);
      form.append("city", address.city);
      form.append("street", address.street);
      form.append("street_number", address.street_number);
      form.append("postal_code", address.postal_code);
      form.append("file", blob, "clockin.jpg");

      try {
        if (role === "field") {
          // Users field → Celery + modelo
          setStatus("sent");
          const { data: taskResp } = await axios.post<TaskResponse>(
            `http://localhost:8000/detection/clockins/${userId}/detect`,
            form,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setTaskId(taskResp.task_id);
          setStatus("pending");
          pollingRef.current = window.setInterval(
            () => handlePolling(taskResp.task_id),
            POLLING_INTERVAL
          );
        } else {
          // Office/admin → subida directa
          setStatus("pending");
          const { data: clk } = await axios.post<ClockinOut>(
            "http://localhost:8000/clockins/photo",
            form,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          // Si por alguna razón approved viene false, lo notificamos
          if (clk.approved === false) {
            setStatus("idle");
            return alert("Tu foto no cumple requisitos de EPP.");
          }
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              id: clk.id,
              startTime: clk.start_time,
            })
          );
          streamRef.current?.getTracks().forEach(t => t.stop());
          onStarted({ id: clk.id, startTime: clk.start_time });
          setStatus("idle");
        }
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
      {/* Panel de captura */}
      <div className="w-full lg:w-1/2 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          {role === "field" ? "Field Clockin" : "Office Clockin"}
        </h2>
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
        {status !== "idle" && (
          <p className="mt-2">
            Estado:{" "}
            <strong>
              {status === "sent"
                ? "Enviando..."
                : status === "pending"
                ? "Procesando detección..."
                : "Fallido"}
            </strong>
          </p>
        )}
        <button
          onClick={handleCaptureAndStart}
          disabled={status === "pending" || status === "sent"}
          className="mt-4 bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {status === "pending" || status === "sent" ? "Procesando..." : "Capture & Start"}
        </button>
      </div>

      {/* Panel de ubicación */}
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
