// src/pages/MyTime/components/TimeCartHeader.tsx
import React, { ChangeEvent, useState, useEffect } from "react";

export interface TimeCartHeaderProps {
  /** Inicial (pero luego el header lo controla) */
  searchTerm?: string;
  /** Se sigue notificando al padre si quiere usarlo */
  onSearchChange?: (term: string) => void;
  onAddClockin: () => void;
  onToggleSidebar: () => void;
}

const TimeCartHeader: React.FC<TimeCartHeaderProps> = ({
  searchTerm = "",
  onSearchChange = () => {},
  onAddClockin,
  onToggleSidebar,
}) => {
  // Estado interno para el input
  const [localTerm, setLocalTerm] = useState<string>(searchTerm);

  useEffect(() => {
    setLocalTerm(searchTerm);
  }, [searchTerm]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocalTerm(e.target.value);
    onSearchChange(e.target.value);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-4">
      <div
        className="
          grid 
          grid-rows-[auto,auto]        /* 2 filas en móvil: título + buscador */
          md:grid-rows-1               /* 1 fila en escritorio */
          md:grid-cols-[auto,1fr,auto] /* 3 columnas: título | buscador | acciones */
          gap-4 md:gap-8
          items-center
        "
      >
        {/** 1️⃣ Título + hamburguesa en móvil */}
        <div className="flex items-center">
          <button
            className="md:hidden mr-2 p-2 rounded hover:bg-gray-100 transition"
            onClick={onToggleSidebar}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <h1 className="text-xl md:text-2xl font-semibold">Time Cart</h1>
        </div>

        {/** 2️⃣ Buscador */}
        <div>
          <div className="relative">
            <img
              src="/search.svg"
              alt="Search"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-70 pointer-events-none"
            />
            <input
              type="text"
              value={localTerm}
              onChange={handleInputChange}
              placeholder="Search time cart..."
              className="
                block w-full
                pl-12 pr-4 py-2
                bg-gray-50 border border-gray-200
                rounded-lg shadow-sm
                text-sm md:text-base
                focus:ring-2 focus:ring-indigo-500
                outline-none
              "
            />
          </div>
        </div>

        {/** 3️⃣ Botón Add */}
        <div className="flex items-center justify-end">
          <button
            onClick={onAddClockin}
            className="
              bg-black text-white
              px-4 py-2
              rounded-lg shadow-sm
              hover:opacity-90 transition
              text-sm md:text-base
              whitespace-nowrap
            "
          >
            Add a Clockin
          </button>
        </div>
      </div>
    </header>
  );
};

export default TimeCartHeader;
