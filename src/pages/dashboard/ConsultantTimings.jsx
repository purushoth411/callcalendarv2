import React, { useEffect, useState } from "react";
import Select from "react-select";
import toast from "react-hot-toast";
import { Plus, X } from "lucide-react";
import { TimeZones } from "../../helpers/TimeZones";
import SocketHandler from "../../hooks/SocketHandler";
import moment from "moment-timezone";
import API_URL from "../../utils/constants";

function ConsultantTimings() {
  const [allConsultants, setAllConsultants] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [consultantSettings, setConsultantSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const tomorrow = moment.tz("Asia/Kolkata").add(1, "day").format("YYYY-MM-DD");
  const today = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
  
  // Form state
  const [formData, setFormData] = useState({
    selectedWeekDays: [],
    timeData: {
      1: [], // Sunday
      2: [], // Monday
      3: [], // Tuesday
      4: [], // Wednesday
      5: [], // Thursday
      6: [], // Friday
      7: [], // Saturday
    },
    timezone: "",
    exclusions: [],
    exclusionDetails: [],
    saturdayOff: [],
  });

  const [tempExclusion, setTempExclusion] = useState({
    type: "date",
    startDate: "",
    endDate: "",
    detail: "full",
  });

  const weekDays = [
    { id: 1, name: "SUN", label: "Sunday" },
    { id: 2, name: "MON", label: "Monday" },
    { id: 3, name: "TUE", label: "Tuesday" },
    { id: 4, name: "WED", label: "Wednesday" },
    { id: 5, name: "THU", label: "Thursday" },
    { id: 6, name: "FRI", label: "Friday" },
    { id: 7, name: "SAT", label: "Saturday" },
  ];

  const [timezoneOptions, setTimezoneOptions] = useState(TimeZones);

  useEffect(() => {
    const match = TimeZones.find(
      (opt) =>
        opt.value === formData.timezone || opt.id === Number(formData.timezone)
    );

    if (match) {
      setFormData((prev) => ({
        ...prev,
        timezone: match,
      }));
    }
  }, [formData.timezone]);

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
    }
  };

  const fetchConsultantSettings = async () => {
    if (!selectedConsultant) return;

    setLoading(true);
    setConsultantSettings(null);
    try {
      const response = await fetch(
        `${API_URL}/api/dashboard/getconsultantsettings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consultantid: selectedConsultant.value }),
        }
      );
      const result = await response.json();
      if (result.status) {
        setConsultantSettings(result.data);
        parseConsultantSettings(result.data);
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

  const parseConsultantSettings = (settings) => {
    // Parse selected week days
    const selectedWeekDays = settings.fld_selected_week_days
      ? settings.fld_selected_week_days.split(",").map((day) => parseInt(day))
      : [];

    // Parse time data for each day
    const timeData = {};
    weekDays.forEach((day) => {
      const fieldName = `fld_${day.name.toLowerCase()}_time_data`;
      const timeString = settings[fieldName];

      if (timeString && timeString !== "") {
        const timeSlots = timeString.split("~").filter((slot) => slot !== "");
        timeData[day.id] = timeSlots.map((slot) => {
          const [from, to] = slot.split("||");
          return { from: from || "", to: to || "" };
        });
      } else {
        timeData[day.id] = [];
      }
    });

    // Parse exclusions
    const exclusions = settings.fld_days_exclusion
      ? settings.fld_days_exclusion.split("|~|").filter((exc) => exc !== "")
      : [];

    // Parse exclusion details; align length with exclusions; default to 'full'
    const exclusionDetailsRaw = settings.fld_days_exclusion_details
      ? settings.fld_days_exclusion_details.split("|~|")
      : [];
    const exclusionDetails = exclusions.map((_, idx) => {
      const value = exclusionDetailsRaw[idx];
      return value === "first_half" || value === "second_half" || value === "full"
        ? value
        : "full";
    });

    // Parse saturday off
    const saturdayOff = settings.fld_saturday_off
      ? settings.fld_saturday_off.split(",").map((week) => parseInt(week))
      : [];

    setFormData({
      selectedWeekDays,
      timeData,
      timezone: settings.fld_timezone || "",
      exclusions,
      exclusionDetails,
      saturdayOff,
    });
  };

  const handleWeekDayChange = (dayId, checked) => {
    setFormData((prev) => ({
      ...prev,
      selectedWeekDays: checked
        ? [...prev.selectedWeekDays, dayId]
        : prev.selectedWeekDays.filter((id) => id !== dayId),
    }));
  };

  const handleTimeSlotChange = (dayId, slotIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      timeData: {
        ...prev.timeData,
        [dayId]: prev.timeData[dayId].map((slot, index) =>
          index === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const addTimeSlot = (dayId) => {
    setFormData((prev) => ({
      ...prev,
      timeData: {
        ...prev.timeData,
        [dayId]: [...prev.timeData[dayId], { from: "", to: "" }],
      },
    }));
  };

  const removeTimeSlot = (dayId, slotIndex) => {
    setFormData((prev) => ({
      ...prev,
      timeData: {
        ...prev.timeData,
        [dayId]: prev.timeData[dayId].filter((_, index) => index !== slotIndex),
      },
    }));
  };

  const handleExclusionAdd = () => {
    if (!tempExclusion.startDate) {
      toast.error("Please select a start date");
      return;
    }

    let exclusionText = tempExclusion.startDate;
    if (tempExclusion.type === "ranges" && tempExclusion.endDate) {
      exclusionText += ` to ${tempExclusion.endDate}`;
    }

    setFormData((prev) => ({
      ...prev,
      exclusions: [...prev.exclusions, exclusionText],
      exclusionDetails: [...prev.exclusionDetails, tempExclusion.detail || "full"],
    }));

    setTempExclusion({ type: "date", startDate: "", endDate: "", detail: "full" });
  };

  const removeExclusion = (index) => {
    setFormData((prev) => ({
      ...prev,
      exclusions: prev.exclusions.filter((_, i) => i !== index),
      exclusionDetails: prev.exclusionDetails.filter((_, i) => i !== index),
    }));
  };

  const handleSaturdayOffChange = (week, checked) => {
    setFormData((prev) => ({
      ...prev,
      saturdayOff: checked
        ? [...prev.saturdayOff, week]
        : prev.saturdayOff.filter((w) => w !== week),
    }));
  };

  const handleSubmit = async () => {
    if (!selectedConsultant) {
      toast.error("Please select a consultant");
      return;
    }

    setLoading(true);
    try {
      // Format data for submission
      const submitData = {
        consultantid: selectedConsultant.value,
        selectedWeekDays: formData.selectedWeekDays.join(","),
        timeData: {},
        timezone: formData.timezone,
        exclusions: formData.exclusions.join("|~|"),
        exclusionDetails: (formData.exclusionDetails || []).map((d) => (d || "full")).join("|~|"),
        saturdayOff: formData.saturdayOff.join(","),
      };

      // Format time data
      weekDays.forEach((day) => {
        const daySlots = formData.timeData[day.id] || [];
        submitData.timeData[`${day.name.toLowerCase()}_time_data`] = daySlots
          .filter((slot) => slot.from && slot.to)
          .map((slot) => `${slot.from}||${slot.to}`)
          .join("~");
      });

      // Submit to API
      const response = await fetch(
        `${API_URL}/api/dashboard/saveconsultantsettings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        }
      );

      const result = await response.json();
      if (result.status) {
        toast.success("Settings saved successfully");
       // fetchConsultantSettings();
      } else {
        toast.error(result.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins("CONSULTANT", "Active", setAllConsultants);
  }, []);

  useEffect(() => {
    fetchConsultantSettings();
  }, [selectedConsultant]);

  const consultantOptions = allConsultants.map((consultant) => ({
    value: consultant.id,
    label: consultant.fld_name,
  }));

  const renderTimeSlots = (dayId) => {
    const slots = formData.timeData[dayId] || [];
    const isSelected = formData.selectedWeekDays.includes(dayId);

    if (!isSelected) {
      return <span className="text-red-500 text-sm">Unavailable</span>;
    }

    if (slots.length === 0) {
      return (
        <button
          type="button"
          onClick={() => addTimeSlot(dayId)}
          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Time
        </button>
      );
    }

    return (
      <div className="space-y-2">
        {slots.map((slot, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="time"
              value={slot.from}
              onChange={(e) =>
                handleTimeSlotChange(dayId, index, "from", e.target.value)
              }
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="time"
              value={slot.to}
              onChange={(e) =>
                handleTimeSlotChange(dayId, index, "to", e.target.value)
              }
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            />
            {index === 0 ? (
              <button
                type="button"
                onClick={() => addTimeSlot(dayId)}
                className="p-1 text-white rounded  bg-green-600 hover:bg-green-700 cursor-pointer"
              >
                <Plus className="" size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => removeTimeSlot(dayId, index)}
                className="p-1 text-white rounded  bg-red-600 hover:bg-red-700 cursor-pointer"
              >
                <X className="" size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="">
      <h4 className="text-[15px] font-semibold text-gray-900 mb-4">
        Change Consultant Timings
      </h4>
      <SocketHandler
        otherSetters={[{ setFn: setAllConsultants, isBookingList: false }]}
      />
      <div className="">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Select Consultant
        </label>
        <Select
          options={consultantOptions}
          value={selectedConsultant}
          onChange={setSelectedConsultant}
          placeholder="Choose a consultant..."
          isClearable
          className="max-w-md"
        />
      </div>

      {selectedConsultant && consultantSettings && (
        <div className="space-y-6 mt-6 ">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Working Hours */}
            <div className="bg-white p-4 rounded shadow-md border border-gray-200">
              <h4 className="text-base font-semibold mb-3 border-b border-gray-100 pb-2">
                Working Hours
              </h4>

              <div className="space-y-2">
                {weekDays.map((day) => (
                  <div
                    key={day.id}
                    className="flex items-start gap-4 pb-3 bg-gray-100 rounded py-2 px-3"
                  >
                    {/* Checkbox + Label */}
                    <div className="flex items-center min-w-[110px]">
                      <input
                        type="checkbox"
                        id={`day-${day.id}`}
                        checked={formData.selectedWeekDays.includes(day.id)}
                        onChange={(e) =>
                          handleWeekDayChange(day.id, e.target.checked)
                        }
                        className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`day-${day.id}`}
                        className="font-medium text-sm text-gray-700"
                      >
                        {day.name}
                      </label>
                    </div>

                    {/* Time slots */}
                    <div className="flex-1">{renderTimeSlots(day.id)}</div>
                  </div>
                ))}
              </div>

              {/* Saturday Week Off */}
              <div className="mt-4">
                <div className="text-base font-semibold mb-3 border-b border-gray-100 pb-2">
                  Saturday Week Off
                </div>
                <div className="flex flex-wrap gap-4">
                  {[1, 2, 3, 4, 5].map((week) => (
                    <label
                      key={week}
                      className="flex items-center text-sm text-gray-600 bg-gray-100 p-2 rounded py-1 hover:bg-gray-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id={`week-${week}`}
                        checked={formData.saturdayOff.includes(week)}
                        onChange={(e) =>
                          handleSaturdayOffChange(week, e.target.checked)
                        }
                        className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                      />
                      {week === 1
                        ? "1st"
                        : week === 2
                        ? "2nd"
                        : week === 3
                        ? "3rd"
                        : `${week}th`}{" "}
                      Week
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Timezone and Exclusions */}
            <div className="bg-white p-4 rounded shadow-md border border-gray-200">
              {/* Timezone */}
              <div className="mb-6">
                <h4 className="text-base font-semibold mb-3 border-b border-gray-100 pb-2">
                  Timezone
                </h4>
                <p className="text-sm text-gray-500 mb-1">
                  Select the timezone for your calendar.
                </p>
                <Select
                  options={timezoneOptions}
                  value={formData.timezone}
                  onChange={(option) =>
                    setFormData((prev) => ({
                      ...prev,
                      timezone: option,
                    }))
                  }
                  getOptionValue={(opt) => opt.id}
                  getOptionLabel={(opt) => opt.label}
                  placeholder="Select timezone..."
                />
              </div>

              {/* Exclusions */}
              <div>
                <h4 className="text-base font-semibold mb-3 border-b border-gray-100 pb-2">
                  Exclusions
                </h4>
                <p className="text-sm text-gray-500 mb-1">
                  Add dates or a custom range to exclude from your availability
                  (holidays, vacation, etc.).
                </p>

                {/* Existing exclusions */}
                {formData.exclusions.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {formData.exclusions.map((exclusion, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm">
                            {exclusion.includes(" to ")
                              ? exclusion
                              : new Date(exclusion).toLocaleDateString("en-GB")}
                          </span>
                          <select
                            value={(formData.exclusionDetails && formData.exclusionDetails[index]) || "full"}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                exclusionDetails: prev.exclusionDetails.map((d, i) => (i === index ? value : d)),
                              }));
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            <option value="full">Full day</option>
                            <option value="first_half">First half</option>
                            <option value="second_half">Second half</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeExclusion(index)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add exclusion */}
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center text-sm">
                      <input
                        type="radio"
                        name="exclusionType"
                        value="date"
                        checked={tempExclusion.type === "date"}
                        onChange={(e) =>
                          setTempExclusion((prev) => ({
                            ...prev,
                            type: e.target.value,
                            endDate: "",
                          }))
                        }
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      Single date
                    </label>
                    <label className="flex items-center text-sm">
                      <input
                        type="radio"
                        name="exclusionType"
                        value="ranges"
                        checked={tempExclusion.type === "ranges"}
                        onChange={(e) =>
                          setTempExclusion((prev) => ({
                            ...prev,
                            type: e.target.value,
                          }))
                        }
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      Date ranges
                    </label>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <input
                      type="date"
                      value={tempExclusion.startDate}
                      onChange={(e) =>
                        setTempExclusion((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      min={today} // 🚫 no past / today
                      className="px-3 py-1 border border-gray-300 rounded w-[160px] text-[13px]"
                    />
                    {tempExclusion.type === "ranges" && (
                      <input
                        type="date"
                        value={tempExclusion.endDate}
                        onChange={(e) =>
                          setTempExclusion((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        min={today} // 🚫 no past / today
                        className="px-3 py-1 border border-gray-300 rounded w-[160px] text-[13px]"
                      />
                    )}
                    <select
                      value={tempExclusion.detail}
                      onChange={(e) =>
                        setTempExclusion((prev) => ({ ...prev, detail: e.target.value }))
                      }
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="full">Full day</option>
                      <option value="first_half">First half</option>
                      <option value="second_half">Second half</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleExclusionAdd}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="" size={12} />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !selectedConsultant}
              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultantTimings;
