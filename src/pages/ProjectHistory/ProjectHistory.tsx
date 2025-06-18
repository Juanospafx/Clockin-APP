// src/pages/ProjectHistory/ProjectHistory.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

import ProjectHistorySidebar from "./components/ProjectHistorySidebar";
import ProjectHistoryHeader from "./components/ProjectHistoryHeader";
import ProjectHistoryTable, { HistoryEntry } from "./components/ProjectHistoryTable";

const ProjectHistory: React.FC = () => {
  const [records, setRecords]         = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm]   = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    axios
      .get<any[]>("http://localhost:8000/project_history/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        const mapped: HistoryEntry[] = data.map((r) => {
          const code = r.project_id.slice(0, 6);
          const parts = [r.state, r.city, r.street, r.street_number].filter(Boolean);
          const address = parts.join(", ") + (r.postal_code ? `, ${r.postal_code}` : "");
          const startDate = r.start_date
            ? dayjs(r.start_date).format("DD/MM/YYYY")
            : "—";
          const endDate = r.end_date
            ? dayjs(r.end_date).format("DD/MM/YYYY")
            : "—";
          const hours = (typeof r.hours === "number" ? r.hours : 0).toFixed(2);

          return {
            id:           r.id,
            projectCode:  code,
            projectName:  r.project_name,
            status:       r.status,
            address,
            startDate,
            endDate,
            hours,
            userName:     r.user_name,
          };
        });

        setRecords(mapped);
      })
      .catch((err) => {
        console.error("Error fetching project history:", err);
        setRecords([]);
      });
  }, [token]);

  const filtered = records.filter((r) =>
    [r.projectCode, r.projectName, r.address]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    if (!filtered.length) {
      alert("No hay datos para exportar.");
      return;
    }

    // 1) Preparamos un array de objetos plano para exportar
    const dataToExport = filtered.map((r) => ({
      "Code":         r.projectCode,
      "Project Name": r.projectName,
      "Status":       r.status,
      "Address":      r.address,
      "Start Date":   r.startDate,
      "End Date":     r.endDate,
      "Total Hours":  r.hours,
      "User":         r.userName,
    }));

    // 2) Creamos la hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(dataToExport, {
      header: [
        "Code",
        "Project Name",
        "Status",
        "Address",
        "Start Date",
        "End Date",
        "Total Hours",
        "User",
      ]
    });

    // 3) Creamos el libro y añadimos la hoja
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");

    // 4) Generamos el fichero XLSX en memoria
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // 5) Lo convertimos a Blob y forzamos descarga
    const blob = new Blob([wbout], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project_history_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-white text-black">
      <ProjectHistorySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header con buscador y botón de exportar */}
        <div className="sticky top-0 z-10">
          <ProjectHistoryHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onFilter={() => {}}
            onExportExcel={handleExportExcel}
            onToggleSidebar={() => setSidebarOpen(true)}
          />
        </div>

        {/* Tabla de histórico */}
        <div className="flex-1 overflow-auto px-8 lg:px-16">
          <ProjectHistoryTable entries={filtered} />
        </div>
      </div>
    </div>
  );
};

export default ProjectHistory;
