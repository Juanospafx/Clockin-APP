// src/pages/User/admin/components/ProjectHistoryTable.tsx

import React, { FC } from "react";

export interface HistoryEntry {
  id: string;
  projectCode: string;
  projectName: string;
  status: string;
  address: string;
  startDate: string;
  endDate?: string;
  hours: string;
  userName: string;
}

interface ProjectHistoryTableProps {
  entries: HistoryEntry[];
}

const ProjectHistoryTable: FC<ProjectHistoryTableProps> = ({ entries }) => {
  return (
    <div className="w-full">

      {/** DESKTOP / TABLE GRID */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[56rem]">
          {/* Header */}
          <div className="grid grid-cols-[6rem_2fr_1.5fr_3fr_2fr_2fr_2fr] gap-x-8 gap-y-4 border-b border-gray-200 pb-2 font-medium text-gray-600 text-sm">
            <span>Code</span>
            <span>Project Name</span>
            <span>Status</span>
            <span>Address</span>
            <span>Start Date</span>
            <span>End Date</span>
            <span className="text-right">Total Hours</span>
          </div>

          {/* Rows */}
          {entries.length > 0 ? (
            entries.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-[6rem_2fr_1.5fr_3fr_2fr_2fr_2fr] gap-x-8 gap-y-4 py-3 border-b border-gray-100 text-sm items-center hover:bg-gray-50"
              >
                <span className="font-mono text-gray-700 truncate">
                  {e.projectCode}
                </span>
                <span className="truncate">{e.projectName}</span>
                <span className="capitalize">{e.status}</span>
                <span className="truncate">{e.address}</span>
                <span>{e.startDate}</span>
                <span>{e.endDate ?? "—"}</span>
                <span className="text-right">{e.hours}</span>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-gray-500">No history found.</p>
          )}
        </div>
      </div>

      {/** MOBILE / CARD LAYOUT */}
      <div className="md:hidden flex flex-col gap-4">
        {entries.length > 0 ? (
          entries.map((e) => (
            <div
              key={e.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
            >
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div className="font-medium">Code:</div>
                <div className="truncate">{e.projectCode}</div>

                <div className="font-medium">Name:</div>
                <div className="truncate">{e.projectName}</div>

                <div className="font-medium">Status:</div>
                <div className="capitalize">{e.status}</div>

                <div className="font-medium">Address:</div>
                <div className="truncate">{e.address}</div>

                <div className="font-medium">Start:</div>
                <div>{e.startDate}</div>

                <div className="font-medium">End:</div>
                <div>{e.endDate ?? "—"}</div>

                <div className="font-medium">Hours:</div>
                <div>{e.hours}</div>
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-gray-500">No history found.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectHistoryTable;
