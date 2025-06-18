// src/pages/User/admin/pages/AdminPage.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";

import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import AdminTable, { AdminUser } from "../components/AdminTable";

const API = "http://localhost:8000";
const ADMIN_API = `${API}/admin/users`;

const AdminPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filtered, setFiltered] = useState<AdminUser[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "user" as "user" | "admin", user_type: "" });

  const token = localStorage.getItem("token") || "";
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get<AdminUser[]>(ADMIN_API, { headers });
      setUsers(data);
      setFiltered(data);
    } catch {
      setUsers([]);
      setFiltered([]);
    }
  };

  const handleFilter = (term: string) => {
    const t = term.toLowerCase();
    setFiltered(
      users.filter(u =>
        u.username.toLowerCase().includes(t) ||
        u.email.toLowerCase().includes(t) ||
        u.role.toLowerCase().includes(t)
      )
    );
  };

  const resetModal = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ username: "", email: "", password: "", role: "user", user_type: "" });
  };

  const openAdd = () => { resetModal(); setShowForm(true); setSidebarOpen(false); };
  const openEdit = (u: AdminUser) => { setEditing(u); setForm({ username: u.username, email: u.email, password: "", role: u.role, user_type: u.user_type || "" }); setShowForm(true); setSidebarOpen(false); };
  const handleDelete = async (id: string) => { if (!window.confirm("Delete this user?")) return; await axios.delete(`${ADMIN_API}/${id}`, { headers }); fetchUsers(); };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.role === "user" && !form.user_type) {
      alert("Select a user type.");
      return;
    }
    try {
      if (editing) {
        await axios.put(
          `${ADMIN_API}/${editing.id}`,
          { username: form.username, email: form.email, role: form.role, user_type: form.role === "user" ? form.user_type : "" },
          { headers }
        );
      } else {
        const fd = new FormData();
        fd.append("username", form.username);
        fd.append("email", form.email);
        fd.append("password", form.password);
        fd.append("role", form.role);
        if (form.role === "user") fd.append("user_type", form.user_type);
        await axios.post(ADMIN_API, fd, { headers: { ...headers, "Content-Type": "multipart/form-data" } });
      }
      resetModal();
      fetchUsers();
    } catch {}
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onAddUser={openAdd} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(o => !o)} onAddUser={openAdd} onFilter={handleFilter} />
        <main className="flex-1 overflow-auto p-6">
          <AdminTable users={filtered} onEdit={openEdit} onDelete={handleDelete} />
        </main>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">{editing ? "Edit User" : "Add User"}</h2>
            <input name="username" value={form.username} onChange={handleChange} placeholder="Username" className="w-full border rounded px-3 py-2" required />
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full border rounded px-3 py-2" required />
            {!editing && <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" className="w-full border rounded px-3 py-2" required />}
            <select name="role" value={form.role} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            {form.role === "user" && (
              <select name="user_type" value={form.user_type} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
                <option value="" disabled>-- User type --</option>
                <option value="field">Field</option>
                <option value="office">Office</option>
              </select>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetModal} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-black text-white rounded">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
