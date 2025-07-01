// src/pages/User/UserPage.tsx

import React, { useState, useEffect, FormEvent } from "react";
import {
  getMe,
  updateMe,
  changeMyPassword,
} from "../../../lib/users";
import UserHeader from "./UserHeader";
import UserSidebar from "../components/UserSidebar";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  profile_photo?: string | null;
}

import api from "../../../lib/api";
const API_BASE = api.defaults.baseURL || "";

const UserPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [form, setForm] = useState({ username: "", email: "" });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    getMe(token)
      .then(({ data }) => {
        setUser(data as User);
        setForm({ username: data.username, email: data.email });
      })
      .catch(console.error);
  }, [token]);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return alert("No token");

    const data = new FormData();
    data.append("username", form.username);
    data.append("email", form.email);
    if (profilePhoto) data.append("profile_photo", profilePhoto);

    try {
      const { data: updated } = await updateMe(token, data);
      setUser(updated);
      setShowProfileForm(false);
      setProfilePhoto(null);
    } catch {
      alert("Failed to update profile");
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return alert("New passwords do not match");
    }
    try {
      await changeMyPassword(token, {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      alert("Password changed successfully");
      setShowPasswordForm(false);
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      console.error("Error changing password:", err);
      alert("Error changing password");
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <UserHeader
          onAddUser={() => setShowProfileForm(true)}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex-1 flex justify-center items-center p-6">
          {user ? (
            <div className="relative max-w-md w-full rounded-lg p-8 shadow-md">
              <h2 className="text-2xl font-bold mb-4">My Profile</h2>
              <img
                src={
                  user.profile_photo
                    ? `${API_BASE}/uploads/profile_photos/${user.profile_photo}`
                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="Profile"
                className="rounded-full w-32 h-32 object-cover mb-4 mx-auto"
              />
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Change Password?
              </button>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </main>

        {/* Edit Profile Modal */}
        {showProfileForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <form
              onSubmit={handleProfileSubmit}
              className="bg-white p-6 rounded shadow-lg w-full max-w-sm space-y-4"
            >
              <h2 className="text-xl font-semibold">Edit Profile</h2>
              <label>
                Username
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </label>
              <label>
                Profile Photo
                <input
                  name="profile_photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && setProfilePhoto(e.target.files[0])}
                  className="w-full"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileForm(false);
                    setProfilePhoto(null);
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <form
              onSubmit={handlePasswordSubmit}
              className="bg-white p-6 rounded shadow-lg w-full max-w-sm space-y-4"
            >
              <h2 className="text-xl font-semibold">Change Password</h2>
              <label>
                Current Password
                <input
                  type="password"
                  value={passwordForm.old_password}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, old_password: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </label>
              <label>
                New Password
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, new_password: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </label>
              <label>
                Confirm New Password
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, confirm_password: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">
                  Change
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPage;
