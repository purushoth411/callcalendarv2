import React from "react";

const CalendarLoader = () => {
  return (
    <div className="animate-pulse space-y-4">
      {/* Header Skeleton */}
      <div className="h-6 w-40 bg-gray-200 rounded"></div>

      {/* Calendar Grid Skeleton */}
      <div className="grid grid-cols-7 gap-2">
        {Array(42) // 6 weeks x 7 days
          .fill(0)
          .map((_, idx) => (
            <div
              key={idx}
              className="h-16 bg-gray-200 rounded-md"
            ></div>
          ))}
      </div>
    </div>
  );
};

export default CalendarLoader;
