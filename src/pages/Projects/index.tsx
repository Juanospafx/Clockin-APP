import React, { useState } from "react";
import ProjectSidebar from "./components/ProjectSidebar";
import ProjectsPage from "./components/ProjectsPage";

const Projects: React.FC = () => {
  // controla el sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // controla el modal Add/Edit
  const [showForm, setShowForm] = useState(false);

  const openAdd = () => setShowForm(true);
  const closeForm = () => setShowForm(false);

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddProject={openAdd}           // ← Pasamos openAdd
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ProjectsPage
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          showForm={showForm}             // ← Recibe el estado del modal
          onOpenForm={openAdd}            // ← Función para abrirlo
          onCloseForm={closeForm}         // ← Función para cerrarlo
        />
      </div>
    </div>
  );
};

export default Projects;
