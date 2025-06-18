// src/pages/Projects/components/ProjectSidebar.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Clock, Wrench, BarChart2, List as ListIcon } from "lucide-react";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject?: () => void;  // opcional, solo admins lo reciben
  isAdmin: boolean;           // nuevo flag
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  isOpen,
  onClose,
  onAddProject,
  isAdmin,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Overlay móvil */}
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-30 z-30
          lg:hidden
          transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 p-6 flex flex-col z-40
          transform transition-transform duration-300
          lg:static lg:translate-x-0 lg:w-64 lg:h-full
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">My Projects</h2>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            ✖️
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex flex-col gap-4">
          <button
            onClick={() => {
              navigate("/");
              onClose();
            }}
            className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
          >
            <Home size={16} /> Home
          </button>

          {/* Solo admin ve este botón */}
          {isAdmin && onAddProject && (
            <button
              onClick={() => {
                onAddProject();
                onClose();
              }}
              className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
            >
              <Wrench size={16} /> Add a project
            </button>
          )}

          <button
            onClick={() => {
              navigate("/my-time");
              onClose();
            }}
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
          >
            <img src="/clock.svg" alt="My Time" className="w-5 h-5" />
            My Time
          </button>

           <button
            onClick={() => navigate("/my_record")}
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
          >
            <BarChart2 size={16} />
            My Record
          </button>



          <button
            onClick={() => {
              navigate("/projects_history");
              onClose();
            }}
            className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
          >
            <Clock size={16} /> Project History
          </button>
        </nav>
      </aside>
    </>
  );
};

export default ProjectSidebar;

