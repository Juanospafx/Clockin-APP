// src/pages/User/admin/components/ProjectHistorySidebar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Clock, BarChart2, List as ListIcon } from "lucide-react";

interface ProjectHistorySidebarProps {
  isOpen?: boolean;     // si no usas toggle, puedes ignorar este prop
  onClose?: () => void; // idem
}

const ProjectHistorySidebar: React.FC<ProjectHistorySidebarProps> = ({
  isOpen = false,
  onClose,
}) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay semitransparente en móvil (solo si isOpen=true) */}
      <div
        className={
          `fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden transition-opacity duration-300 ${
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`
        }
        onClick={onClose}
      />

      {/* Sidebar deslizable */}
      <aside
        className={
          `fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 p-4 text-sm text-black flex flex-col z-40 transform transition-transform duration-300 lg:static lg:translate-x-0 lg:w-64 lg:h-full ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`
        }
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Project History</h2>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            ✖️
          </button>
        </div>

        <nav className="flex flex-col gap-4">
          <button
            onClick={() => handleNavigate("/")}
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
          >
            <Home size={16} />
            Home
          </button>
          <button
            onClick={() => handleNavigate("/my-time")}
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
          >
            <Clock size={16} />
            My Time
          </button>
          <button
            onClick={() => handleNavigate("/my_record")}
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
          >
            <BarChart2 size={16} />
            My Record
          </button>

          {/* Botón “Projects” */}
          <button
            onClick={() => handleNavigate("/projects")}
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
          >
            <ListIcon size={16} />
            Projects
          </button>
        </nav>

        <div className="mt-auto text-xs text-gray-500">v1.0</div>
      </aside>

     
    </>
  );
};

export default ProjectHistorySidebar;
