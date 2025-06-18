// src/pages/Projects/components/ProjectTable.tsx

import React, { FC } from "react";
import { Pencil, Trash2 } from "lucide-react";

export interface Project {
  id: string;
  projectName: string;
  postalCode: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface Props {
  projects?: Project[];
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

const ProjectTable: FC<Props> = ({
  projects = [],
  onEdit,
  onDelete,
  isAdmin,
}) => {
  // Define columnas de grid para desktop
  const headerCols = isAdmin
    ? "grid-cols-[2fr_2fr_2fr_2fr_2fr_4rem]"
    : "grid-cols-[2fr_2fr_2fr_2fr_2fr]";
  const rowCols = headerCols;

  return (
    <div className="w-full">

      {/** DESKTOP / TABLE GRID */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[48rem]">
          {/* Header */}
          <div
            className={`grid ${headerCols} gap-4 px-4 py-2 font-medium border-b border-gray-200 bg-white text-gray-600 text-sm`}
          >
            <span>Project Name</span>
            <span>Postal Code</span>
            <span>Status</span>
            <span>Start Date</span>
            <span>End Date</span>
            {isAdmin && <div className="text-right">Actions</div>}
          </div>

          {/* Rows */}
          {projects.length > 0 ? (
            projects.map((p) => (
              <div
                key={p.id}
                className={`grid ${rowCols} gap-4 px-4 py-3 items-center border-b border-gray-100 hover:bg-gray-50 text-sm`}
              >
                <span className="truncate">{p.projectName}</span>
                <span>{p.postalCode || "—"}</span>
                <span>{p.status}</span>
                <span>{p.startDate}</span>
                <span>{p.endDate}</span>
                {isAdmin && (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(p)}
                      className="p-1 bg-yellow-100 hover:bg-yellow-200 rounded"
                    >
                      <Pencil size={16} className="text-yellow-700" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.projectName}"?`)) {
                          onDelete(p.id);
                        }
                      }}
                      className="p-1 bg-red-100 hover:bg-red-200 rounded"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-gray-500">
              No projects found.
            </p>
          )}
        </div>
      </div>

      {/** MOBILE / CARD LAYOUT */}
      <div className="md:hidden flex flex-col gap-4">
        {projects.length > 0 ? (
          projects.map((p) => (
            <div
              key={p.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-semibold truncate">
                  {p.projectName}
                </h3>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(p)}
                      className="p-1 bg-yellow-100 hover:bg-yellow-200 rounded"
                    >
                      <Pencil size={16} className="text-yellow-700" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.projectName}"?`)) {
                          onDelete(p.id);
                        }
                      }}
                      className="p-1 bg-red-100 hover:bg-red-200 rounded"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                <div className="font-medium">Postal Code:</div>
                <div>{p.postalCode || "—"}</div>

                <div className="font-medium">Status:</div>
                <div className="capitalize">{p.status}</div>

                <div className="font-medium">Start Date:</div>
                <div>{p.startDate}</div>

                <div className="font-medium">End Date:</div>
                <div>{p.endDate}</div>
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-gray-500">
            No projects found.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectTable;
