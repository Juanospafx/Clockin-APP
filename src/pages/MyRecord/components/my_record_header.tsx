// src/pages/User/admin/components/MyRecordHeader.tsx
import React, { ChangeEvent } from "react";

export interface MyRecordHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onExportExcel: () => void;
  onToggleSidebar: () => void;
  isAdmin: boolean;
}

const MyRecordHeader: React.FC<MyRecordHeaderProps> = ({
  searchTerm,
  onSearchChange,
  onExportExcel,
  onToggleSidebar,
  isAdmin,
}) => {
  const title = isAdmin ? "All user record" : "My Record";

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-4 lg:px-16 lg:py-6">
      <div
        className="
          grid
          grid-rows-[auto,auto,auto]      /* móvil: 3 filas */
          lg:grid-rows-1                  /* desktop: 1 fila */
          lg:grid-cols-[auto,1fr,auto]    /* desktop: 3 columnas */
          gap-4 lg:gap-8
          items-center
        "
      >
        {/* fila 1 / col 1 */}
        <div className="flex items-center justify-start"> {/* <- aquí */}
          <button
            className="lg:hidden mr-2 p-2 rounded hover:bg-gray-100 transition"
            onClick={onToggleSidebar}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <h1 className="text-xl lg:text-2xl font-semibold">{title}</h1>
        </div>

        {/* fila 2 / col 2 */}
        <div>
          <div className="relative">
            <img
              src="/search.svg"
              alt="Search"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-70 pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onSearchChange(e.target.value)
              }
              placeholder="Search records..."
              className="
                block w-full
                pl-12 pr-4 py-2
                bg-gray-50 border border-gray-200
                rounded-lg shadow-sm
                text-sm lg:text-base
                focus:ring-2 focus:ring-indigo-500
                outline-none
              "
            />
          </div>
        </div>

        {/* fila 3 / col 3 */}
        <div className="flex items-center justify-end">
          <button
            onClick={onExportExcel}
            className="
              bg-black text-white
              px-4 py-2
              rounded-lg shadow-sm
              hover:opacity-90 transition
              text-sm lg:text-base
              whitespace-nowrap
            "
          >
            Export to Excel
          </button>
        </div>
      </div>
    </header>
  );
};

export default MyRecordHeader;
