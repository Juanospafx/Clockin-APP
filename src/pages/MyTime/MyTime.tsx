// src/pages/MyTime/MyTime.tsx

import React, { useEffect, useState, useRef, ChangeEvent } from "react";
import {
  listForUser,
  endClockin,
  modifyClockin,
  deleteClockin,
} from "../../lib/clockins";
import { getMe } from "../../lib/users";
import { postLocation } from "../../lib/locations";
import Cookies from "js-cookie";
import MyTimeSidebar from "./components/MyTimeSidebar";
import TimeCartHeader from "./components/TimeCartHeader";
import TimeCartTable, { ClockinEntry } from "./components/TimeCartTable";
import Clockin from "./components/Clockin";
import MapContainer from "./components/MapContainer";

interface UserMe {
  id: string;
  username: string;
  role: "admin" | "office" | "field";
}

const COOKIE_KEY = "clockinSession";
const COOKIE_EXPIRES_DAYS = 7;

// Normaliza una fecha a ISO UTC
function normalizeToUTC(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr.endsWith("Z") ? dateStr : new Date(dateStr).toISOString();
}

// Calcula horas entre start y end
function calculateHours(start: string, end?: string): number | undefined {
  if (!start) return undefined;
  const s = new Date(normalizeToUTC(start)).getTime();
  const e = end ? new Date(normalizeToUTC(end)).getTime() : Date.now();
  if (isNaN(s) || (end && isNaN(e))) return undefined;
  return Math.max(0, (e - s) / 3600000);
}

const MyTime: React.FC = () => {
  const token = localStorage.getItem("token") || "";
  const userId = localStorage.getItem("user_id") || "";
  // clave única por usuario
  const storageKey = `${COOKIE_KEY}_${userId}`;

  // Estado principal
  const [entries, setEntries] = useState<ClockinEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showClockin, setShowClockin] = useState(false);
  const [session, setSession] = useState<{
    id: string;
    startTime: string;
    startedAt: number;
    accumulated: number;
  } | null>(null);
  const [displayTime, setDisplayTime] = useState("00:00:00");
  const [editingEntry, setEditingEntry] = useState<ClockinEntry | null>(null);

  // Campos para editar
  const [editHours, setEditHours] = useState(0);
  const [editState, setEditState] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editStreetNumber, setEditStreetNumber] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editLocation, setEditLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Para saber si el usuario es admin
  const [isAdmin, setIsAdmin] = useState(false);

  const timerRef = useRef<number | null>(null);

  // 1) Obtener rol de usuario
  useEffect(() => {
    if (!token) return;
    getMe(token)
      .then(({ data }) => setIsAdmin(data.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, [token]);

  // 2) Carga las clockins del usuario
  const loadEntries = async () => {
    if (!token || !userId) return;
    try {
      const { data } = await listForUser(token, userId);
      setEntries(
        data.map((e) => ({
          id: e.id,
          psCode: e.id.slice(0, 6),
          userName: e.user_name,
          projectName: e.project_name || "—",
          postalCode: e.postal_code || "—",
          createdAt: normalizeToUTC(e.start_time),
          endTime: e.end_time ? normalizeToUTC(e.end_time) : undefined,
          hours: calculateHours(e.start_time, e.end_time)
            ? parseFloat(calculateHours(e.start_time, e.end_time)!.toFixed(2))
            : undefined,
          state: e.state,
          city: e.city,
          street: e.street,
          street_number: e.street_number,
          location_lat: e.location_lat,
          location_long: e.location_long,
        }))
      );
    } catch (err) {
      console.error("Error fetching clockins:", err);
    }
  };

  // Formatea milisegundos a HH:MM:SS
  const formatTime = (ms: number) => {
    const tot = Math.floor(ms / 1000);
    const h = Math.floor(tot / 3600).toString().padStart(2, "0");
    const m = Math.floor((tot % 3600) / 60).toString().padStart(2, "0");
    const s = (tot % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Inicia el cronómetro
  const startTimer = (sess: { accumulated: number; startedAt: number }) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      const elapsed = sess.accumulated + (Date.now() - sess.startedAt);
      setDisplayTime(formatTime(elapsed));
    }, 1000);
    setDisplayTime(formatTime(sess.accumulated + (Date.now() - sess.startedAt)));
  };

  // Maneja el inicio de un nuevo clockin
  const handleStarted = (p: { id: string; startTime: string }) => {
    const sess = {
      id: p.id,
      startTime: p.startTime,
      startedAt: Date.now(),
      accumulated: 0,
    };
    setSession(sess);
    // guarda sesión con clave de usuario
    Cookies.set(storageKey, JSON.stringify(sess), { expires: COOKIE_EXPIRES_DAYS });
    startTimer(sess);
    setShowClockin(false);
    loadEntries();
  };

  // Maneja el clock out
  const handleClockOut = async () => {
    if (!session || !token) return;
    try {
      const elapsed = session.accumulated + (Date.now() - session.startedAt);
      await endClockin(token, session.id, { elapsed_ms: elapsed });
      if (timerRef.current) clearInterval(timerRef.current);
      Cookies.remove(storageKey);
      setSession(null);
      setDisplayTime("00:00:00");
      loadEntries();
    } catch (e) {
      console.error(e);
      alert("Error al hacer clock out");
    }
  };

  // Preparar edición (solo admin verá el lápiz)
  const handleEdit = (e: ClockinEntry) => {
    setEditingEntry(e);
    setEditHours(e.hours ?? 0);
    setEditState(e.state || "");
    setEditCity(e.city || "");
    setEditStreet(e.street || "");
    setEditStreetNumber(e.street_number || "");
    setEditPostalCode(e.postalCode || "");
    setEditLocation(
      e.location_lat && e.location_long
        ? { lat: e.location_lat, lng: e.location_long }
        : null
    );
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingEntry(null);
    setEditLocation(null);
  };

  // Guardar edición (solo admin)
  const saveEdit = async () => {
    if (!editingEntry || !token) return;
    try {
      const payload: any = { hours: editHours };
      payload.state = editState;
      payload.city = editCity;
      payload.street = editStreet;
      payload.street_number = editStreetNumber;
      payload.postal_code = editPostalCode;
      if (editLocation) {
        payload.location_lat = editLocation.lat;
        payload.location_long = editLocation.lng;
      }
      await modifyClockin(token, editingEntry.id, payload);
      cancelEdit();
      loadEntries();
    } catch (err) {
      console.error("Error saving edit:", err);
      alert("No se pudo actualizar");
    }
  };

  // Borrar entrada (todos pueden borrar)
  const handleDelete = async (id: string) => {
    if (session && id === session.id) return alert("Haz clock out primero");
    if (!token) return;
    try {
      await deleteClockin(token, id);
      loadEntries();
    } catch (e) {
      console.error(e);
      alert("Error eliminando");
    }
  };

  // Filtrado en memoria según el término de búsqueda
  const filteredEntries = entries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      e.psCode.toLowerCase().includes(term) ||
      e.userName.toLowerCase().includes(term) ||
      e.projectName.toLowerCase().includes(term) ||
      e.postalCode.toLowerCase().includes(term)
    );
  });

  // Efecto de inicio: carga y recuperación de sesión
  useEffect(() => {
    loadEntries();
    const c = Cookies.get(storageKey);
    if (c) {
      try {
        const s = JSON.parse(c);
        const accumulated = s.accumulated + (Date.now() - s.startedAt);
        const sess = { ...s, accumulated, startedAt: Date.now() };
        setSession(sess);
        Cookies.set(storageKey, JSON.stringify(sess), {
          expires: COOKIE_EXPIRES_DAYS,
        });
        startTimer(sess);
      } catch {
        Cookies.remove(storageKey);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Track location every 5 minutes while session active
  useEffect(() => {
    if (!session || !token) return;
    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        postLocation(token, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          clockin_id: session.id,
        }).catch(console.error);
      });
    };
    sendLocation();
    const int = setInterval(sendLocation, 300000);
    return () => clearInterval(int);
  }, [session, token]);

  // Si aún no hay sesión activa y queremos iniciar → show Clockin
  if (showClockin && !session) {
    return <Clockin token={token} onStarted={handleStarted} />;
  }

  return (
    <div className="flex h-screen bg-white text-black">
      {/* Sidebar */}
      <MyTimeSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <TimeCartHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onFilter={() => {}}
          onAddClockin={() => setShowClockin(true)}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
        />
        {/* Tabla */}
        <div className="flex-1 overflow-auto pt-6 px-8 lg:px-16">
          <TimeCartTable
            entries={filteredEntries}
            onEdit={isAdmin ? handleEdit : undefined}
            onDelete={handleDelete}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* Modal Edición */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">Edit Clockin</h2>
            {/* Formulario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Horas</label>
                <input
                  type="number" step="0.01"
                  className="w-full border rounded px-2 py-1"
                  value={editHours}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditHours(parseFloat(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Postal Code</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  value={editPostalCode}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditPostalCode(e.target.value)
                  }
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">Ubicación</label>
              <MapContainer
                initialCenter={editLocation}
                onLocationSelect={(lat, lng) => setEditLocation({ lat, lng })}
                onAddressSelect={({ state, city, street, street_number, postal_code }) => {
                  setEditState(state);
                  setEditCity(city);
                  setEditStreet(street);
                  setEditStreetNumber(street_number);
                  setEditPostalCode(postal_code);
                }}
                geofenceRadius={100}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Estado</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  value={editState}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditState(e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Ciudad</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  value={editCity}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditCity(e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Calle</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  value={editStreet}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditStreet(e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Número</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  value={editStreetNumber}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditStreetNumber(e.target.value)
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón Clock Out */}
      {session && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg z-40">
          <div className="font-mono text-2xl">{displayTime}</div>
          <button
            onClick={handleClockOut}
            className="mt-2 w-full bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Clock Out
          </button>
        </div>
      )}
    </div>
  );
};

export default MyTime;
