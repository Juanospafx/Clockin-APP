// src/pages/Projects/components/ProjectsPage.tsx

import React, { useState, useEffect, ChangeEvent } from "react";
import {
  getProjects as fetchProjects,
  deleteProject,
  updateProject,
  createProject,
} from "../../../lib/projects";
import { getMe } from "../../../lib/users";
import dayjs from "dayjs";

import ProjectHeader from "../components/ProjectHeader";
import ProjectTable, { Project } from "../components/ProjectTable";
import MapContainer from "../components/MapContainer";

interface ProjectFromApi {
  id: string;
  name: string;
  description?: string;
  state?: string;
  city?: string;
  street?: string;
  street_number?: string;
  postal_code?: string;
  location_lat?: number;
  location_long?: number;
  status: "start" | "in_progress" | "finished";
  start_date: string;
  end_date?: string;
  created_at: string;
}

interface UserMe {
  id: string;
  username: string;
  role: "admin" | "office" | "field";
}

interface Props {
  onToggleSidebar: () => void;
}

const ProjectsPage: React.FC<Props> = ({ onToggleSidebar }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    state: "",
    city: "",
    street: "",
    street_number: "",
    postal_code: "",
    status: "start" as "start" | "in_progress" | "finished",
    start_date: "",
    end_date: "",
  });
  const [coords, setCoords] = useState({ lat: 18.4861, lng: -69.9312 });

  const token = localStorage.getItem("token");

  // 0) Obtener rol de usuario
  useEffect(() => {
    if (!token) return;
    getMe(token)
      .then(({ data }) => setIsAdmin(data.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, [token]);

  // 1) Cargar todos los proyectos
  useEffect(() => {
    if (!token) return;
    fetchProjects(token)
      .then(({ data }) => {
        const mapped = data.map((p) => ({
          id: p.id,
          projectName: p.name,
          postalCode: p.postal_code || "—",
          status: p.status,
          startDate: dayjs(p.start_date).format("DD/MM/YYYY"),
          endDate: p.end_date ? dayjs(p.end_date).format("DD/MM/YYYY") : "—",
        }));
        setProjects(mapped);
        setFiltered(mapped);
      })
      .catch(console.error);
  }, [token]);

  // 2) Filtrar en la tabla
  const handleFilter = () => {
    const term = searchTerm.toLowerCase().trim();
    setFiltered(
      term
        ? projects.filter((p) =>
            [p.projectName, p.postalCode, p.status, p.startDate, p.endDate].some((f) =>
              f.toLowerCase().includes(term)
            )
          )
        : projects
    );
  };

  // 3) Abrir modal para crear
  const handleAdd = () => {
    setEditingProject(null);
    setForm({
      name: "",
      description: "",
      state: "",
      city: "",
      street: "",
      street_number: "",
      postal_code: "",
      status: "start",
      start_date: "",
      end_date: "",
    });
    setCoords({ lat: 18.4861, lng: -69.9312 });
    setShowForm(true);
  };

  // 4) Abrir modal para editar
  const handleEdit = (p: Project) => {
    setEditingProject(p);
    setForm({
      name: p.projectName,
      description: "",
      state: "",
      city: "",
      street: "",
      street_number: "",
      postal_code: p.postalCode === "—" ? "" : p.postalCode,
      status: p.status as any,
      start_date: dayjs(p.startDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
      end_date:
        p.endDate && p.endDate !== "—"
          ? dayjs(p.endDate, "DD/MM/YYYY").format("YYYY-MM-DD")
          : "",
    });
    setShowForm(true);
  };

  // 5) Borrar proyecto
  const handleDelete = async (id: string) => {
    if (!token) return;
    await deleteProject(token!, id);
    const { data } = await fetchProjects(token!);
    const mapped = data.map((p) => ({
      id: p.id,
      projectName: p.name,
      postalCode: p.postal_code || "—",
      status: p.status,
      startDate: dayjs(p.start_date).format("DD/MM/YYYY"),
      endDate: p.end_date ? dayjs(p.end_date).format("DD/MM/YYYY") : "—",
    }));
    setProjects(mapped);
    setFiltered(mapped);
  };

  // 6) Enviar formulario (crear o editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const payload: any = {
      name: form.name,
      description: form.description,
      state: form.state,
      city: form.city,
      street: form.street,
      street_number: form.street_number,
      postal_code: form.postal_code,
      location_lat: coords.lat,
      location_long: coords.lng,
      status: form.status,
    };
    if (form.start_date && dayjs(form.start_date, "YYYY-MM-DD", true).isValid()) {
      payload.start_date = dayjs(form.start_date).toISOString();
    }
    if (form.end_date && dayjs(form.end_date, "YYYY-MM-DD", true).isValid()) {
      payload.end_date = dayjs(form.end_date).toISOString();
    }

    if (editingProject) {
      await updateProject(token!, editingProject.id, payload);
    } else {
      await createProject(token!, payload);
    }

    // recargar lista
    const { data: data2 } = await fetchProjects(token!);
    const mapped2 = data2.map((p) => ({
      id: p.id,
      projectName: p.name,
      postalCode: p.postal_code || "—",
      status: p.status,
      startDate: dayjs(p.start_date).format("DD/MM/YYYY"),
      endDate: p.end_date ? dayjs(p.end_date).format("DD/MM/YYYY") : "—",
    }));
    setProjects(mapped2);
    setFiltered(mapped2);
    setShowForm(false);
  };

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header: recibe isAdmin para ocultar el botón de Add */}
      <ProjectHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFilter={handleFilter}
        onAddProject={handleAdd}
        onToggleSidebar={onToggleSidebar}
        isAdmin={isAdmin}
      />

      {/* Tabla de proyectos */}
      <div className="flex-1 overflow-auto p-4">
        <ProjectTable
          projects={filtered}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isAdmin={isAdmin}
        />
      </div>

      {/* Modal: crear / editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded shadow-lg w-full max-w-lg space-y-4"
          >
            <h2 className="text-xl font-semibold">
              {editingProject ? "Edit Project" : "Add Project"}
            </h2>

            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={onChange}
              className="w-full p-2 border rounded"
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={onChange}
              className="w-full p-2 border rounded"
              rows={3}
            />

            <div className="h-56 w-full border rounded overflow-hidden">
              <MapContainer
                onLocationSelect={(lat, lng) => setCoords({ lat, lng })}
                onAddressSelect={({ state, city, street, street_number, postal_code }) =>
                  setForm((f) => ({
                    ...f,
                    state,
                    city,
                    street,
                    street_number,
                    postal_code,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                name="state"
                placeholder="State"
                value={form.state}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
              <input
                name="postal_code"
                placeholder="Postal Code"
                value={form.postal_code}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                name="city"
                placeholder="City"
                value={form.city}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
              <input
                name="street"
                placeholder="Street"
                value={form.street}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                name="street_number"
                placeholder="Street Number"
                value={form.street_number}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
              <select
                name="status"
                value={form.status}
                onChange={onChange}
                className="w-full p-2 border rounded"
              >
                <option value="start">Start</option>
                <option value="in_progress">In Progress</option>
                <option value="finished">Finished</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col">
                Start Date
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={onChange}
                  className="w-full p-2 border rounded"
                  required={!editingProject}
                />
              </label>
              <label className="flex flex-col">
                End Date
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={onChange}
                  className="w-full p-2 border rounded"
                  disabled={form.status !== "finished"}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
