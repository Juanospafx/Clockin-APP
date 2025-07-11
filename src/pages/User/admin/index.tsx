// src/pages/User/admin/pages/AdminUser.tsx

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import {
  adminGetUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
} from "../../../lib/users";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import AdminTable, { AdminUser as User } from "./components/AdminTable";
import UserMap from "../../Home/components/UserMap";


const AdminUser: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Estado del formulario
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "field" as User["role"],
  });
  const [showPwdSection, setShowPwdSection] = useState(false);

  const token = localStorage.getItem("token") || "";

  const fetchUsers = React.useCallback(async () => {
    try {
      const { data } = await adminGetUsers(token);
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Error fetching users", err);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, fetchUsers]);

  function handleFilter(term: string) {
    const t = term.toLowerCase();
    setFilteredUsers(
      users.filter(u =>
        [u.username, u.email, u.role]
          .some(f => f.toLowerCase().includes(t))
      )
    );
  }

  function openAdd() {
    setEditingUser(null);
    setForm({ username: "", email: "", password: "", role: "field" });
    setShowPwdSection(false);
    setShowForm(true);
    setSidebarOpen(false);
  }

  function openEdit(id: string) {
    const u = users.find(x => x.id === id);
    if (!u) return;
    setEditingUser(u);
    setForm({
      username: u.username,
      email: u.email,
      password: "",
      role: u.role,
    });
    setShowPwdSection(false);
    setShowForm(true);
    setSidebarOpen(false);
  }

  function handleChangeForm(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmitForm(e: FormEvent) {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) {
      return alert("Usuario y email son obligatorios");
    }

    const payload: Record<string, unknown> = {
      username: form.username.trim(),
      email: form.email.trim(),
      role: form.role,
    };
    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    try {
      if (editingUser) {
        await adminUpdateUser(token, editingUser.id, payload);
      } else {
        await adminCreateUser(token, payload);
      }
      setShowForm(false);
      fetchUsers();
    } catch (err: unknown) {
      console.error("Error saving user:", err);
      if (err instanceof Error) {
        alert(`No se pudo guardar el usuario: ${err.message}`);
      } else {
        alert("An unknown error occurred");
      }
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Borrar este usuario?")) return;
    try {
      await adminDeleteUser(token, id);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user", err);
      alert("No se pudo borrar el usuario");
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddUser={openAdd}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          onAddUser={openAdd}
          onFilter={handleFilter}
        />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <AdminTable
            users={filteredUsers}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">User Locations</h2>
            <UserMap />
          </div>
        </main>
      </div>

      {/* Modal Crear / Editar Usuario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            // <-- Aquí está el truco: cambiamos el key según modo
            key={editingUser ? `edit-${editingUser.id}` : "add-user"}
            onSubmit={handleSubmitForm}
            className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4"
          >
            <h2 className="text-xl font-semibold">
              {editingUser ? "Editar Usuario" : "Añadir Usuario"}
            </h2>

            {/* Usuario */}
            <input
              name="username"
              value={form.username}
              onChange={handleChangeForm}
              placeholder="Usuario"
              className="w-full border rounded px-3 py-2"
              required
            />

            {/* Email */}
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChangeForm}
              placeholder="Email"
              className="w-full border rounded px-3 py-2"
              required
            />

            {/* En modo editar mostramos la sección de password actual + enlace */}
            {editingUser && (
              <>
                <label className="block text-sm font-medium">Contraseña actual</label>
                <input
                  type="text"
                  value="********"
                  disabled
                  className="w-full border rounded px-3 py-2 bg-gray-100 mb-2"
                />
                <p
                  className="text-blue-600 text-sm cursor-pointer hover:underline mb-4"
                  onClick={() => setShowPwdSection(s => !s)}
                >
                  You forgot your password?
                </p>
              </>
            )}

            {/* Input de contraseña nueva (o contraseña de creación) */}
            {!editingUser ? (
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChangeForm}
                placeholder="Contraseña"
                required
                className="w-full border rounded px-3 py-2"
              />
            ) : (
              showPwdSection && (
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChangeForm}
                  placeholder="Nueva contraseña"
                  className="w-full border rounded px-3 py-2"
                />
              )
            )}

            {/* Role */}
            <select
              name="role"
              value={form.role}
              onChange={handleChangeForm}
              className="w-full border rounded px-3 py-2"
            >
              <option value="admin">Admin</option>
              <option value="field">Field</option>
              <option value="office">Office</option>
            </select>

            {/* Botones */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminUser;
