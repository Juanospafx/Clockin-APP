import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EditUser = () => {
  const userId = localStorage.getItem('user_id');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      axios.get(`http://localhost:8000/users/${userId}`).then(res => setUser(res.data));
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!userId) return;
    await axios.put(`http://localhost:8000/users/${userId}`, user);
    alert('Updated successfully');
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <input name="username" value={user.username} onChange={handleChange} className="border p-2 w-full" />
      <input name="email" value={user.email} onChange={handleChange} className="border p-2 w-full" />
      <button onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded">Update</button>
    </div>
  );
};

export default EditUser;
