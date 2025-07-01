// src/pages/User/admin/components/AdminSidebar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../login/logout";
import { Clock, Wrench } from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose, onAddUser }) => {
  const nav = useNavigate();

  return (
    <>
      {/* Overlay (mobile) */}
      <div
        className={`fixed inset-0 bg-black/30 z-30 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 p-6 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Admin</h2>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700" aria-label="Close sidebar">
            ✖
          </button>
        </div>

        <nav className="flex flex-col gap-4 flex-1">
          <button
            onClick={() => { nav('/'); onClose(); }}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
          >
            <img src="/home.svg" alt="Home" className="w-5 h-5" /> Home
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

          <button
            onClick={() => { onAddUser(); onClose(); }}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
          >
            <img src="/tool.svg" alt="Add User" className="w-5 h-5" /> Add User
          </button>
        </nav>

        <button
          onClick={() => { logout(); onClose(); }}
          className="mt-auto text-left text-sm text-red-500 hover:underline"
        >
          Logout
        </button>
      </aside>
    </>
  );
};

export default AdminSidebar;