// src/pages/Home/components/Sidebar.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Home as HomeIcon,
  Clock as ClockIcon,
  Bookmark as BookmarkIcon,
  List as ListIcon,
  Check as CheckIcon,
  User as UserIcon,
} from "lucide-react";
import { logout } from "../../login/logout"; // Ajusta la ruta si tu estructura varía

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/** 1) Overlay semitransparente para cerrar en móvil cuando isOpen=true */}
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-30 z-30
          lg:hidden
          transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
      />

      {/** 2) Sidebar deslizable (se oculta con -translate-x-full) */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-8 z-40
          transform transition-transform duration-300
          lg:static lg:translate-x-0 lg:w-64 lg:h-full
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/** 2a) Encabezado interior del sidebar con logo o título pequeño */}
        <div>
          <h2 className="text-lg font-bold mb-4">BrightClock</h2>
          <nav className="flex flex-col gap-3">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
            >
              <HomeIcon size={16} />
              Home
            </Link>
            <Link
              to="/my-time"
              onClick={onClose}
              className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
            >
              <ClockIcon size={16} />
              My Time
            </Link>
            <Link
              to="/my_record"
              onClick={onClose}
              className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
            >
              <BookmarkIcon size={16} />
              My record
            </Link>
          </nav>
        </div>

        {/** 2b) Sección “Work zone” */}
        <div>
          <h2 className="text-lg font-bold mb-4">Work zone</h2>
          <nav className="flex flex-col gap-3">
            <Link
              to="/projects"
              onClick={onClose}
              className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
            >
              <ListIcon size={16} />
              Projects
            </Link>
            <Link
              to="projects_history"
              onClick={onClose}
              className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
            >
              <CheckIcon size={16} />
              Projects history
            </Link>
            <Link
              to="/user"
              onClick={onClose}
              className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
            >
              <UserIcon size={16} />
              User
            </Link>

            {/** Botón “Logout” al final */}
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="text-sm text-red-500 hover:underline mt-4"
            >
              Logout
            </button>
          </nav>
        </div>

        {/** 2c) Versión o pie de página del sidebar */}
        <div className="mt-auto text-xs text-gray-500">v1.0</div>
      </aside>
    </>
  );
};

export default Sidebar;
