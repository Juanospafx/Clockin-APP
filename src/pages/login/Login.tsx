// src/pages/Login.tsx
import React, { useState } from 'react';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/login', form, {
        headers: { 'Content-Type': 'application/json' },
      });
      const { access_token, role, user_id } = await res.json();
      localStorage.setItem('token', access_token);
      localStorage.setItem('role', role);
      localStorage.setItem('user_id', user_id);
      navigate('/');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-xl font-bold mb-6">Login to BrightClock</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          name="username"
          autoComplete="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="border p-2 w-full mb-4"
          required
        />
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="border p-2 w-full mb-4"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
