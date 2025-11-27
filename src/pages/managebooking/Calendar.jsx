import React, { useEffect, useState } from "react";
import "./Calendar.css"; // For CSS styles

const CustomCalendar = ({ consultantSettings, onDateClick, selectedDateState }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(
    selectedDateState ? new Date(selectedDateState) : null
  );

  console.log(consultantSettings)

  if (!consultantSettings) {
    return <div className="text-gray-500">Loading calendar...</div>;
  }

  let excludedDates = [];
  let exclusionDetailsMap = {};

  try {
    if (consultantSettings?.fld_days_exclusion) {
      excludedDates = consultantSettings.fld_days_exclusion
        .split("|~|")
        .map((d) => d.trim());
    }
    if (consultantSettings?.fld_days_exclusion_details) {
      const details = consultantSettings.fld_days_exclusion_details
        .split("|~|")
        .map((d) => d.trim());
      exclusionDetailsMap = excludedDates.reduce((acc, date, idx) => {
        const v = details[idx] || "full";
        acc[date] = v === "first_half" || v === "second_half" || v === "full" ? v : "full";
        return acc;
      }, {});
    }
  } catch (err) {
    console.error("Error parsing fld_days_exclusion:", err);
    excludedDates = [];
    exclusionDetailsMap = {};
  }


  const allowedWeekDays = (consultantSettings?.fld_selected_week_days || "")
  .split(",")
  .filter(Boolean) 
  .map((d) => parseInt(d, 10));


  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handlePrev = () => {
    setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1));
    if (currentMonth === 0) setCurrentYear(currentYear - 1);
  };

  const handleNext = () => {
    setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1));
    if (currentMonth === 11) setCurrentYear(currentYear + 1);
  };

  const renderCalendar = () => {
    const days = [];
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
    const totalDays = getDaysInMonth(currentMonth, currentYear);

    // Parse Saturday offs
    const saturdayOffs = consultantSettings.fld_saturday_off
      ? consultantSettings.fld_saturday_off.split(",").map((s) => parseInt(s))
      : [];

    let saturdayCount = 0;

    // Fill blank days before start
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={"blank" + i} className="day blank"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(d).padStart(2, "0")}`;
      const dateObj = new Date(currentYear, currentMonth, d);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday
      const isExcluded = excludedDates.includes(dateStr) && (exclusionDetailsMap[dateStr] || "full") === "full";
      const isAllowedDay = allowedWeekDays.includes(dayOfWeek + 1);

      // Handle Saturday off logic
      let isNthSaturdayOff = false;
      if (dayOfWeek === 6) {
        // Saturday
        saturdayCount++;
        if (saturdayOffs.includes(saturdayCount)) {
          isNthSaturdayOff = true;
        }
      }

      let classNames = "day";
      const isPastDate =
        dateObj <
        new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isDisabled =
        isExcluded || !isAllowedDay || isNthSaturdayOff || isPastDate;
      // const isDisabled = isExcluded || !isAllowedDay || isNthSaturdayOff;

      if (excludedDates.includes(dateStr) && (exclusionDetailsMap[dateStr] || "full") === "full") classNames += " excluded";
      else if (!isAllowedDay || isNthSaturdayOff || isPastDate) classNames += " disabled";
      else if (dayOfWeek === 0) classNames += " sunday";
      if (
        selectedDate &&
        selectedDate.toDateString() === dateObj.toDateString()
      )
        classNames += " selected";

      days.push(
        <div
          key={d}
          className={classNames}
          onClick={() => {
            if (!isDisabled) {
              setSelectedDate(dateObj);
              const formatted = `${currentYear}-${String(
                currentMonth + 1
              ).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

              const dayName = dateObj
                .toLocaleDateString("en-US", { weekday: "short" })
                .toLowerCase(); // "mon", "tue", etc.

              onDateClick && onDateClick(formatted, dayName);
            }
          }}
        >
          {d}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-wrapper the_mg">
      <div className="calendar-header">
        <button type="button" className="flex items-center" onClick={handlePrev}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="me-1 " viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-left-icon lucide-chevrons-left"><path d="m11 17-5-5 5-5" /><path d="m18 17-5-5 5-5" /></svg>
          Prev
        </button>
        <div className="month-label">
          {new Date(currentYear, currentMonth).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <button type="button" className="flex items-center" onClick={handleNext}>
          Next<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" className="ms-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-right-icon lucide-chevrons-right"><path d="m6 17 5-5-5-5" /><path d="m13 17 5-5-5-5" /></svg>
        </button>
      </div>
      <div className="day-names">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="day-name">
            {d}
          </div>
        ))}
      </div>
      <div className="calendar-grid">{renderCalendar()}</div>
    </div>
  );
};

export default CustomCalendar;
