// src/pages/User/components/UserSidebar.tsx
import React from "react";
import { Link } from "react-router-dom";
import { logout } from "../../login/logout";

export interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ isOpen, onClose }) => (
  <>
    {/* Overlay mobile */}
    <div
      className={`fixed inset-0 bg-black/30 z-30 md:hidden transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    />

    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 p-4 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div>
        <h2 className="text-lg font-bold mb-4">My Profile</h2>
        <nav className="flex flex-col gap-3">
          <Link
            to="/"
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
            onClick={onClose}
          >
            <img src="/home.svg" alt="Home" className="w-5 h-5" /> Home
          </Link>
          <Link
            to="/my-time"
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
            onClick={onClose}
          >
            <img src="/clock.svg" alt="My Time" className="w-5 h-5" /> My Time
          </Link>
          <Link
            to="/my-record"
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
            onClick={onClose}
          >
            <img src="/record.svg" alt="My Record" className="w-5 h-5" /> My Record
          </Link>
          <Link
            to="/projects"
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
            onClick={onClose}
          >
            <img src="/list.svg" alt="Projects" className="w-5 h-5" /> Projects
          </Link>
          <Link
            to="/projects-history"
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
            onClick={onClose}
          >
            <img src="/check.svg" alt="Projects History" className="w-5 h-5" /> Projects History
          </Link>
    
        </nav>
      </div>

      <div>


        <button
          onClick={() => { logout(); onClose(); }}
          className="mt-6 w-full text-left text-sm text-red-500 hover:underline"
          aria-label="Logout"
        >
          Logout
        </button>
      </div>
    </aside>
  </>
);

export default UserSidebar;