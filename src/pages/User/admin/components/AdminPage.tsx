import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { getUsers, saveUser, deleteUser, changePassword } from "../../../../lib/adminUsers";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import AdminTable, { AdminUser as User } from "../components/AdminTable";


const AdminPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);

  // — Modal Añadir/Editar —
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "field" as User["role"],
  });

  // — Modal Cambiar contraseña —
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdUserId, setPwdUserId] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");

  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  async function fetchUsers() {
    try {
      const { data } = await getUsers();
      setUsers(data);
      setFiltered(data);
    } catch (err) {
      console.error("Error fetching users", err);
    }
  }

  function handleFilter(term: string) {
    const t = term.toLowerCase();
    setFiltered(
      users.filter(u =>
        [u.username, u.email, u.role]
          .some(f => f.toLowerCase().includes(t))
      )
    );
  }

  function resetForm() {
    setEditing(null);
    setForm({ username: "", email: "", password: "", role: "field" });
  }

  function openAdd() {
    resetForm();
    setShowForm(true);
    setSidebarOpen(false);
  }

  function openEdit(id: string) {
    const u = users.find(x => x.id === id);
    if (!u) return;
    setEditing(u);
    setForm({
      username: u.username,
      email: u.email,
      password: "",
      role: u.role,
    });
    setShowForm(true);
    setSidebarOpen(false);
  }

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) {
      return alert("Usuario y email son obligatorios");
    }

    // Armar payload sin user_type
    const payload: any = {
      username: form.username.trim(),
      email: form.email.trim(),
      role: form.role,
    };
    if (!editing || form.password.trim()) {
      payload.password = form.password.trim();
    }

    try {
      if (editing) {
        await saveUser(editing.id, payload);
      } else {
        await saveUser(null, payload);
      }
      setShowForm(false);
      fetchUsers();
    } catch (err: any) {
      console.error("Error saving user:", err);
      const msg = err.response?.data?.detail || err.message;
      alert(`No se pudo guardar el usuario: ${msg}`);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Borrar este usuario?")) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user", err);
      alert("No se pudo borrar el usuario");
    }
  }

  function openPwdModal(id: string) {
    setPwdUserId(id);
    setNewPassword("");
    setShowPwdModal(true);
    setSidebarOpen(false);
  }

  async function handlePwdSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newPassword.trim()) return alert("Ingresa nueva contraseña");
    try {
      await changePassword(pwdUserId, newPassword.trim());
      setShowPwdModal(false);
      alert("Contraseña actualizada");
    } catch (err) {
      console.error("Error changing password:", err);
      alert("No se pudo cambiar la contraseña");
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

        <main className="flex-1 overflow-auto p-6">
          <AdminTable
            users={filtered}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </main>
      </div>

      {/* Modal Crear/Editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            key={editing ? `edit-${editing.id}` : "add-user"}
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4"
          >
            <h2 className="text-xl font-semibold">
              {editing ? "Editar usuario" : "Añadir usuario"}
            </h2>

            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Usuario"
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

            {!editing && (
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Contraseña"
                className="w-full border rounded px-3 py-2"
                required
              />
            )}

            {editing && (
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
                  onClick={() => openPwdModal(editing.id)}
                >
                  You forgot your password?
                </p>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Nueva contraseña (opcional)"
                  className="w-full border rounded px-3 py-2"
                />
              </>
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

      {/* Modal Cambiar contraseña */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handlePwdSubmit}
            className="bg-white p-6 rounded shadow-lg w-full max-w-sm space-y-4"
          >
            <h2 className="text-xl font-semibold">Cambiar contraseña</h2>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPwdModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
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

export default AdminPage;
