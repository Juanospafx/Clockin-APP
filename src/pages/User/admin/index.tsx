// src/pages/User/AdminUser.tsx
import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";

import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import AdminTable, { AdminUser as User } from "./components/AdminTable";

interface FormState {
  username: string;
  email: string;
  password: string;
  role: "admin" | "field" | "office";
  user_type?: string;
}

const API_BASE = "http://localhost:8000";
const ADMIN_API = `${API_BASE}/admin/users`;

const AdminUser: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    role: "field",
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await axios.get<User[]>(ADMIN_API, { headers });
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  const handleFilter = (term: string) => {
    const t = term.toLowerCase();
    setFilteredUsers(
      users.filter(u => u.username.toLowerCase().includes(t) || u.email.toLowerCase().includes(t) || u.role.toLowerCase().includes(t))
    );
  };

  const openAdd = () => {
    setEditingUserId(null);
    setForm({ username: "", email: "", password: "", role: "field" });
    setShowForm(true);
    setSidebarOpen(false);
  };

  const openEdit = (id: string) => {
    const u = users.find(x => x.id === id);
    if (!u) return;
    setEditingUserId(id);
    setForm({ username: u.username, email: u.email, password: "", role: u.role, user_type: (u as any).user_type });
    setShowForm(true);
    setSidebarOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Borrar este usuario?")) return;
    try {
      await axios.delete(`${ADMIN_API}/${id}`, { headers });
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user", err);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value } as FormState));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const data = new FormData();
    data.append("username", form.username);
    data.append("email", form.email);
    data.append("role", form.role);
    if (!editingUserId) data.append("password", form.password);
    if (form.user_type) data.append("user_type", form.user_type);

    try {
      if (editingUserId) {
        await axios.put(`${ADMIN_API}/${editingUserId}`, data, { headers });
      } else {
        await axios.post(ADMIN_API, data, { headers: { ...headers, "Content-Type": "multipart/form-data" } });
      }
      setShowForm(false);
      setEditingUserId(null);
      fetchUsers();
    } catch (err) {
      console.error("Error saving user", err);
    }
  };

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

        <main className="flex-1 overflow-auto p-8">
          <AdminTable
            users={filteredUsers}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </main>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">
              {editingUserId ? "Edit User" : "Add User"}
            </h2>

            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Username"
              className="w-full border rounded px-3 py-2"
              required
            />

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full border rounded px-3 py-2"
              required
            />

            {!editingUserId && (
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full border rounded px-3 py-2"
                required
              />
            )}

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="admin">Admin</option>
              <option value="field">Field</option>
              <option value="office">Office</option>
            </select>

            {form.role === "user" && (
              <select
                name="user_type"
                value={form.user_type}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="" disabled>-- User Type --</option>
                <option value="field">Field</option>
                <option value="office">Office</option>
              </select>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingUserId(null); }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminUser;
