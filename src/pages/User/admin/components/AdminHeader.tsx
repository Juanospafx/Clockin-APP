// src/pages/User/admin/components/AdminHeader.tsx
import React, { useState, ChangeEvent } from "react";
import { Filter, Menu } from "lucide-react";

export interface AdminHeaderProps {
  onFilter: (term: string) => void;
  onAddUser: () => void;
  onToggleSidebar: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onFilter, onAddUser, onToggleSidebar }) => {
  const [term, setTerm] = useState("");

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 lg:p-6">
      {/* Row 1: Hamburger, Title, Add */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded hover:bg-gray-100"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl lg:text-2xl font-semibold flex-1 text-center lg:text-left">
          User List
        </h1>
        <button
          onClick={onAddUser}
          className="bg-black text-white px-4 py-2 rounded-lg shadow-sm hover:opacity-90 transition text-sm lg:text-base"
        >
          Add User
        </button>
      </div>

      {/* Row 2: Search + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 transition px-4 py-2 flex-1">
          <img src="/search.svg" alt="Search" className="w-5 h-5 opacity-70" />
          <input
            type="text"
            value={term}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTerm(e.target.value)}
            placeholder="Search users..."
            className="bg-transparent outline-none text-sm flex-1 placeholder-gray-500"
          />
        </div>
        <button
          onClick={() => onFilter(term)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition text-sm sm:w-auto w-full"
        >
          <Filter size={16} className="opacity-70" />
          <span>Filter</span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;