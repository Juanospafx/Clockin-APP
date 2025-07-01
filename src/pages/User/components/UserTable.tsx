import React, { useState } from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  avatarUrl?: string;
}

interface UserTableProps {
  user: User;
  onSave: (updatedUser: Partial<User>) => void;
}

const UserTable: React.FC<UserTableProps> = ({ user, onSave }) => {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    onSave(form);
    setEditMode(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded shadow p-6">
      <div className="flex flex-col items-center space-y-4 mb-6">
        <img
          src={
            form.avatarUrl ||
            "https://www.gravatar.com/avatar/?d=mp&f=y&s=120"
          }
          alt="User Avatar"
          className="w-32 h-32 rounded-full border border-gray-300 object-cover"
        />
        {editMode && (
          <input
            name="avatarUrl"
            value={form.avatarUrl}
            onChange={handleChange}
            placeholder="Avatar URL"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        )}
      </div>

      <div className="space-y-4">
        <div>
          <strong>ID:</strong> {user.id}
        </div>

        <div>
          <strong>Username:</strong>{" "}
          {editMode ? (
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-1 w-full"
            />
          ) : (
            user.username
          )}
        </div>

        <div>
          <strong>Email:</strong>{" "}
          {editMode ? (
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-1 w-full"
            />
          ) : (
            user.email
          )}
        </div>

        <div>
          <strong>Role:</strong>{" "}
          <span className="capitalize">{user.role}</span>
        </div>

        <div>
          <strong>Created:</strong>{" "}
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {editMode ? (
          <>
            <button
              onClick={() => setEditMode(false)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 bg-black text-white rounded hover:opacity-90"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default UserTable;
