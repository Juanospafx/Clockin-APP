// src/pages/MyTime/MyTime.tsx

import React, { useEffect, useState, useRef, ChangeEvent } from "react";
import axios from "axios";
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
  const [editHours, setEditHours] = useState(0);
  const [editState, setEditState] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editStreetNumber, setEditStreetNumber] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editLocation, setEditLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  const timerRef = useRef<number | null>(null);

  // 1) Obtener rol de usuario
  useEffect(() => {
    if (!token) return;
    axios
      .get<UserMe>("http://localhost:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => setIsAdmin(data.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, [token]);

  // 2) Carga las clockins del usuario
  const loadEntries = async () => {
    if (!token || !userId) return;
    try {
      const { data } = await axios.get<any[]>(
        `http://localhost:8000/clockins/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

  // 3) Formatea y cronómetro
  const formatTime = (ms: number) => {
    const tot = Math.floor(ms / 1000);
    const h = Math.floor(tot / 3600).toString().padStart(2, "0");
    const m = Math.floor((tot % 3600) / 60).toString().padStart(2, "0");
    const s = (tot % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };
  const startTimer = (sess: { accumulated: number; startedAt: number }) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      const elapsed = sess.accumulated + (Date.now() - sess.startedAt);
      setDisplayTime(formatTime(elapsed));
    }, 1000);
  };

  // 4) Inicia un nuevo Clockin
  const handleStarted = (p: { id: string; startTime: string }) => {
    const sess = {
      id: p.id,
      startTime: p.startTime,
      startedAt: Date.now(),
      accumulated: 0,
    };
    setSession(sess);
    Cookies.set(storageKey, JSON.stringify(sess), { expires: COOKIE_EXPIRES_DAYS });
    startTimer(sess);
    setShowClockin(false);
    loadEntries();
  };

  // 5) Maneja Clock Out
  const handleClockOut = async () => {
    if (!session?.id || !token) {
      return alert("No hay sesión activa para cerrar");
    }
    try {
      const elapsed = session.accumulated + (Date.now() - session.startedAt);
      await axios.put(
        `http://localhost:8000/clockins/end/${session.id}`,
        { elapsed_ms: elapsed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

  // 6) Editar y eliminar
  const handleEdit = (e: ClockinEntry) => {
    setEditingEntry(e);
    setEditHours(e.hours ?? 0);
    setEditState(e.state || "");
    setEditCity(e.city || "");
    setEditStreet(e.street || "");
    setEditStreetNumber(e.street_number || "");
    setEditPostalCode(e.postalCode || "");
    if (e.location_lat && e.location_long) {
      setEditLocation({ lat: e.location_lat, lng: e.location_long });
    }
  };
  const cancelEdit = () => {
    setEditingEntry(null);
    setEditLocation(null);
  };
  const saveEdit = async () => {
    if (!editingEntry || !token) return;
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
    try {
      await axios.patch(
        `http://localhost:8000/clockins/modify/${editingEntry.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      cancelEdit();
      loadEntries();
    } catch (err) {
      console.error("Error saving edit:", err);
      alert("No se pudo actualizar");
    }
  };
  const handleDelete = async (id: string) => {
    if (session && id === session.id) return alert("Haz clock out primero");
    if (!token) return;
    try {
      await axios.delete(`http://localhost:8000/clockins/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadEntries();
    } catch (e) {
      console.error("Error eliminando:", e);
      alert("Error eliminando");
    }
  };

  // 7) Filtrado en memoria
  const filteredEntries = entries.filter((e) => {
    const t = searchTerm.toLowerCase();
    return (
      e.psCode.toLowerCase().includes(t) ||
      e.userName.toLowerCase().includes(t) ||
      e.projectName.toLowerCase().includes(t) ||
      e.postalCode.toLowerCase().includes(t)
    );
  });

  // 8) Efecto inicial: cargar y recuperar sesión
  useEffect(() => {
    loadEntries();
    const c = Cookies.get(storageKey);
    if (c) {
      try {
        const s = JSON.parse(c);
        const accumulated = s.accumulated + (Date.now() - s.startedAt);
        const sess = { ...s, accumulated, startedAt: Date.now() };
        setSession(sess);
        Cookies.set(storageKey, JSON.stringify(sess), { expires: COOKIE_EXPIRES_DAYS });
        startTimer(sess);
      } catch {
        Cookies.remove(storageKey);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Si aún no hay sesión activa y abrimos Clockin
  if (showClockin && !session) {
    return <Clockin token={token!} onStarted={handleStarted} />;
  }

  return (
    <div className="flex h-screen bg-white text-black">
      <MyTimeSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TimeCartHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onFilter={() => {}}
          onAddClockin={() => setShowClockin(true)}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
        />

        <main className="flex-1 overflow-auto p-8">
          <TimeCartTable
            entries={filteredEntries}
            onEdit={isAdmin ? handleEdit : undefined}
            onDelete={handleDelete}
            isAdmin={isAdmin}
          />
        </main>
      </div>

      {editingEntry && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">
              Edit Clockin
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Horas</label>
                <input
                  type="number"
                  step="0.01"
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
                className="px-4 py-2 border rounded hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {session && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg z-40">
          <div className="font-mono text-2xl">{displayTime}</div>
          <button
            onClick={handleClockOut}
            className="mt-2 w-full bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
          >
            Clock Out
          </button>
        </div>
      )}
    </div>
  );
};

export default MyTime;
