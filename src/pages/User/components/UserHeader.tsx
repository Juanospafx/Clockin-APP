// src/pages/User/components/UserHeader.tsx
import React from "react";

export interface UserHeaderProps {
  onAddUser: () => void;
  onToggleSidebar?: () => void;
}

const UserHeader: React.FC<UserHeaderProps> = ({ onAddUser, onToggleSidebar }) => (
  <div className="w-full px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-white">
    <div className="flex items-center gap-4">
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="md:hidden p-2 rounded hover:bg-gray-100"
        >
          <svg
            className="w-6 h-6 text-black"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      <h2 className="text-xl font-semibold text-black">My Profile</h2>
    </div>

    <button
      onClick={onAddUser}
      className="px-4 py-2 bg-black text-white rounded hover:opacity-90 text-sm"
    >
      Edit Profile
    </button>
  </div>
);

export default UserHeader;
