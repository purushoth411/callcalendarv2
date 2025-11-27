import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Select from "react-select";
import { Calendar, Clock, Save, CheckSquare, Square } from "lucide-react";
import API_URL from "../../utils/constants";

const dayMap = {
  1: "sun",
  2: "mon",
  3: "tue",
  4: "wed",
  5: "thu",
  6: "fri",
  7: "sat",
};

const BlockSlot = () => {

  const [allConsultants, setAllConsultants] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [consultSettingData, setConsultantSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);

  const fetchAdmins = async (type, status, setter) => {
    try {
      const response = await fetch(
        `${API_URL}/api/helpers/getAdmin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, status }),
        }
      );
      const result = await response.json();
      if (result?.status && Array.isArray(result.results)) {
        const sorted = result.results.sort((a, b) =>
          a.fld_name.localeCompare(b.fld_name)
        );
        setter(sorted);
      } else {
        toast.error(`Failed to fetch ${type} (${status})`);
      }
    } catch (error) {
      console.error(`Error fetching ${type} (${status})`, error);
      toast.error("Something went wrong while fetching consultants.");
    }finally{
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchAdmins("CONSULTANT", "Active", setAllConsultants);
  }, []);

  useEffect(() => {
    const fetchConsultantSettingData = async () => {
      if (!selectedConsultant) {
        return
      }
      try {
        const response = await fetch(
          `${API_URL}/api/dashboard/getconsultantsettings`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ consultantid: selectedConsultant?.value }),
          }
        );
        const result = await response.json();
        if (result.status) {
          setConsultantSettings(result.data);
        } else {
          toast.error(result.message || "Failed to fetch consultant settings");
        }
      } catch (e) {
        console.error(e);
        toast.error("Error fetching consultant settings");
      } finally {
        setLoading(false);
      }
    };

    fetchConsultantSettingData();
  }, [selectedConsultant]);


  const formatTime = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };


  const generateTimeSlots = (timeData) => {
    if (!timeData) return [];
    const slots = [];
    const ranges = timeData.split("~");
    ranges.forEach((range) => {
      const [startTime, endTime] = range.split("||");
      if (!startTime || !endTime) return;
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      let currentHour = startHour;
      let currentMin = startMin;
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const nextMin = currentMin + 30;
        let nextHour = currentHour;
        let slotStart = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
        let slotEnd, adjustedNextMin;
        if (nextMin >= 60) {
          nextHour += 1;
          adjustedNextMin = nextMin - 60;
          slotEnd = `${nextHour.toString().padStart(2, "0")}:${adjustedNextMin.toString().padStart(2, "0")}`;
          slots.push(`${formatTime(slotStart)} - ${formatTime(slotEnd)}`);
          currentHour = nextHour;
          currentMin = adjustedNextMin;
        } else {
          slotEnd = `${nextHour.toString().padStart(2, "0")}:${nextMin.toString().padStart(2, "0")}`;
          slots.push(`${formatTime(slotStart)} - ${formatTime(slotEnd)}`);
          currentMin = nextMin;
        }
      }
    });
    return slots;
  };


  const handleDayChange = (dayValue) => {
    setSelectedDay(dayValue);
    const dayKey = dayMap[dayValue];
    const rawTimeData = consultSettingData?.[`fld_${dayKey}_time_data`] || "";
    const rawBlockedData = consultSettingData?.[`fld_${dayKey}_time_block`] || "";
    const allTimeSlots = generateTimeSlots(rawTimeData);


    const timeRegex = /([1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)/gi;
    const matches = rawBlockedData
      ? [...rawBlockedData.matchAll(timeRegex)].map((m) =>
        m[0].replace(/\s+/g, " ").toUpperCase().trim()
      )
      : [];


    const blocked = allTimeSlots
      .map(slot => slot.split(" - ")[0].replace(/\s+/g, " ").toUpperCase().trim())
      .filter(slotStart => matches.includes(slotStart));

    setAvailableSlots(allTimeSlots);
    setBlockedSlots(blocked);
    setSelectedSlots(blocked);
  };


  const handleSlotToggle = (slot) => {
    const slotStart = slot.split(" - ")[0].replace(/\s+/g, " ").toUpperCase().trim();
    if (selectedSlots.includes(slotStart)) {
      setSelectedSlots((prev) => prev.filter((s) => s !== slotStart));
    } else {
      if (selectedSlots.length >= 4) {
        toast.error("You can block a maximum of 4 slots.");
        return;
      }
      setSelectedSlots((prev) => [...prev, slotStart]);
    }
  };

  // Pass blocked slot start times in the requested " - " format string to backend
  const handleSaveBlockedSlots = async () => {
    if (!selectedDay) {
      toast.error("Please select a day first");
      return;
    }
    if (!selectedConsultant) {
      toast.error("Please select a consultant");
      return;
    }
    try {
      setSubmitting(true);
      // Format like "3:30 PM - 4:30 PM - 5:30 PM"
      const blockedSlotsString = selectedSlots.join(" - ");
      const response = await fetch(`${API_URL}/api/dashboard/updateBlockSlots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consultantid: selectedConsultant?.value,
          day: dayMap[selectedDay],
          blockedSlots: blockedSlotsString,
        }),
      });
      const result = await response.json();
      if (result.status) {
        toast.success("Blocked slots updated successfully!");
      } else {
        toast.error(result.message || "Failed to save blocked slots");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save blocked slots");
    } finally {
      setSubmitting(false);
    }
  };

  // Render day option radio button
  const renderTimeOption = (label, timeData, value, id) => {
    if (!timeData) return null;
    const formattedTimeData = timeData
      .split("~")
      .map((range) => {
        const [start, end] = range.split("||");
        return `${formatTime(start)} - ${formatTime(end)}`;
      })
      .join(", ");
    return (
      <div key={id} className="mb-2">
        <label htmlFor={id} className="flex items-center space-x-2 text-sm cursor-pointer bg-gray-100 hover:bg-gray-200 p-2 rounded">
          <input
            type="radio"
            name="week_day"
            id={id}
            className="form-radio text-blue-600"
            value={value}
            checked={selectedDay === value}
            onChange={() => handleDayChange(value)}
          />
          <span>{`${label}: ${formattedTimeData}`}</span>
        </label>
      </div>
    );
  };

  const consultantOptions = allConsultants.map((consultant) => ({
    value: consultant.id,
    label: consultant.fld_name,
  }));


  // Final UI
  return (
    <div className="flex flex-wrap gap-6 bg-white my-2 p-2 rounded">
      {loading ? (
        <>
          <div className="w-full mb-3 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
            {/* Left side (Day Selector Skeleton) */}
            <div className="border border-gray-300 rounded p-4 bg-gray-50 min-h-[200px] space-y-4 animate-pulse space-y-4 animate-pulse">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
            {/* Right side (Slots Skeleton) */}
            <div className="col-span-2">
              <div className="border border-gray-300 rounded p-4 bg-gray-50 min-h-[200px] space-y-4 animate-pulse">
                <div className="h-5 bg-gray-300 w-3/4 rounded"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="flex justify-end pt-4">
                  <div className="h-8 w-36 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>

          


          <div className="w-full mb-3">
            <h4 className="text-[16px] font-semibold text-gray-800 flex items-center space-x-2">
              <Calendar size={16} className="text-blue-600" />
              <span>Block Calendar For 2 Hours</span>
            </h4>
            <p className="text-sm text-gray-600 mt-2">
              Select a Consultant and then day to view and block available time slots (maximum 4 slots)
            </p>

            <div className="">
            {/* <label className="block mb-2 text-sm font-medium text-gray-700">
              Select Consultant
            </label> */}
            <Select
              options={consultantOptions}
              value={selectedConsultant}
              onChange={setSelectedConsultant}
              placeholder="Choose a consultant..."
              isClearable
              className="max-w-lg"
            />
          </div>
          </div>
          {selectedConsultant && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
              {/* Day Selector */}
              <div className="bg-white p-4 rounded shadow-md border border-gray-200">
                <h4 className="text-base font-semibold mb-3 border-b border-gray-100 pb-2 flex gap-2 items-center"><Calendar size={16} className="text-blue-600" /> Select Day :</h4>

                {renderTimeOption("Sunday", consultSettingData?.fld_sun_time_data, 1, "sun_bx")}
                {renderTimeOption("Monday", consultSettingData?.fld_mon_time_data, 2, "mon_bx")}
                {renderTimeOption("Tuesday", consultSettingData?.fld_tue_time_data, 3, "tue_bx")}
                {renderTimeOption("Wednesday", consultSettingData?.fld_wed_time_data, 4, "wed_bx")}
                {renderTimeOption("Thursday", consultSettingData?.fld_thu_time_data, 5, "thu_bx")}
                {renderTimeOption("Friday", consultSettingData?.fld_fri_time_data, 6, "fri_bx")}
                {renderTimeOption("Saturday", consultSettingData?.fld_sat_time_data, 7, "sat_bx")}
              </div>
              {/* Slots & Save Section */}
              <div className="col-span-2 flex w-full">
                {selectedDay ? (
                  <div className="border border-gray-300 rounded p-4 bg-gray-50 min-h-[200px] flex flex-col w-full">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-semibold  flex items-center space-x-2 text-[16px]">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span>Available Time Slots (30 minutes each):</span>
                      </p>
                      <span className="text-sm text-gray-500">
                        {selectedSlots.length}/4 slots blocked
                      </span>
                    </div>
                    {availableSlots.length === 0 ? (
                      <p className="text-gray-500 text-sm">No slots available for the selected day.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 overflow-y-auto max-h-[260px]">
                        {availableSlots.map((slot, index) => {
                          const slotStart = slot.split(" - ")[0].replace(/\s+/g, " ").toUpperCase().trim();
                          const isSelected = selectedSlots.includes(slotStart);
                          return (
                            <label
                              key={index}
                              className={`flex items-center space-x-3 text-sm p-2 rounded border cursor-pointer transition-colors select-none ${isSelected
                                  ? "bg-red-50 border-red-300 text-red-700"
                                  : "bg-white border-gray-200 hover:bg-blue-50"
                                }`}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                value={slot}
                                checked={isSelected}
                                onChange={() => handleSlotToggle(slot)}
                                aria-label={`Toggle block for slot ${slot}`}
                              />
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-red-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                              <span className={isSelected ? "line-through" : ""}>{slot}</span>
                              {isSelected && (
                                <span className="text-xs text-red-500 ml-auto font-semibold">
                                  BLOCKED
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-auto pt-3 border-t border-gray-200 flex justify-end">
                      <button
                        onClick={handleSaveBlockedSlots}
                        disabled={submitting}
                        className={`bg-blue-600 text-white px-2 py-1 rounded text-[12px] flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${submitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 transition-colors cursor-pointer"
                          }`}
                      >
                        <Save className="" size={15} />
                        <span>{submitting ? "Saving..." : "Save Blocked Slots"}</span>
                      </button>

                    </div>
                  </div>
                ) : (
                  <div className="border border-red-200 rounded p-4 bg-red-50 text-center text-red-600 text-sm w-full flex items-center justify-center">
                    Please select a day to view available time slots
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlockSlot;
