// src/pages/User/admin/MyRecord.tsx
import React, { useEffect, useState, ChangeEvent } from "react";
import axios from "axios";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import MyRecordSidebar from "./components/my_record_sidebar";
import MyRecordHeader from "./components/my_record_header";
import MyRecordTable, { RecordEntry } from "./components/my_record_table";
import MapContainer from "./components/MapContainer";
import ClockinMap from "./components/ClockinMap";

const API_BASE = "http://localhost:8000";

const MyRecord: React.FC = () => {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState<RecordEntry | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [mapClockinId, setMapClockinId] = useState<string | null>(null);

  // Edit form state
  const [hours, setHours] = useState<number>(0);
  const [stateField, setStateField] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const token = localStorage.getItem("token")!;
  const userId = localStorage.getItem("user_id")!;
  const headers = { Authorization: `Bearer ${token}` };

  // Load records and role
  useEffect(() => {
    axios
      .get<{ role: string }>(`${API_BASE}/users/me`, { headers })
      .then(({ data }) => {
        if (data.role === "admin") {
          setIsAdmin(true);
          return axios.get<any[]>(`${API_BASE}/clockin_history/all`, { headers });
        } else {
          setIsAdmin(false);
          return axios.get<any[]>(`${API_BASE}/clockin_history/${userId}`, { headers });
        }
      })
      .then(({ data }) => {
        const mapped: RecordEntry[] = data.map(r => ({
          id: r.id,
          clockinId: r.clockin_id,
          photoPath: r.photo_path,
          userName: r.user_name,
          projectName: r.project_name,
          address:
            [r.state, r.city, r.street, r.street_number]
              .filter(Boolean)
              .join(", ") +
            (r.postal_code ? `, ${r.postal_code}` : ""),
          date: dayjs(r.created_at).format("D/M/YYYY"),
          hours: r.hours,
          state: r.state,
          city: r.city,
          street: r.street,
          streetNumber: r.street_number,
          postalCode: r.postal_code,
        }));
        setRecords(mapped);
      })
      .catch(() => setRecords([]));
  }, [token, userId]);

  // Filtered records
  const filtered = records.filter(r =>
    [r.userName, r.projectName, r.address]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Export to Excel
  const handleExport = () => {
    if (!filtered.length) {
      alert("No hay datos para exportar.");
      return;
    }
    const aoa = [
      ["Photo", "User", "Project", "Address", "Date", "Hours"],
      ...filtered.map(r => [
        {
          t: "s",
          v: "📷 Ver foto",
          l: { Target: `${API_BASE}${r.photoPath}`, Tooltip: "Abrir foto" },
        },
        r.userName,
        r.projectName,
        r.address,
        r.date,
        parseFloat(r.hours.toFixed(2)),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 30 },
      { wch: 40 },
      { wch: 12 },
      { wch: 8 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MyRecord");
    XLSX.writeFile(wb, `MyRecord_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
  };

  // Open edit modal
  const openEdit = (entry: RecordEntry) => {
    setEditing(entry);
    setHours(entry.hours);
    setStateField(entry.state);
    setCity(entry.city);
    setStreet(entry.street);
    setStreetNumber(entry.streetNumber);
    setPostalCode(entry.postalCode);
    setLocation(null);
  };

  // Save edits
  const saveEdit = async () => {
    if (!editing) return;
    await axios.patch(
      `${API_BASE}/clockins/modify/${editing.clockinId}`,
      {
        hours,
        state: stateField,
        city,
        street,
        street_number: streetNumber,
        postal_code: postalCode,
        ...(location ? { location_lat: location.lat, location_long: location.lng } : {}),
      },
      { headers }
    );
    await axios.patch(
      `${API_BASE}/clockin_history/${editing.id}`,
      {
        state: stateField,
        city,
        street,
        street_number: streetNumber,
        postal_code: postalCode,
      },
      { headers }
    );
    setEditing(null);
    window.location.reload();
  };

  // Delete entry
  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Borrar este registro?")) return;
    await axios.delete(`${API_BASE}/clockin_history/${id}`, { headers });
    setRecords(rs => rs.filter(r => r.id !== id));
  };

  return (
    <div className="flex h-screen bg-white text-black">
      <MyRecordSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MyRecordHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onFilter={() => {}}
          onExportExcel={handleExport}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <div className="flex-1 overflow-auto px-4 lg:px-16 py-4">
          <MyRecordTable
            entries={filtered}
            isAdmin={isAdmin}
            onEdit={openEdit}
            onDelete={handleDelete}
            onPreview={path => setPreviewPath(path)}
            onViewMap={id => setMapClockinId(id)}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg space-y-4 overflow-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold">Editar Registro</h2>
            <div>
              <label className="block text-sm mb-1">Horas</label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded px-2 py-1"
                value={hours}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setHours(parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="h-56 w-full border rounded overflow-hidden">
              <MapContainer
                initialCenter={location}
                onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
                onAddressSelect={({ state, city, street, street_number, postal_code }) => {
                  setStateField(state);
                  setCity(city);
                  setStreet(street);
                  setStreetNumber(street_number);
                  setPostalCode(postal_code);
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Estado"
                value={stateField}
                onChange={e => setStateField(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              <input
                placeholder="Ciudad"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Calle"
                value={street}
                onChange={e => setStreet(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              <input
                placeholder="Número"
                value={streetNumber}
                onChange={e => setStreetNumber(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <input
              placeholder="Código Postal"
              value={postalCode}
              onChange={e => setPostalCode(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="px-4 py-2 bg-black text-white rounded hover:opacity-90"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPath && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewPath(null)}
        >
          <img
            src={`${API_BASE}${previewPath}`}
            alt="Preview"
            className="max-h-full max-w-full rounded"
          />
        </div>
      )}

      {mapClockinId && (
        <ClockinMap clockinId={mapClockinId} onClose={() => setMapClockinId(null)} />
      )}
    </div>
  );
};

export default MyRecord;
