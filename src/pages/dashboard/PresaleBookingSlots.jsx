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

const PresaleBookingSlots = () => {
  const [allConsultants, setAllConsultants] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [consultSettingData, setConsultantSettings] = useState(null);
  const [presaleSettings, setPresaleSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [daySlotsMap, setDaySlotsMap] = useState({}); // Store slots for each day

  const fetchAdmins = async ( status, setter) => {
    try {
      const response = await fetch(
        `${API_URL}/api/helpers/getSuperConsultants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const result = await response.json();
      if (result?.status && Array.isArray(result.results)) {
        const sorted = result.results.sort((a, b) =>
          a.fld_name.localeCompare(b.fld_name)
        );
        setter(sorted);
      } else {
        toast.error(`Failed to fetch (${status})`);
      }
    } catch (error) {
      console.error(`Error fetching (${status})`, error);
      toast.error("Something went wrong while fetching consultants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins("Active", setAllConsultants);
  }, []);

  // Clear all selections when consultant changes
  useEffect(() => {
    if (selectedConsultant) {
      setSelectedDay(null);
      setSelectedSlots([]);
      setDaySlotsMap({});
      setAvailableSlots([]);
      setPresaleSettings(null);
    }
  }, [selectedConsultant]);

  useEffect(() => {
    const fetchConsultantSettingData = async () => {
      if (!selectedConsultant) {
        return;
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
          console.log("Consultant Settings Data:", result.data);
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

    const fetchPresaleSettings = async () => {
      if (!selectedConsultant) {
        return;
      }
      try {
        const response = await fetch(
          `${API_URL}/api/dashboard/getconsultantpresalesettings`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ consultantid: selectedConsultant?.value }),
          }
        );
        const result = await response.json();
        if (result.status) {
          console.log("Presale Settings Data:", result.data);
          setPresaleSettings(result.data);
          
          // Parse and set default selected slots
          if (result.data) {
            const parsedSlots = {};
            
            // Map day keys to day values
            const dayKeyToValue = {
              'sun': 1, 'mon': 2, 'tue': 3, 'wed': 4, 
              'thu': 5, 'fri': 6, 'sat': 7
            };
            
            // Parse each day's time slots
            Object.keys(dayKeyToValue).forEach(dayKey => {
              const timeField = `${dayKey}_time`;
              if (result.data[timeField]) {
                try {
                  const parsedSlotsForDay = JSON.parse(result.data[timeField]);
                  if (Array.isArray(parsedSlotsForDay)) {
                    parsedSlots[dayKeyToValue[dayKey]] = parsedSlotsForDay;
                  }
                } catch (parseError) {
                  console.error(`Error parsing ${timeField}:`, parseError);
                }
              }
            });
            
            console.log("Parsed Presale Slots:", parsedSlots);
            setDaySlotsMap(parsedSlots);
          }
        } else {
          toast.error(result.message || "Failed to fetch presale settings");
        }
      } catch (e) {
        console.error(e);
        toast.error("Error fetching presale settings");
      }
    };

    fetchConsultantSettingData();
    fetchPresaleSettings();
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
      
      // Skip if this looks like individual time points (no dash)
      if (!range.includes("||")) return;
      
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
    // Save current day's selected slots before switching
    if (selectedDay && selectedSlots.length > 0) {
      setDaySlotsMap(prev => ({
        ...prev,
        [selectedDay]: [...selectedSlots]
      }));
    }
    
    setSelectedDay(dayValue);
    const dayKey = dayMap[dayValue];
    const rawTimeData = consultSettingData?.[`fld_${dayKey}_time_data`] || "";
    const allTimeSlots = generateTimeSlots(rawTimeData);
    
    console.log(`Day: ${dayKey}, Raw Time Data:`, rawTimeData);
    console.log(`Generated Time Slots:`, allTimeSlots);
    
    setAvailableSlots(allTimeSlots);
    // Load previously selected slots for this day from daySlotsMap, or empty array if none
    const previouslySelectedSlots = daySlotsMap[dayValue] || [];
    console.log(`Loading previously selected slots for day ${dayValue}:`, previouslySelectedSlots);
    setSelectedSlots(previouslySelectedSlots);
  };

  const handleSlotToggle = (slot) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots((prev) => prev.filter((s) => s !== slot));
    } else {
      setSelectedSlots((prev) => [...prev, slot]);
    }
  };

  const handleSavePresaleSlots = async () => {
    if (!selectedConsultant) {
      toast.error("Please select a consultant");
      return;
    }

    // Save current day's slots before processing
    const finalDaySlotsMap = { ...daySlotsMap };
    if (selectedDay && selectedSlots.length > 0) {
      finalDaySlotsMap[selectedDay] = [...selectedSlots];
    }

    // Check if any day has slots selected
    const hasAnySlots = Object.values(finalDaySlotsMap).some(slots => slots.length > 0);
    if (!hasAnySlots) {
      toast.error("Please select at least one slot for any day");
      return;
    }

    // Create payload with all selected slots for all days
    const payload = {
      user_id: selectedConsultant.value,
    };

    // Add slots for each day that has selections
    Object.keys(finalDaySlotsMap).forEach(dayValue => {
      const dayKey = dayMap[dayValue];
      const slots = finalDaySlotsMap[dayValue];
      if (slots && slots.length > 0) {
        payload[`${dayKey}_time`] = JSON.stringify(slots);
      }
    });

    console.log("All Selected Slots:", finalDaySlotsMap);
    console.log("Presale Slots Payload:", JSON.stringify(payload, null, 2));

    try {
      setSubmitting(true);
      
      const response = await fetch(`${API_URL}/api/dashboard/saveconsultantpresalesettings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (result.status) {
        const selectedDaysCount = Object.keys(finalDaySlotsMap).filter(day => finalDaySlotsMap[day].length > 0).length;
        toast.success(`Presale slots saved successfully for ${selectedDaysCount} day(s)!`);
        
        // Clear the selections after successful save
        setDaySlotsMap({});
        setSelectedSlots([]);
        setSelectedDay(null);
        setSelectedConsultant(null)
      } else {
        toast.error(result.message || "Failed to save presale slots");
      }
      
    } catch (error) {
      console.error("Error saving presale slots:", error);
      toast.error("Failed to save presale slots");
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
              <span>Presale Booking Slots</span>
            </h4>
            <p className="text-sm text-gray-600 mt-2">
              Select a Consultant and then day to view and select presale time slots
            </p>
            
    

            <div className="">
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
                        {selectedSlots.length} slot(s) selected
                      </span>
                    </div>
                    {availableSlots.length === 0 ? (
                      <p className="text-gray-500 text-sm">No slots available for the selected day.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 overflow-y-auto max-h-[260px]">
                        {availableSlots.map((slot, index) => {
                          const isSelected = selectedSlots.includes(slot);
                          return (
                            <label
                              key={index}
                              className={`flex items-center space-x-3 text-sm p-2 rounded border cursor-pointer transition-colors select-none ${isSelected
                                  ? "bg-green-50 border-green-300 text-green-700"
                                  : "bg-white border-gray-200 hover:bg-blue-50"
                                }`}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                value={slot}
                                checked={isSelected}
                                onChange={() => handleSlotToggle(slot)}
                                aria-label={`Toggle presale slot ${slot}`}
                              />
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-green-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                              <span className={isSelected ? "font-medium" : ""}>{slot}</span>
                              {isSelected && (
                                <span className="text-xs text-green-500 ml-auto font-semibold">
                                  PRESALE
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-auto pt-3 border-t border-gray-200 flex justify-end">
                      <button
                        onClick={handleSavePresaleSlots}
                        disabled={submitting}
                        className={`bg-green-600 text-white px-2 py-1 rounded text-[12px] flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${submitting ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700 transition-colors cursor-pointer"
                          }`}
                      >
                        <Save className="" size={15} />
                        <span>{submitting ? "Saving..." : "Save Presale Slots"}</span>
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

export default PresaleBookingSlots;
