import toast from "react-hot-toast";
import moment from "moment-timezone";
export const toastInfo = (message) =>
  toast(message, {
    icon: "ℹ️",
    style: {
      background: "#3b82f6", // blue
      color: "#fff",
    },
  });

export const toastWarning = (message) =>
  toast(message, {
    icon: "⚠️",
    style: {
      background: "#facc15", // yellow
      color: "#000",
    },
  });

export const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date)) return "";

  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  return `${day < 10 ? "0" + day : day} ${month} ${year}`;
};

export const formatBookingDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return "";

  // Combine to create a valid Date object
  const [hours, minutesPart] = timeStr.split(':');
  const [minutes, period] = minutesPart.split(' ');
  const hour = parseInt(hours) + (period === 'PM' && hours !== '12' ? 12 : 0);
  const isoTime = `${hour.toString().padStart(2, '0')}:${minutes}:00`;

  const dateTimeStr = `${dateStr}T${isoTime}`;
  const date = new Date(dateTimeStr);

  const options = {
    weekday: "short", // Tue
    day: "2-digit",   // 15
    month: "short",   // Jul
    year: "numeric",  // 2025
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  return date.toLocaleString("en-US", options); // Output: Tue, 15 Jul, 2025, 10:00 AM
};

export const callRegardingOptions = {
  Presales: {
    1: "Understanding the client's requirements in detail",
    2: "Client needs to talk to the expert",
    3: "Brainstorming Call",
    4: "Client asked for a discount and needed re-discussion",
    5: "Understanding and giving confidence to the client",
  },
  Postsales: {
    1: "Understanding the client's requirements in detail",
    2: "Client needs to talk to the expert",
    3: "Brainstorming Call",
    4: "Client requested discussion on work provided",
    5: "Understanding and giving confidence to the client",
  },
};

export const formatDateTimeStr = (dateStr, slotStr = "00:00 AM") => {
  if (!dateStr) return "Invalid date";

  // Normalize slot (e.g., 2:30 PM → 14:30)
  const [time, period] = slotStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (period?.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;

  const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

  const isoString = `${dateStr}T${formattedTime}`;
  const date = new Date(isoString);

  if (isNaN(date.getTime())) return "Invalid date";

  const options = {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  return new Intl.DateTimeFormat("en-GB", options).format(date).replace(",", "");
};

export function getCurrentDate(format = "YYYY-MM-DD") {
  return moment().tz("Asia/Kolkata").format(format);
}

export function getDateBefore(days = 0, format = "YYYY-MM-DD") {
  return moment().tz("Asia/Kolkata").subtract(days, "days").format(format);
} 

export function getConsultationStatusClass(row) {
  let statusClass = "";

//  switch (row.fld_consultation_sts) {
    // case "Completed":
    //   statusClass = "!bg-green-100 !text-green-700"; 
    //   break;
    // case "Reject":
    //   statusClass = "!bg-red-100 !text-red-700"; 
    //   break;
    // case "Accept":
    //   statusClass = "!bg-blue-100 !text-blue-700"; 
    //   break;
    // case "Rescheduled":
    //   statusClass = "bg-indigo-100 text-indigo-700"; 
    //   break;
  //  default:
   //   statusClass = "";
//  }


  if (row.fld_consultation_sts === "Accept") {
    
    const bookingDateTime = moment.tz(`${row.fld_booking_date} ${row.fld_booking_slot}`, "YYYY-MM-DD HH:mm:ss", "Asia/Kolkata");

   
    const callEndTime = bookingDateTime.clone().add(90, "minutes");

    const now = moment.tz("Asia/Kolkata");

    if (bookingDateTime.isBefore(now, "day") || now.isSameOrAfter(callEndTime)) {
      statusClass += " !bg-red-100 !text-red-700"; // pending
    }
  }

  return statusClass;
}






