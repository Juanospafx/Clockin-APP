// src/pages/User/admin/components/MyRecordTable.tsx

import React, { FC } from "react";
import { Pencil, MapPin } from "lucide-react";
import api from "../../../lib/api";

export interface RecordEntry {
  id: string;
  clockinId: string;
  photoPath?: string;
  userName: string;
  projectName: string;
  address: string;
  date: string;
  hours: number;      // puede venir negativo antes de este parche
  // … otros campos si los tienes …
}

interface Props {
  entries: RecordEntry[];
  isAdmin: boolean;
  onEdit: (e: RecordEntry) => void;
  onPreview: (photoPath: string) => void;
  onViewMap?: (clockinId: string) => void;
}

const API_BASE = api.defaults.baseURL || "";

const MyRecordTable: FC<Props> = ({ entries, isAdmin, onEdit, onPreview, onViewMap }) => {
  // ① Calcula total de horas considerando solo valores >= 0
  const totalHours = entries
    .map(e => Math.max(0, e.hours))
    .reduce((sum, h) => sum + h, 0);

  return (
    <div className="w-full space-y-4">
      {/* --- Encabezado con total hours --- */}
      <div className="flex justify-between items-center px-4">
        <h2 className="text-lg font-semibold">My Record</h2>
        <div className="text-gray-700">
          Total hours: <strong>{totalHours.toFixed(2)}</strong>
        </div>
      </div>

      {/** DESKTOP: tabla tradicional */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Photo
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Project
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Address
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Hours
              </th>
              {isAdmin && (
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.length > 0 ? (
              entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {e.photoPath ? (
                      <img
                        src={`${API_BASE}${e.photoPath}`}
                        alt="record"
                        className="h-12 w-12 object-cover rounded cursor-pointer"
                        onClick={() => onPreview(e.photoPath!)}
                      />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {e.userName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {e.projectName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {e.address}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {e.date}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {/* ② Clampeamos a 0 para no mostrar negativos */}
                    {Math.max(0, e.hours).toFixed(2)}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-sm text-gray-700 text-right space-x-2">
                      <button
                        onClick={() => onEdit(e)}
                        className="p-1 bg-yellow-100 hover:bg-yellow-200 rounded"
                      >
                        <Pencil size={16} className="text-yellow-700" />
                      </button>
                      {onViewMap && (
                        <button
                          onClick={() => onViewMap(e.clockinId)}
                          className="p-1 bg-blue-100 hover:bg-blue-200 rounded"
                        >
                          <MapPin size={16} className="text-blue-700" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={isAdmin ? 7 : 6}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/** MOBILE: tarjetas apiladas */}
      <div className="md:hidden flex flex-col gap-4">
        {entries.length > 0 ? (
          entries.map(e => (
            <div
              key={e.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  {e.photoPath ? (
                    <img
                      src={`${API_BASE}${e.photoPath}`}
                      alt="record"
                      className="h-10 w-10 object-cover rounded cursor-pointer"
                      onClick={() => onPreview(e.photoPath!)}
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 rounded" />
                  )}
                  <span className="font-medium text-gray-800">
                    {e.userName}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(e)}
                      className="p-1 bg-yellow-100 hover:bg-yellow-200 rounded"
                    >
                      <Pencil size={16} className="text-yellow-700" />
                    </button>
                    {onViewMap && (
                      <button
                        onClick={() => onViewMap(e.clockinId)}
                        className="p-1 bg-blue-100 hover:bg-blue-200 rounded"
                      >
                        <MapPin size={16} className="text-blue-700" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                <div className="font-medium">Project:</div>
                <div className="truncate">{e.projectName}</div>

                <div className="font-medium">Address:</div>
                <div className="truncate">{e.address}</div>

                <div className="font-medium">Date:</div>
                <div>{e.date}</div>

                <div className="font-medium">Hours:</div>
                <div>{Math.max(0, e.hours).toFixed(2)}</div>
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-gray-500">No records found.</p>
        )}
      </div>
    </div>
  );
};

export default MyRecordTable;
