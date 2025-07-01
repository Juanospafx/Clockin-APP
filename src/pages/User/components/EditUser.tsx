import React, { useEffect, useState, ChangeEvent } from 'react';
import { getMe, updateMe } from '../../../lib/users';

interface User {
  id: string;
  username: string;
  email: string;
  // puedes añadir aquí más campos si los devuelves (role, etc.)
}

const EditUser: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Token de auth
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return alert('No estás autenticado');
      try {
        const { data } = await getMe(token);
        setUser(data as User);
      } catch (err) {
        console.error(err);
        alert('Error al cargar tus datos');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!token) return alert('No estás autenticado');
    try {
      const formData = new FormData();
      formData.append('username', user.username.trim());
      formData.append('email', user.email.trim());
      await updateMe(token, formData);
      alert('¡Datos actualizados con éxito!');
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        alert(`Error al guardar: ${err.message}`);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (!user) return <p>No se encontró tu usuario.</p>;

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <label className="block">
        <span className="text-gray-700">Usuario</span>
        <input
          name="username"
          value={user.username}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />
      </label>

      <label className="block">
        <span className="text-gray-700">Email</span>
        <input
          name="email"
          type="email"
          value={user.email}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />
      </label>

      <button
        onClick={handleSubmit}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Guardar cambios
      </button>
    </div>
  );
};

export default EditUser;
