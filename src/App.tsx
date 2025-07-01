// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/global.css";

import Dashboard      from "./pages/Home/Dashboard";
import MyTime         from "./pages/MyTime";
import Clockin        from "./pages/MyTime/components/Clockin";
import MyRecord       from "./pages/MyRecord";

import User           from "./pages/User/User";
import AdminPage      from "./pages/User/admin/components/AdminPage";

import Login          from "./pages/login/Login";
import PrivateRoute   from "./pages/login/components/PrivateRoute";

// IMPORTAR el contenedor de Projects (que incluye sidebar + ProjectsPage)
import Projects       from "./pages/Projects";   

// IMPORTAR History (asumiendo que src/pages/ProjectHistory/index.tsx existe)
import ProjectHistory from "./pages/ProjectHistory";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* My Time */}
          <Route
            path="/my-time"
            element={
              <PrivateRoute>
                <MyTime />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-time/clockin"
            element={
              <PrivateRoute>
                <Clockin />
              </PrivateRoute>
            }
          />

          {/* My Record */}
          <Route
            path="/my_record"
            element={
              <PrivateRoute>
                <MyRecord />
              </PrivateRoute>
            }
          />

          {/* Projects: usar el contenedor Projects */}
          <Route
            path="/projects"
            element={
              <PrivateRoute>
                <Projects />
              </PrivateRoute>
            }
          />

          {/* Project History */}
          <Route
            path="/projects_history"
            element={
              <PrivateRoute>
                <ProjectHistory />
              </PrivateRoute>
            }
          />

          {/* User Profile */}
          <Route
            path="/user"
            element={
              <PrivateRoute>
                <User />
              </PrivateRoute>
            }
          />

          {/* Admin Page */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminPage />
              </PrivateRoute>
            }
          />

          {/* Catch all → Dashboard */}
          <Route
            path="*"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
