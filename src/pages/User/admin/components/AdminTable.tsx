// src/components/AdminTable.tsx
import React, { FC } from "react";
import { Pencil, Trash2 } from "lucide-react";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: "admin" | "office" | "field";
  created_at: string;
}

interface AdminTableProps {
  users?: AdminUser[];
  /** Ahora recibimos sólo el id al editar */
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const AdminTable: FC<AdminTableProps> = ({ users = [], onEdit, onDelete }) => (
  <div className="w-full">

    {/** Cards para pantallas pequeñas */}  
    <div className="block md:hidden space-y-4 p-4">
      {users.map(u => (
        <div
          key={u.id}
          className="border rounded-lg p-4 shadow-sm bg-white"
        >
          <p><strong>ID:</strong> {u.id.slice(0,6)}</p>
          <p><strong>Username:</strong> {u.username}</p>
          <p><strong>Email:</strong> {u.email}</p>
          <p><strong>Role:</strong> {u.role}</p>
          <p><strong>Joined:</strong> {new Date(u.created_at).toLocaleDateString()}</p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => onEdit(u.id)}
              className="p-1 bg-yellow-100 hover:bg-yellow-200 rounded"
            >
              <Pencil size={16} className="text-yellow-700" />
            </button>
            <button
              onClick={() => onDelete(u.id)}
              className="p-1 bg-red-100 hover:bg-red-200 rounded"
            >
              <Trash2 size={16} className="text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </div>

    {/** Table para pantallas md+ */}  
    <div className="hidden md:block overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Joined</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map(u => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-mono text-gray-700">{u.id.slice(0,6)}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{u.username}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
              <td className="px-4 py-3 text-sm capitalize text-gray-700">{u.role}</td>
              <td className="px-4 py-3 text-sm text-gray-700 text-right">
                {new Date(u.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 text-right space-x-2">
                <button
                  onClick={() => onEdit(u.id)}
                  className="p-1 bg-yellow-100 hover:bg-yellow-200 rounded"
                >
                  <Pencil size={16} className="text-yellow-700" />
                </button>
                <button
                  onClick={() => onDelete(u.id)}
                  className="p-1 bg-red-100 hover:bg-red-200 rounded"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminTable;
