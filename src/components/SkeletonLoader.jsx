import React from "react";

const SkeletonLoader = ({
  rows = 5,
  columns = ["Team Name", "Added On", "Status", "Actions"], // default headers
}) => {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow text-[13px]">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100 text-xs text-left font-semibold text-gray-700">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-3">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="animate-pulse">
              {columns.map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SkeletonLoader;
