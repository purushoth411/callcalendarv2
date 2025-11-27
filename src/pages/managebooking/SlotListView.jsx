import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../utils/idb.jsx";
import API_URL from "../../utils/constants.jsx";
import moment from "moment-timezone";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    formatBookingDateTime,
    formatDate,
    getConsultationStatusClass,
    getCurrentDate,
    getDateBefore,
} from "../../helpers/CommonHelper.jsx";
import { RefreshCcw } from "lucide-react";
import StatusUpdate from "./StatusUpdate.jsx";

function toHalfHourBucketLabel(dateStr, timeStr, tz = "Asia/Kolkata") {
    if (!dateStr || !timeStr) return "Invalid";

    // Normalize 12-hour time like "3:30 PM" → 24-hour
    const [hhmm, ampmRaw] = timeStr.trim().split(" ");
    const [hStr, mStr] = hhmm.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const ampm = (ampmRaw || "").toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    const dt = moment.tz(`${dateStr} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`, tz);

    // Snap to start of half-hour window
    const minute = dt.minute() < 30 ? 0 : 30;
    const start = dt.clone().minute(minute).second(0);
    const end = start.clone().add(30, "minutes");

    const fmt = "h:mm A";
    return `${start.format(fmt)} - ${end.format(fmt)}`;
}

function formatDayHeading(dateStr, tz = "Asia/Kolkata") {
    const d = moment.tz(dateStr, tz);
    const today = moment.tz(tz).startOf("day");
    const tomorrow = today.clone().add(1, "day");
    if (d.isSame(today, "day")) return "Today";
    if (d.isSame(tomorrow, "day")) return "Tomorrow";
    return d.format("dddd, DD MMM YYYY");
}

const ScheduleSkeleton = ({ rows = 6 }) => {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex justify-between items-center border border-gray-200 rounded-md p-3"
          >
            {/* Left side - time range */}
            <div className="h-4 bg-gray-300 rounded w-40"></div>
  
            {/* Right side - call count */}
            <div className="h-4 w-10 bg-green-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  };

export default function SlotListView() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedSlots, setExpandedSlots] = useState(new Set());
    // Default date window: last 7 days through next 2 days (inclusive)
    const tz = "Asia/Kolkata";
    const baseToday = moment.tz(tz).startOf("day");
    const defaultFrom = baseToday.clone().subtract(7, "days").format("YYYY-MM-DD");
    const defaultTo = baseToday.clone().add(2, "days").format("YYYY-MM-DD");
    const todayYmd = baseToday.format("YYYY-MM-DD");
    const [days, setDays] = useState(() => {
        const startM = moment(defaultFrom, "YYYY-MM-DD");
        const endM = moment(defaultTo, "YYYY-MM-DD");
        const diff = Math.max(0, endM.diff(startM, "days"));
        return Array.from({ length: diff + 1 }, (_, i) => startM.clone().add(i, "day").format("YYYY-MM-DD"));
    });
    const [activeDay, setActiveDay] = useState(() => todayYmd);

    const isSuperadmin = user?.fld_admin_type === "SUPERADMIN";




    const [filters, setFilters] = useState({
        sale_type: "",
        call_rcrd_status: "",
        booking_status: [],
        keyword_search: "",
        filter_type: "Booking",
        date_range: [defaultFrom, defaultTo],
    });

    // Helpers to normalize date inputs and compute day list from date range
    const toYmd = (d) => {
        if (!d) return null;
        if (typeof d === "string") return moment(d).format("YYYY-MM-DD");
        return moment(d).format("YYYY-MM-DD");
    };

    

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const payload = {
                userId: user?.id,
                userType: user?.fld_admin_type,
                subAdminType: user?.fld_subadmin_type,
                assigned_team: user?.fld_team_id || "",
                filters: {
                    ...filters,
                    date_range: [toYmd(filters.date_range[0]), toYmd(filters.date_range[1])],
                },
            };
            const res = await fetch(`${API_URL}/api/bookings/fetchBooking`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            setBookings(json.status ? json.data || [] : []);
        } catch (e) {
            setBookings([]);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, [user?.id, user?.fld_admin_type, user?.fld_subadmin_type, user?.fld_team_id, days]);

    const groupedByDayAndSlot = useMemo(() => {
        const map = new Map(); // day -> Map(slotLabel -> count)
        for (const b of bookings) {
            const day = b.fld_booking_date;
            const slotLabel = toHalfHourBucketLabel(b.fld_booking_date, b.fld_booking_slot, b.fld_timezone || "Asia/Kolkata");
            if (!map.has(day)) map.set(day, new Map());
            const dayMap = map.get(day);
            dayMap.set(slotLabel, (dayMap.get(slotLabel) || 0) + 1);
        }
        // Sort slots by start time within each day
        const sorted = new Map();
        for (const [day, slots] of map.entries()) {
            const entries = Array.from(slots.entries());
            entries.sort((a, b) => {
                const startA = a[0].split(" - ")[0];
                const startB = b[0].split(" - ")[0];
                const pa = moment(startA, "h:mm A");
                const pb = moment(startB, "h:mm A");
                return pa.valueOf() - pb.valueOf();
            });
            sorted.set(day, entries);
        }
        return sorted;
    }, [bookings]);

    const activeSlots = useMemo(() => {
        const entries = groupedByDayAndSlot.get(activeDay) || [];
        return entries;
    }, [groupedByDayAndSlot, activeDay]);

    const getTotalForDay = (day) => {
        return groupedByDayAndSlot.get(day)?.reduce?.((acc, [, c]) => acc + c, 0) || 0;
    };

    const navigate = useNavigate();

    const toggleSlot = (slotLabel) => {
        setExpandedSlots((prev) => {
            const next = new Set(prev);
            if (next.has(slotLabel)) next.delete(slotLabel);
            else next.add(slotLabel);
            return next;
        });
    };

    const getBookingsForSlot = (slotLabel) => {
        return bookings
            .filter((b) => b.fld_booking_date === activeDay)
            .filter((b) => toHalfHourBucketLabel(b.fld_booking_date, b.fld_booking_slot, b.fld_timezone || "Asia/Kolkata") === slotLabel)
            .sort((a, b) => {
                const ta = moment(a.fld_booking_slot, "h:mm A");
                const tb = moment(b.fld_booking_slot, "h:mm A");
                return ta.valueOf() - tb.valueOf();
            });
    };

    const getCallStatusUpdationPending = (row) => {
        if (row.fld_consultation_sts === "Accept") {
            const bookingSlot = row.fld_booking_slot;
            const bookingDate = row.fld_booking_date;
            const slotDateTime = new Date(`${bookingDate} ${bookingSlot}`);
            const callEndTime = new Date(slotDateTime.getTime() + 30 * 60000);
            const oneHourAfterEndTime = new Date(callEndTime.getTime() + 60 * 60000);
            const now = new Date();
            const currentDate = now.toISOString().split("T")[0];
            if (bookingDate < currentDate) return "Call status updation pending";
            if (bookingDate === currentDate && now >= oneHourAfterEndTime) return "Call status updation pending";
            return "";
        }
        return "";
    };

    const handleCrmStatusUpdate = async (id, status) => {
        if (!status) {
            toast.error("Select any status");
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/bookings/updateStatusByCrm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingid: id, statusByCrm: status, user }),
            });
            const result = await response.json();
            if (result.status === true || result.status === "true") {
                toast.success("Status Updated Successfully");
                fetchData();
            } else {
                toast.error(result.message || "Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred while updating status");
        }
    };

    
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Date filters removed per requirement */}
            <div className="px-3 py-2 bg-[#d7efff7d] flex items-center justify-between">

                <div className="w-full flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">

                        <h2 className="text-[16px] font-semibold text-gray-900">Slot List View</h2>

                    </div>

                    <button
                        className="border border-gray-500 text-gray-500 hover:text-white px-2 py-1 rounded hover:bg-gray-500 text-sm ml-3  cursor-pointer"
                        onClick={fetchData}
                    >
                        <RefreshCcw size={13} />
                    </button>
                </div>
            </div>

            <div className="px-3 pt-3">
                <div className="flex flex-wrap gap-2 mb-3">
                    {days.map((d) => (
                        <button
                            key={d}
                            onClick={() => setActiveDay(d)}
                            className={`px-2 py-1 rounded text-[11px] border ${activeDay === d ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"
                                }`}
                        >
                            {formatDayHeading(d)}
                            <span
                                className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getTotalForDay(d) === 0 ? "bg-red-300 text-red-900" : "bg-blue-100 text-blue-800"}`}
                            >
                                {getTotalForDay(d)}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mb-3">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border border-blue-200 bg-blue-50 text-blue-700">
                            {formatDayHeading(activeDay)}
                        </span>
                        <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getTotalForDay(activeDay) === 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
                       >
                            {getTotalForDay(activeDay)} {getTotalForDay(activeDay) === 1 ? "call" : "calls"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-3">
                {isLoading ? (
                    <ScheduleSkeleton rows={10} />
                ) : activeSlots.length === 0 ? (
                    <div className="text-sm text-gray-500">No calls found for this day.</div>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {activeSlots.map(([slotLabel, count]) => {
                            const isOpen = expandedSlots.has(slotLabel);
                            const slotBookings = isOpen ? getBookingsForSlot(slotLabel) : [];
                            return (
                                <div key={slotLabel} className="border border-gray-200 rounded-md bg-white">
                                    <button
                                        type="button"
                                        onClick={() => toggleSlot(slotLabel)}
                                        className="w-full p-3 flex items-center justify-between text-left"
                                    >
                                        <div className="text-[13px] font-medium text-gray-800">{slotLabel}</div>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${count === 0 ? "bg-red-300 text-red-900" : "bg-green-100 text-green-700"}`}>
                                            {count} {count === 1 ? "call" : "calls"}
                                        </span>
                                    </button>
                                    {isOpen && (
                                        <div className="px-3 pb-3">
                                            {slotBookings.length === 0 ? (
                                                <div className="text-sm text-gray-500">No calls in this slot.</div>
                                            ) : (
                                                <div className="overflow-x-auto border border-gray-200 rounded">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Client</th>
                                                                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Consultant</th>
                                                                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Added By</th>
                                                                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Booking Info</th>
                                                                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Call Type</th>
                                                                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-100">
                                                            {slotBookings.map((row) => {
                                                                const clientId = row.fld_client_id || "";
                                                                const isDeleted = row.delete_sts === "Yes";
                                                                const displayText = `${row.client_name} - ${clientId}`;
                                                                const formatted = formatBookingDateTime(row.fld_booking_date, row.fld_booking_slot);
                                                                const call_status_updation_pending = getCallStatusUpdationPending(row);
                                                                return (
                                                                    <tr key={row.id} className={getConsultationStatusClass(row) || ""}>
                                                                        <td className="px-3 py-2 text-[12px]">
                                                                            <button
                                                                                className={`font-medium text-blue-600 hover:underline truncate ${isDeleted ? "line-through text-gray-400" : ""}`}
                                                                                onClick={() => navigate(`/admin/booking_detail/${row.id}`)}
                                                                            >
                                                                                {displayText}
                                                                            </button>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-[12px] text-gray-700">{row.consultant_name || ""}</td>
                                                                        <td className="px-3 py-2 text-[12px] text-gray-700">{row.crm_name || ""}</td>
                                                                        <td className="px-3 py-2 text-[12px] text-gray-700">{formatted}</td>
                                                                        <td className="px-3 py-2 text-[12px]">
                                                                            {row.fld_sale_type === "Presales" ? (
                                                                                <span className="text-blue-600 font-semibold">Presales</span>
                                                                            ) : row.fld_sale_type === "Postsales" ? (
                                                                                <span className="text-green-600 font-semibold">Postsales</span>
                                                                            ) : (
                                                                                <span className="text-gray-600">{row.fld_sale_type}</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-[12px]">
                                                                            <StatusUpdate
                                                                                row={row}
                                                                                user={user}
                                                                                onCrmStatusChange={handleCrmStatusUpdate}
                                                                                call_status_updation_pending={call_status_updation_pending}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}


