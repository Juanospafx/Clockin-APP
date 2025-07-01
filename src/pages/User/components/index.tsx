import React from 'react';
import EditUser from './EditUser';

const UserView = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">My Profile</h2>
      <EditUser />
    </div>
  );
};

export default UserView;