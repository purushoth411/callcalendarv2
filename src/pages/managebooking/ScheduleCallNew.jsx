import React, { useEffect, useState } from "react";
import SkeletonLoader from "../../components/SkeletonLoader.jsx";
import { useParams } from "react-router-dom";
import Calendar from "./Calendar";
import CalendarLoader from "./CalendarLoader.jsx";
import toast from "react-hot-toast";
import { TimeZones } from "../../helpers/TimeZones";
import moment from "moment-timezone";

import { getSocket } from "../../utils/Socket.jsx";
import { useAuth } from "../../utils/idb.jsx";
import { formatDate } from "../../helpers/CommonHelper.jsx";
import API_URL from "../../utils/constants.jsx";

const ScheduleCallNew = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timezoneList, setTimezoneList] = useState(TimeZones);
  const [selectedTimezone, setSelectedTimezone] = useState("Asia/Kolkata");
  const [questionData, setQuestionData] = useState({ count: 0, questions: "" });
  const [consultantName, setConsultantName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookingDetails, setBookingDetails] = useState(null);
  const [consultantSettings, setConsultantSettings] = useState(null);
  const [consultantPresaleSlots, setConsultantPresaleSlots] = useState(null);
  const [error, setError] = useState("");
  const [callLink, setCallLink] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { bookingId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookingDetailsWithRc = async () => {
    try {
      setBookingDetails(null);
      setConsultantSettings(null);
      setConsultantPresaleSlots([])
      setConsultantName("");
      setAvailableSlots([]);
      setSelectedSlot("");
      setSelectedDate("");
      setQuestionData({ count: 0, questions: "" });
      setCallLink("");
      setSubmitMessage("");
      setError("");
      const response = await fetch(
        `${API_URL}/api/helpers/getBookingDetailsWithRc?id=${bookingId}`
      );
      const data = await response.json();

      if (data.status) {
        setBookingDetails(data.bookingDetails);
        setConsultantSettings(data.consultantSettings);
        setConsultantPresaleSlots(data?.consultantPresaleSlots ?? {})
        setConsultantName(data.consultantSettings?.fld_consultant_name || "");
        setError("");
      } else {
        setError(data.message || "Failed to fetch booking details");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetailsWithRc();
  }, []);

  ///socket ////////

  useEffect(() => {
    const socket = getSocket();

    const handleBookingConfirmed = (consultantId, date, slot) => {
      console.log("Socket Called - Booking Confirmed");

      const selectedDateFormatted = selectedDate.tz("Asia/Kolkata").format("YYYY-MM-DD");
      const eventDateFormatted = moment.tz(date, "YYYY-MM-DD", "Asia/Kolkata").format("YYYY-MM-DD");

      if (bookingDetails?.fld_consultantid == consultantId) {
        console.log(
          "Refreshing booking details due to matching bookingConfirmed event"
        );
        fetchBookingDetailsWithRc();
      }
    };

    const handleConsultantSlots = (data) => {
      console.log("Socket Called - Slot Changed");

      //  const selectedDateFormatted = selectedDate.tz("Asia/Kolkata").format("YYYY-MM-DD");
      //   const eventDateFormatted = moment.tz(date, "YYYY-MM-DD", "Asia/Kolkata").format("YYYY-MM-DD");
      console.log("Incoming data:", data);
      console.log(" bookingDetails.fld_consultantid:", bookingDetails.fld_consultantid);
      if (bookingDetails?.fld_consultantid == data.consultantid) {
        console.log(
          "Refreshing booking details due to matching bookingConfirmed event"
        );
        fetchBookingDetailsWithRc();
      }
    };

    socket.on("bookingConfirmed", handleBookingConfirmed);
    socket.on("slotChanged", handleConsultantSlots);

    return () => {
      socket.off("bookingConfirmed", handleBookingConfirmed);
      socket.off("slotChanged", handleConsultantSlots);
    };
  }, [user.id, bookingDetails?.fld_consultantid]);

  ////////socket////////

  const handleTimezoneChange = (e) => {
    setSelectedTimezone(e.target.value);
  };

  // Helper function to convert time string to minutes for comparison
  const timeToMinutes = (timeStr) => {
    const [hourStr, minPart] = timeStr.split(":");
    const [minute, meridiem] = (minPart || "").split(" ");
    if (!minute || !meridiem) return 0;
    
    let hour = parseInt(hourStr, 10);
    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    
    return hour * 60 + parseInt(minute, 10);
  };

  const handleDateSelect = async (dateStr, dayKey, emptySlot = true) => {
    setLoadingSlots(true);
    setSelectedDate(dateStr);
    if (emptySlot) {
      setSelectedSlot("");
    }

    if (!consultantSettings) return;

    const dayFieldMap = {
      sun: "fld_sun_time_data",
      mon: "fld_mon_time_data",
      tue: "fld_tue_time_data",
      wed: "fld_wed_time_data",
      thu: "fld_thu_time_data",
      fri: "fld_fri_time_data",
      sat: "fld_sat_time_data",
    };

    const blockFieldMap = {
      sun: "fld_sun_time_block",
      mon: "fld_mon_time_block",
      tue: "fld_tue_time_block",
      wed: "fld_wed_time_block",
      thu: "fld_thu_time_block",
      fri: "fld_fri_time_block",
      sat: "fld_sat_time_block",
    };

    const normalizeTime = (time) => {
      const m = moment.tz(time, ["h:mm A"], "Asia/Kolkata");
      return m.isValid() ? m.format("h:mm A") : null;
    };

    const timeData = consultantSettings[dayFieldMap[dayKey]];
    const blockData = consultantSettings[blockFieldMap[dayKey]] || "";

    if (!timeData) return setAvailableSlots([]);

    const blockedSlots = blockData
      .split("-")
      .map((s) => normalizeTime(s))
      .filter((s) => s && s !== "Invalid date");

    // Half-day exclusions will be applied after slot generation

    const slotRanges = timeData.split("~");
    let generatedSlots = [];

    slotRanges.forEach((range) => {
      const [start, end] = range.split("||");
      if (!start || !end) return;

      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);

      let current = moment.tz({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 }, "Asia/Kolkata");
      let endTime = moment.tz({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 }, "Asia/Kolkata");

      while (current <= endTime) {
        const slot = current.format("h:mm A"); // formatted slot in IST
        const normalizedSlot = normalizeTime(slot); // use your timezone-aware normalizeTime
        if (!blockedSlots.includes(normalizedSlot)) {
          generatedSlots.push(normalizedSlot);
        }

        current = current.clone().add(30, "minutes"); // move to next slot
      }
    });

    // Apply half-day exclusions for the selected date (boundary at 2:00 PM IST)
    try {
      if (consultantSettings?.fld_days_exclusion) {
        const excludedDates = consultantSettings.fld_days_exclusion
          .split("|~|")
          .map((d) => d.trim());
        const details = (consultantSettings.fld_days_exclusion_details || "")
          .split("|~|")
          .map((d) => (d || "full").trim());

        const idx = excludedDates.findIndex((d) => d === dateStr);
        if (idx !== -1) {
          const detail = details[idx] || "full";
          if (detail === "first_half" || detail === "second_half") {
            const boundaryMinutes = 14 * 60; // 2:00 PM

            const toBlock = [];
            generatedSlots.forEach((slot) => {
              const [hourStr, minPart] = slot.split(":");
              const [minute, meridiem] = (minPart || "").split(" ");
              if (!minute || !meridiem) return;
              let hour = parseInt(hourStr, 10);
              if (meridiem === "PM" && hour !== 12) hour += 12;
              if (meridiem === "AM" && hour === 12) hour = 0;
              const minutes = hour * 60 + parseInt(minute, 10);
              if (detail === "first_half" && minutes <= boundaryMinutes) toBlock.push(slot);
              if (detail === "second_half" && minutes > boundaryMinutes) toBlock.push(slot);
            });

            toBlock.forEach((s) => {
              const n = normalizeTime(s);
              if (n && n !== "Invalid date" && !blockedSlots.includes(n)) blockedSlots.push(n);
            });
          }
        }
      }
    } catch (e) {
      console.warn("Error applying half-day exclusions:", e);
    }

    try {
      const res1 = await fetch(
        `${API_URL}/api/helpers/getBookingData`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            consultantId: bookingDetails.fld_consultantid,
            selectedDate: dateStr,
            status: "Reject",
            hideSubOption: "HIDE_SUB_OPT",
            callExternalAssign: "No",
            showAcceptedCall: "Yes",
            checkType: "CHECK_BOTH",
          }),
        }
      );

      const data1 = await res1.json();

      const res2 = await fetch(
        `${API_URL}/api/helpers/getRcCallBookingRequest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            consultantId: 143,
            selectedDate: dateStr,
          }),
        }
      );

      const data2 = await res2.json();

      const bookedSlots = [];

      if (data1?.data?.length) {
        data1.data.forEach((item) => {
          if (!item.fld_booking_slot) return;

          const normalizedSlot = normalizeTime(item.fld_booking_slot);
          bookedSlots.push(normalizedSlot);

          if (
            item.fld_sale_type === "Postsales" &&
            item.fld_call_confirmation_status === "Call Confirmed by Client" &&
            item.fld_consultation_sts === "Accept"
          ) {
            const slotTime = new Date(`1970-01-01 ${normalizedSlot}`);
            const prev = new Date(slotTime.getTime() - 30 * 60 * 1000);
            const next = new Date(slotTime.getTime() + 30 * 60 * 1000);

            const prevSlot = prev.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });

            const nextSlot = next.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });

            bookedSlots.push(normalizeTime(prevSlot));
            bookedSlots.push(normalizeTime(nextSlot));
          }
        });
      }

      if (data2?.data?.length) {
        data2.data.forEach((item) => {
          if (item.slot_time) {
            bookedSlots.push(normalizeTime(item.slot_time));
          }
        });
      }
      bookedSlots.push("2:00 PM");
      let finalAvailableSlots = generatedSlots.filter(
        (slot) => !bookedSlots.includes(slot) && !blockedSlots.includes(slot)
      );

      const selectedDate = moment.tz(dateStr, "YYYY-MM-DD", "Asia/Kolkata");
      const today = moment.tz("Asia/Kolkata");

      // If the booking date is today
      if (selectedDate.isSame(today, "day")) {
        const timeBufferMinutes = bookingDetails.fld_sale_type === "Postsales" ? 1 * 60 : 15;

        // minTime in Asia/Kolkata
        const minTime = moment.tz("Asia/Kolkata").add(timeBufferMinutes, "minutes");

        finalAvailableSlots = finalAvailableSlots.filter((slot) => {
          const [hourStr, minPart] = slot.split(":");
          const [minute, meridiem] = minPart.split(" ");
          let hour = parseInt(hourStr, 10);
          if (meridiem === "PM" && hour !== 12) hour += 12;
          if (meridiem === "AM" && hour === 12) hour = 0;

          const slotMoment = moment.tz(selectedDate.format("YYYY-MM-DD"), "YYYY-MM-DD", "Asia/Kolkata")
            .set({ hour, minute: parseInt(minute, 10), second: 0, millisecond: 0 });

          return slotMoment.isSameOrAfter(minTime);
        });
      }

      // Postsales max time restriction
      if (bookingDetails.fld_sale_type === "Postsales") {
        const maxTime = moment.tz(selectedDate.format("YYYY-MM-DD") + " 17:00", "YYYY-MM-DD HH:mm", "Asia/Kolkata");
        console.log(maxTime)
        finalAvailableSlots = finalAvailableSlots.filter((slot) => {
          const [hourStr, minPart] = slot.split(":");
          const [minute, meridiem] = minPart.split(" ");
          let hour = parseInt(hourStr, 10);
          if (meridiem === "PM" && hour !== 12) hour += 12;
          if (meridiem === "AM" && hour === 12) hour = 0;

          const slotMoment = moment.tz(selectedDate.format("YYYY-MM-DD"), "YYYY-MM-DD", "Asia/Kolkata")
            .set({ hour, minute: parseInt(minute, 10), second: 0, millisecond: 0 });

          return slotMoment.isSameOrBefore(maxTime);
        });

      }

      // Filter slots for Presales SENIOR consultants based on consultantPresaleSlots
      if (bookingDetails.fld_sale_type === "Presales" && bookingDetails?.consultant_role === "SENIOR") {
        const selectedDateMoment = moment.tz(dateStr, "YYYY-MM-DD", "Asia/Kolkata");
        const dayOfWeek = selectedDateMoment.format('ddd').toLowerCase(); // sun, mon, tue, etc.
        
        // Map day names to field names
        const dayFieldMap = {
          sun: "sun_time",
          mon: "mon_time", 
          tue: "tue_time",
          wed: "wed_time",
          thu: "thu_time",
          fri: "fri_time",
          sat: "sat_time"
        };
        
        const dayField = dayFieldMap[dayOfWeek];
        const presaleSlotsForDay = consultantPresaleSlots?.[dayField];
        
        if (presaleSlotsForDay) {
          try {
            const parsedSlots = JSON.parse(presaleSlotsForDay);
            
            // Filter finalAvailableSlots to only include slots that fall within presale time ranges
            finalAvailableSlots = finalAvailableSlots.filter(slot => {
              return parsedSlots.some(slotRange => {
                const [startTime, endTime] = slotRange.split(' - ');
                if (!startTime || !endTime) return false;
                
                // Convert times to minutes for comparison
                const slotMinutes = timeToMinutes(slot);
                const startMinutes = timeToMinutes(startTime.trim());
                const endMinutes = timeToMinutes(endTime.trim());
                
                // Check if slot falls within the range (inclusive of start, exclusive of end)
                return slotMinutes >= startMinutes && slotMinutes < endMinutes;
              });
            });
            
            console.log("Presale slot ranges for", dayOfWeek, ":", parsedSlots);
            console.log("Filtered available slots:", finalAvailableSlots);
          } catch (error) {
            console.error("Error parsing presale slots:", error);
          }
        } else {
          // If no presale slots defined for this day, show no available slots
          finalAvailableSlots = [];
          console.log("No presale slots defined for", dayOfWeek);
        }
      }

      console.log("Generated:", generatedSlots);
      console.log("Blocked:", blockedSlots);
      console.log("Booked:", bookedSlots);
      console.log("Available:", finalAvailableSlots);

      setAvailableSlots(finalAvailableSlots);
    } catch (error) {
      console.error("Error fetching booking data:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    if (!selectedSlot) {
      toast.error("Please select a slot");
      return;
    }
    if (!callLink) {
      toast.error("Please enter link");
      return;
    }

    const urlPattern = /^(https?:\/\/)[\w.-]+(\.[\w\.-]+)+[/#?]?.*$/;
    if (!urlPattern.test(callLink.trim())) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${API_URL}/api/bookings/saveCallScheduling`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: bookingDetails?.id,
            consultantId: bookingDetails?.fld_consultantid,
            secondaryConsultantId: bookingDetails?.fld_secondary_consultant_id,
            bookingDate: selectedDate,
            slot: selectedSlot,
            callLink,
            timezone: selectedTimezone,
            user: user,
          }),
        }
      );

      const result = await response.json();

      if (result.status) {
        toast.success("Booking successfully submitted!");
        setCallLink("");
        setSelectedSlot("");

        setTimeout(() => {
          window.location.href = "https://callcalendar.rapidcollaborate.com/bookings";
        }, 1500);
      } else {
        toast.error("Failed to submit booking.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white">
      <div className="card">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xl font-bold">Schedule Call</h4>
            {consultantName && (
              <span className="text-sm text-gray-600">
                Consultant: <strong>{consultantName}</strong>
              </span>
            )}
          </div>

          <form>
            <input type="hidden" name="booking_date" value={selectedDate} />
            <input
              type="hidden"
              name="que_counter"
              value={questionData.count}
            />
            <input
              type="hidden"
              name="que_fld_data"
              value={questionData.questions}
            />
            <input type="hidden" name="slcttimezone" value={selectedTimezone} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="md:col-span-2">

                {loading && !consultantSettings ? (
                  <CalendarLoader />
                ) : (
                  <>
                    <h4 className="text-[13px] font-medium mb-3 text-gray-700">
                      Select a Date
                    </h4>
                    <div className="">
                      <Calendar
                        height={700}
                        onDateClick={handleDateSelect}
                        consultantSettings={consultantSettings}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Timezone and slots */}
              <div className="flex flex-col  h-full">
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Select Time Zone
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded px-3 py-2"
                    name="timeZone"
                    value={selectedTimezone}
                    onChange={handleTimezoneChange}
                  >
                    {timezoneList.map((value, index) => (
                      <option key={index} value={value.timezone}>
                        {value.timezone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Slots */}
                <div>
                  <h5 className="text-gray-800 font-semibold mb-2">
                    {selectedDate
                      ? `Available Slots for ${formatDate(selectedDate)}`
                      : "Select a date to view slots"}
                  </h5>

                  {loadingSlots ? (
                    // Skeleton loader
                    <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-3">
                      {Array(16)
                        .fill("")
                        .map((_, i) => (
                          <div
                            key={i}
                            className="h-10 bg-gray-200 animate-pulse rounded-md"
                          ></div>
                        ))}
                    </div>
                  ) : availableSlots.length > 0 ? (
                    // Slots display
                    <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-3">
                      {availableSlots.map((slot, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedSlot(slot)}
                          className={`cursor-pointer border border-gray-200 rounded-md text-center py-2 px-3 text-sm transition
          ${selectedSlot === slot
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-gray-50 hover:bg-blue-100"
                            }`}
                        >
                          {slot}
                        </div>
                      ))}
                    </div>
                  ) : selectedDate ? (
                    <p className="text-sm text-red-600">
                      No slots available for this day.
                    </p>
                  ) : null}
                </div>

                {selectedSlot && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block  font-medium text-gray-700 mb-1">
                        Enter Call Link
                      </label>
                      <input
                        type="text"
                        value={callLink}
                        onChange={(e) => setCallLink(e.target.value)}
                        className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                        placeholder="https://zoom.us/..."
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </button>
                    </div>

                    {submitMessage && (
                      <p className="text-sm text-green-600 mt-2">
                        {submitMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCallNew;
