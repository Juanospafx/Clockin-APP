// src/pages/Projects/components/ProjectHeader.tsx
import React, { ChangeEvent } from "react";
import { Filter } from "lucide-react";

interface Props {
  searchTerm: string;
  onSearchChange: (s: string) => void;
  onFilter: () => void;
  onAddProject: () => void;
  onToggleSidebar: () => void;
  isAdmin: boolean;             // ← Nueva prop
}

const ProjectHeader: React.FC<Props> = ({
  searchTerm,
  onSearchChange,
  onFilter,
  onAddProject,
  onToggleSidebar,
  isAdmin,                      // ← Desestructuramos aquí
}) => {
  return (
    <div
      className={`
        bg-white text-gray-800
        h-[8.375rem]
        sticky top-0 z-10
        px-4 py-4 lg:px-16 lg:py-6
        flex flex-col
      `}
    >
      {/** === FILA 1: hamburguesa + título + botón Add a project (solo admin) === */}
      <div className="flex items-center w-full mb-4 lg:mb-2">
        <button
          className="lg:hidden mr-4 p-2 rounded hover:bg-gray-100"
          onClick={onToggleSidebar}
          aria-label="Abrir menú"
        >
          ☰
        </button>

        <h1 className="text-xl lg:text-2xl font-semibold flex-1">
          Project cart
        </h1>

        {/** Solo mostramos Add a project si es admin */}
        {isAdmin && (
          <button
            onClick={onAddProject}
            className="
              bg-black text-white
              px-4 py-2
              rounded-lg shadow-sm
              hover:opacity-90 transition
              text-sm lg:text-base
            "
          >
            Add a project
          </button>
        )}
      </div>

      {/** === FILA 2: buscador + botón Filter === */}
      <div className="flex items-center w-full gap-4">
        <div
          className={`
            flex items-center gap-2
            bg-gray-50 border border-gray-200 rounded-lg shadow-sm
            hover:bg-gray-100 transition
            px-4 py-2
            w-full sm:w-auto
          `}
        >
          <img
            src="/search.svg"
            alt="Search"
            className="w-6 h-6 opacity-70"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onSearchChange(e.target.value)
            }
            placeholder="Search project..."
            className="bg-transparent outline-none text-sm flex-1 placeholder-gray-500"
          />
        </div>

        <button
          onClick={onFilter}
          className={`
            flex items-center gap-2
            px-4 py-2
            bg-white border border-gray-200 rounded-lg shadow-sm
            hover:bg-gray-50 transition
            w-full sm:w-auto
          `}
        >
          <Filter size={20} className="opacity-70" />
        </button>
      </div>
    </div>
  );
};

export default ProjectHeader;
