// src/pages/User/admin/components/MyRecordSidebar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Clock, Wrench } from "lucide-react";

interface MyRecordSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyRecordSidebar: React.FC<MyRecordSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const nav = useNavigate();

  return (
    <>
      {/* Backdrop: cubre toda la pantalla y bloquea el header */}
      <div
        className={`
          fixed inset-0
          bg-black bg-opacity-30
          lg:hidden
          z-40
          transition-opacity duration-300
          ${isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
          }
        `}
        onClick={onClose}
      />

      {/* Drawer lateral */}
      <aside
        className={`
          fixed inset-y-0 left-0
          w-64
          bg-white border-r border-gray-200
          p-4 flex flex-col text-sm
          transition-transform duration-300
          lg:static lg:translate-x-0
          z-50
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">My Record</h2>
          {/* Cerrar (solo en móvil) */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700"
            aria-label="Cerrar menú"
          >
            ✖
          </button>
        </div>

        <nav className="flex flex-col gap-4 flex-1">
          <button
            onClick={() => {
              nav("/");
              onClose();
            }}
            className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
          >
            <Home size={16} /> Home
          </button>

          <button
            onClick={() => {
              nav("/my-time");
              onClose();
            }}
            className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
          >
            <Clock size={16} /> My Time
          </button>

          <button
            onClick={() => {
              nav("/projects");
              onClose();
            }}
            className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
          >
            <Wrench size={16} /> Add a project
          </button>

          <button
            onClick={() => {
              nav("/projects_history");
              onClose();
            }}
            className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
          >
            <Clock size={16} /> Project History
          </button>
        </nav>

        <span className="mt-auto text-xs text-gray-500">v1.0</span>
      </aside>
    </>
  );
};

export default MyRecordSidebar;
