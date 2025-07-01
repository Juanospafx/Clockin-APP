import React from 'react';
import AdminUser from './admin'; // Admin dashboard view
import UsersPage from "./components/UserPage";

const User = () => {
  const role = localStorage.getItem('role'); // Still assuming your auth is as secure as a soggy tortilla

  return role === 'admin' ? <AdminUser /> : <UsersPage />;
};

export default User;
