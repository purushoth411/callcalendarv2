import React, { useEffect, useState } from "react";
import SkeletonLoader from "../../components/SkeletonLoader.jsx";
import { useParams } from "react-router-dom";
import Calendar from "./Calendar";
import CalendarLoader from "./CalendarLoader.jsx";
import toast from "react-hot-toast";
import { TimeZones } from "../../helpers/TimeZones";
import { formatDateTimeStr } from "../../helpers/CommonHelper.jsx";
import moment from "moment-timezone";
import { getSocket } from "../../utils/Socket.jsx";
import { useAuth } from "../../utils/idb.jsx";
import API_URL from "../../utils/constants.jsx";

const EditBooking = () => {
  const {user} =useAuth();
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
  const [error, setError] = useState("");
  const [callLink, setCallLink] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
   const { bookingId } = useParams();
   const [isSubmitting,setIsSubmitting]=useState(false);

  const fetchBookingDetailsWithRc = async () => {
  try {
     setBookingDetails(null);
    setConsultantSettings(null);
    setConsultantName("");
    setSelectedDate("");
    setSelectedSlot("");
    setAvailableSlots([]);
    setCallLink("");
    setSelectedTimezone("Asia/Kolkata"); 
    setError("");
    setSubmitMessage("");
    setQuestionData({ count: 0, questions: "" });
    const response = await fetch(
      `${API_URL}/api/helpers/getBookingDetailsWithRc?id=${bookingId}`
    );
    const data = await response.json();

    if (data.status) {
      const bookingDate = data.bookingDetails?.fld_booking_date ?? null;
      const bookingSlot = data.bookingDetails?.fld_booking_slot ?? null;
      const timezone = data.bookingDetails?.fld_timezone ?? "";

      setBookingDetails(data.bookingDetails);
      setConsultantSettings(data.consultantSettings);
      setConsultantName(data.consultantSettings?.fld_consultant_name || "");
      setSelectedDate(bookingDate);
      setSelectedSlot(bookingSlot);
      setCallLink(data.bookingDetails?.fld_call_joining_link ?? "");
      setSelectedTimezone(timezone);

      const dayName = bookingDate
        ? new Date(bookingDate).toLocaleDateString("en-US", { weekday: "short" }).toLowerCase()
        : "";

      // ✅ safe to call here because we use bookingDate & dayName directly
      handleDateSelect(bookingDate, dayName, false);

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

  useEffect(() => {
    fetchBookingDetailsWithRc();
  }, []);

  // useEffect(() => {
  //   if (!selectedDate) {
  //     return
  //   }
  //   console.log("selectedDate", selectedDate)
  //   handleDateSelect(selectedDate, 'tue')
  // }, [selectedDate])
  useEffect(() => {
    const localSelectedDate=selectedDate ||bookingDetails?.fld_booking_date ;
  if (!localSelectedDate) return;

  console.log("selectedDate", localSelectedDate);


  const dateObj = new Date(localSelectedDate);

  
  const day = dateObj.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();

  handleDateSelect(localSelectedDate, day);
}, [selectedDate]);


  useEffect(() => {
    console.log("selectedSlot", selectedSlot)
  }, [selectedSlot])

    useEffect(()=>{
    console.log("selectedTimezone", selectedTimezone)
  },[selectedTimezone])

  const handleTimezoneChange = (e) => {
    setSelectedTimezone(e.target.value);
  };

 const handleDateSelect = async (dateStr, dayKey, emptySlot = true) => {
  console.log("handleDateSelect called with dateStr:", dateStr, "dayKey:", dayKey);
  setLoadingSlots(true);
  setSelectedDate(dateStr);
  if(emptySlot){
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

const normalizeTime = (time) =>
  moment.tz(time, ["h:mm A"], "Asia/Kolkata").format("h:mm A");

  const timeData = consultantSettings[dayFieldMap[dayKey]];
  const blockData = consultantSettings[blockFieldMap[dayKey]] || "";

  if (!timeData) return setAvailableSlots([]);

  const blockedSlots = blockData
    .split("-")
    .map((s) => normalizeTime(s))
    .filter((s) => s !== "");

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
      (slot) => !bookedSlots.includes(slot)
    );

  



// If the booking date is today
const selectedDate = moment.tz(dateStr, "YYYY-MM-DD", "Asia/Kolkata");
const today = moment.tz("Asia/Kolkata");

// Only for today
if (selectedDate.isSame(today, "day")) {
  const timeBufferMinutes = bookingDetails.fld_sale_type === "Postsales" ? 4 * 60 : 15;

  // minTime in Asia/Kolkata timezone
  const minTime = moment.tz("Asia/Kolkata").add(timeBufferMinutes, "minutes");

  finalAvailableSlots = finalAvailableSlots.filter((slot) => {
    // Attach selectedDate to slot for proper comparison
    const [hour, minutePart] = slot.split(":");
    const [minute, meridiem] = minutePart.split(" ");
    let hour24 = parseInt(hour, 10);
    if (meridiem === "PM" && hour24 !== 12) hour24 += 12;
    if (meridiem === "AM" && hour24 === 12) hour24 = 0;

    const slotMoment = moment.tz(selectedDate.format("YYYY-MM-DD"), "YYYY-MM-DD", "Asia/Kolkata")
      .set({ hour: hour24, minute: parseInt(minute, 10), second: 0, millisecond: 0 });

    return slotMoment.isSameOrAfter(minTime);
  });
}

// Postsales max time limit
if (bookingDetails.fld_sale_type === "Postsales") {
  const maxTime = moment.tz(selectedDate.format("YYYY-MM-DD") + " 17:00", "YYYY-MM-DD HH:mm", "Asia/Kolkata");

  finalAvailableSlots = finalAvailableSlots.filter((slot) => {
    const [hour, minutePart] = slot.split(":");
    const [minute, meridiem] = minutePart.split(" ");
    let hour24 = parseInt(hour, 10);
    if (meridiem === "PM" && hour24 !== 12) hour24 += 12;
    if (meridiem === "AM" && hour24 === 12) hour24 = 0;

    const slotMoment = moment.tz(selectedDate.format("YYYY-MM-DD"), "YYYY-MM-DD", "Asia/Kolkata")
      .set({ hour: hour24, minute: parseInt(minute, 10), second: 0, millisecond: 0 });

    return slotMoment.isSameOrBefore(maxTime);
  });
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
        `${API_URL}/api/bookings/updateCallScheduling`,
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
        toast.errro("Failed to submit booking.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("An error occurred during submission.");
    }finally{
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white">
      <div className="card ">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xl font-bold">Re-Schedule Call</h4>
            <strong>
              {bookingDetails?.fld_name?bookingDetails.fld_name.charAt(0).toUpperCase()+bookingDetails.fld_name.slice(1):""} -{" "}
              {formatDateTimeStr(
                bookingDetails?.fld_booking_date,
                bookingDetails?.fld_booking_slot
              )}
            </strong>
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
                {loading ? (
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
                        selectedDateState={selectedDate}
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
                      ? `Available Slots for ${selectedDate}`
                      : "Select a date to view slots"}
                  </h5>

                  {loadingSlots ? (
                    // Skeleton loader
                    <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-3 border-gray-100 border">
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
                    <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-3 border-gray-100 border">
                      {availableSlots.map((slot, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedSlot(slot)}
                          className={`cursor-pointer border border-gray-200 rounded-md text-center py-2 px-3 text-sm transition
          ${selectedSlot == slot
                              ? "bg-[#fa713b] text-white border-[#fa713b]"
                              : "bg-gray-50 hover:bg-orange-100"
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
                      className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                    >
                      {isSubmitting ? "Updating...":"Update"}
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

export default EditBooking;
