// src/pages/MyTime/components/MyTimeSidebar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, BarChart2 } from "lucide-react";

interface MyTimeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyTimeSidebar: React.FC<MyTimeSidebarProps> = ({
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
      {/* Overlay semitransparente (solo en móvil) */}
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-30 z-30 
          lg:hidden 
          transition-opacity duration-300 
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
      />

      <aside
        className={`
          fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 p-4 text-sm text-black flex flex-col z-40
          transform transition-transform duration-300
          lg:static lg:translate-x-0 lg:w-64 lg:h-full 
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">My Time</h2>
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
            onClick={() => {
              navigate("/");
              onClose();
            }}
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
          >
            <img src="/home.svg" alt="Home" className="w-5 h-5" />
            Home
          </button>
          <button
            onClick={() => {
              navigate("/projects");
              onClose();
            }}
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
          >
            <img src="/tool.svg" alt="Add Project" className="w-5 h-5" />
            Add a project
          </button>
          <button
            onClick={() => handleNavigate("/my_record")}
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

        <div className="mt-auto text-xs text-gray-500">
          v1.0
        </div>
      </aside>

    
    </>
  );
};

export default MyTimeSidebar;

