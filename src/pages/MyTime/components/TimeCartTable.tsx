// src/pages/User/admin/components/TimeCartTable.tsx

import React, { FC } from "react";
import { Pencil, Trash2 } from "lucide-react";

export interface ClockinEntry {
  id: string;
  psCode: string;
  userName: string;
  projectName: string;
  postalCode: string;
  createdAt: string;
  endTime?: string;
  hours?: number | null;
}

interface TimeCartTableProps {
  entries: ClockinEntry[];
  onEdit?: (entry: ClockinEntry) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

const TimeCartTable: FC<TimeCartTableProps> = ({
  entries,
  onEdit,
  onDelete,
  isAdmin,
}) => (
  <div className="w-full">
    {/** DESKTOP TABLE */}
    <div className="hidden md:block overflow-x-auto">
      <div className="min-w-max">
        {/* Header */}
        <div className="grid grid-cols-[7rem_1fr_1fr_6rem_5rem_5rem_6rem] gap-4 border-b border-gray-200 pb-2 font-medium text-gray-600 sticky top-0 z-10 bg-white">
          <span>PS code</span>
          <span>User name</span>
          <span>Project</span>
          <span>Postal code</span>
          <span className="text-right">Date</span>
          <span className="text-right">Hours</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows */}
        {entries.length > 0 ? (
          entries.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[7rem_1fr_1fr_6rem_5rem_5rem_6rem] gap-4 py-3 border-b border-gray-100 text-sm items-center hover:bg-gray-50"
            >
              <span className="text-gray-700 font-medium">{e.psCode}</span>
              <span>{e.userName}</span>
              <span>
                <div className="px-2 py-1 border border-gray-200 rounded-lg inline-block text-xs font-semibold truncate">
                  {e.projectName || "—"}
                </div>
              </span>
              <span>
                <div className="px-2 py-1 border border-gray-200 rounded-lg inline-block text-xs font-semibold truncate">
                  {e.postalCode || "—"}
                </div>
              </span>
              <span className="text-right text-gray-500">
                {new Date(e.createdAt).toLocaleDateString()}
              </span>
              <span className="text-right">
                {e.hours != null ? e.hours.toFixed(2) : "—"}
              </span>
              <span className="flex justify-end gap-2">
                {isAdmin && onEdit && (
                  <button
                    onClick={() => onEdit(e)}
                    className="p-1 bg-yellow-100 hover:bg-yellow-200 rounded"
                  >
                    <Pencil size={16} className="text-yellow-700" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(e.id)}
                  className="p-1 bg-red-100 hover:bg-red-200 rounded"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </span>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-gray-500">
            No entries found.
          </p>
        )}
      </div>
    </div>

    {/** MOBILE CARD LIST */}
    <div className="md:hidden flex flex-col gap-4">
      {entries.length > 0 ? (
        entries.map((e) => (
          <div
            key={e.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
          >
            {/* Header row: code + actions */}
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-gray-700">{e.psCode}</span>
              <div className="flex gap-2">
                {isAdmin && onEdit && (
                  <button
                    onClick={() => onEdit(e)}
                    className="p-1 bg-yellow-100 hover:bg-yellow-200 rounded"
                  >
                    <Pencil size={16} className="text-yellow-700" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(e.id)}
                  className="p-1 bg-red-100 hover:bg-red-200 rounded"
                >
                    <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
              <div className="font-medium">User:</div>
              <div>{e.userName}</div>

              <div className="font-medium">Project:</div>
              <div className="truncate">{e.projectName || "—"}</div>

              <div className="font-medium">Postal Code:</div>
              <div>{e.postalCode || "—"}</div>

              <div className="font-medium">Date:</div>
              <div>{new Date(e.createdAt).toLocaleDateString()}</div>

              <div className="font-medium">Hours:</div>
              <div>{e.hours != null ? e.hours.toFixed(2) : "—"}</div>
            </div>
          </div>
        ))
      ) : (
        <p className="py-4 text-center text-gray-500">
          No entries found.
        </p>
      )}
    </div>
  </div>
);

export default TimeCartTable;
