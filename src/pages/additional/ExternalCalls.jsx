import React, { useEffect, useState, useRef } from "react";
import $ from "jquery";
import DataTable from "datatables.net-react";
import ReactDOMServer from "react-dom/server";
import DT from "datatables.net-dt";
import { useAuth } from "../../utils/idb.jsx";
import {
  formatBookingDateTime,
  formatDate,
} from "../../helpers/CommonHelper.jsx";
import SkeletonLoader from "../../components/SkeletonLoader.jsx";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, useParams } from "react-router-dom";
import { RefreshCcw } from "lucide-react";
import { getSocket } from "../../utils/Socket.jsx";
import API_URL from "../../utils/constants.jsx";
import toast from "react-hot-toast";

export default function ExternalCalls() {
  const { user } = useAuth();

  DataTable.use(DT);

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [historyData, setHistoryData] = useState({}); // Store history for each booking
  const [loadingHistory, setLoadingHistory] = useState(new Set());
  const { dashboard_status } = useParams();

  const navigate = useNavigate();

  const tableRef = useRef(null);

  ///socket ////////

  useEffect(() => {
    const socket = getSocket();

    const handleBookingAdded = (newBooking) => {
      console.log("Socket Called - Booking Added");

      const mappedBooking = {
        ...newBooking,
        client_name: newBooking.user_name,
        client_email: newBooking.user_email,
        client_phone: newBooking.user_phone,
      };

      let canAdd = false;

      if (user.fld_admin_type === "EXECUTIVE") {
        canAdd = newBooking.fld_addedby == user.id;
      } else if (user.fld_admin_type === "CONSULTANT") {
        canAdd =
          newBooking.fld_consultantid == user.id ||
          newBooking.fld_secondary_consultant_id == user.id;
      } else if (user.fld_admin_type === "SUBADMIN") {
        const bookingTeams = Array.isArray(newBooking.fld_teamid)
          ? newBooking.fld_teamid
          : String(newBooking.fld_teamid)
            .split(",")
            .map((id) => id.trim());

        const userTeams = Array.isArray(user.fld_team_id)
          ? user.fld_team_id
          : String(user.fld_team_id)
            .split(",")
            .map((id) => id.trim());

        // check if any team id matches
        const hasTeamMatch = bookingTeams.some((teamId) =>
          userTeams.includes(teamId)
        );

        if (hasTeamMatch) {
          // if (user.fld_subadmin_type === "consultant_sub") {
          //   canAdd =
          //     newBooking.fld_consultantid == user.id ||
          //     newBooking.fld_secondary_consultant_id == user.id;
          // } else {
          //   canAdd = newBooking.fld_addedby == user.id;
          // }
          canAdd = true;
        }
      } else if (user.fld_admin_type === "SUPERADMIN") {
        canAdd = true; // no condition
      }

      if (!canAdd) return; // skip adding

      setBookings((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some((booking) => booking.id == mappedBooking.id)) {
          return list;
        }
        return [mappedBooking, ...list];
      });
    };

    const handleBookingUpdated = (updatedBooking) => {
      console.log("Socket Called - Booking Updated");
      const mappedBooking = {
        ...updatedBooking,
        client_name: updatedBooking.user_name,
        client_email: updatedBooking.user_email,
        client_phone: updatedBooking.user_phone,
      };

      setBookings((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map((booking) =>
          booking.id == mappedBooking.id ? mappedBooking : booking
        );
      });
    };

    const handleMiniStatusUpdated = ({ bookingId, field, value }) => {
      console.log("Socket Called - Mini Status Updated", bookingId, field, value);

      setBookings((prev) => {
        return prev.map((booking) =>
          booking.id === bookingId
            ? { ...booking, [field]: value } // update only the specific field
            : booking
        );
      });
    };

    socket.on("bookingUpdated", handleBookingUpdated);
    socket.on("externalBookingAdded", handleBookingAdded);
    socket.on("miniStatusUpdated", handleMiniStatusUpdated);

    return () => {
      socket.off("bookingUpdated", handleBookingUpdated);
      socket.off("externalBookingAdded", handleBookingAdded);
      socket.off("miniStatusUpdated", handleMiniStatusUpdated);
    };
  }, [user.id]);

  ////////socket////////

  useEffect(() => {
    fetchAllBookings();

    // Cleanup function to destroy DataTable on unmount
    return () => {
      if (tableRef.current) {
        $(tableRef.current).DataTable().destroy();
      }
    };
  }, []);

  // Add effect to handle DataTable reinitialization when data changes
  useEffect(() => {
    if (!isLoading && bookings.length > 0 && tableRef.current) {
      // Destroy existing DataTable if it exists
      if ($.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
      }
    }
  }, [bookings, isLoading]);

  const fetchAllBookings = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${API_URL}/api/additional/getexternalcalls`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_user_id: user?.id,
            session_user_type: user?.fld_admin_type,
          }),
        }
      );

      const result = await response.json();
      if (result.status) {
        setBookings(result.data);
        if (dashboard_status) {
          navigate("/bookings");
        }
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookingHistory = async (bookingId) => {
    if (historyData[bookingId]) return historyData[bookingId];

    setLoadingHistory((prev) => new Set([...prev, bookingId]));

    try {
      const res = await fetch(
        `${API_URL}/api/bookings/history/${bookingId}`
      );
      const result = await res.json();

      const data = result.status ? result.data : [];

      setHistoryData((prev) => ({
        ...prev,
        [bookingId]: data,
      }));

      return data;
    } catch (error) {
      console.error("Error fetching history:", error);
      setHistoryData((prev) => ({
        ...prev,
        [bookingId]: [],
      }));
      return [];
    } finally {
      setLoadingHistory((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  const generateHistoryHTML = (history) => {
    if (!history || history.length === 0) {
      return `<div class="p-3 text-sm text-gray-500">No history found.</div>`;
    }

    return `
    <div class="history-timeline-container relative pl-5">
  <!-- Vertical Line
  <div class="absolute left-2 top-0 h-full border-l-2 border-blue-400"></div> -->

  ${history
        .map(
          (item) => `
      <div class="relative mb-2">
        
        <!-- Timeline Dot -->
        <div class="absolute -left-[10px] top-1.5 w-4 h-4 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center shadow-md">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>

        <!-- Timeline Card -->
        <div class="bg-white shadow-sm rounded-lg py-2 px-4 border border-gray-100">
          <p class="text-gray-800 text-[12px] leading-snug">
            ${item.fld_comment}
          </p>
          <div class="flex items-center text-gray-500 text-[10px] mt-1 leading-snug">
            <i class="fa fa-clock-o mr-1"></i>
            ${formatDate(item.fld_addedon)}
          </div>
        </div>

      </div>
    `
        )
        .join("")}
</div>

  `;
  };

  let columns = [
    {
      title: "Client",
      data: "user_name",
      render: (data, type, row) => {
        const clientId = row.fld_client_id || "";
        const isDeleted = row.delete_sts === "Yes";
        const textStyle = isDeleted ? "line-through text-gray-400" : "";
        const displayText = `${data} - ${clientId}`;
        const shouldShowTooltip = displayText.length > 20;

        const isSuperAdmin = user?.fld_admin_type === "SUPERADMIN";
        const isSubAdmin = user?.fld_admin_type === "SUBADMIN";

        // Helper to render each status
        const renderStatus = (field, label, value) => {
          if (!value) {
            // default NULL → dropdown
            return `
          <div class="mt-1">
            <label class="text-xs text-gray-500">${label}</label>
            <select class="status-dropdown ml-1 text-sm border rounded px-1 py-0.5"
                    data-id="${row.bookingid}"
                    data-field="${field}">
              <option value="">Select</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        `;
          }
          if (value === "Yes") {
            return `
          <div class="mt-1">
            <span class="px-1 py-0.5 bg-green-500 text-white rounded f-11">${label} Done</span>
          </div>
        `;
          }
          return "";
        };


        return `
       <button
        ${shouldShowTooltip
            ? `data-tooltip-id="my-tooltip" data-tooltip-content="${displayText}"`
            : ""
          }
        class="details-btn font-medium text-blue-600 hover:underline truncate w-[150px] text-left ${textStyle}"
        data-id="${row.bookingid}">
        ${displayText}
      </button>

      <!-- Three dropdowns or badges -->

        <div class="flex flex-col gap-1 mt-2">
        ${(isSuperAdmin || (isSubAdmin && user.fld_permission && user.fld_permission.includes("Loop_Tagging")))
            ? renderStatus("loopTagStatus", "Loop Tag", row.loopTagStatus)
            : ""}
        
        ${(isSuperAdmin || (isSubAdmin && user.fld_permission && user.fld_permission.includes("Comment_Received")))
            ? renderStatus("commentReceived", "Comment Received", row.commentReceived)
            : ""}

        ${(isSuperAdmin || (isSubAdmin && user.fld_permission && user.fld_permission.includes("Quote_Shared")))
            ? renderStatus("quoteShared", "Quote Shared", row.quoteShared)
            : ""}
      </div>
      `;
      },
    },
    user.fld_admin_type == "SUPERADMIN" ||
      user.fld_admin_type == "SUBADMIN" ||
      user.fld_admin_type == "EXECUTIVE"
      ? {
        title: "Consultant",
        data: "fld_consultant_name",
        render: (data) => `<div class="text-gray-700">${data || "—"}</div>`,
      }
      : null,
    user.fld_admin_type !== "EXECUTIVE"
      ? {
        title: "Added By",
        data: "crm_name",
        render: (data) => `<div class="text-gray-700">${data || "—"}</div>`,
      }
      : null,
    {
      title: "Booking Information",
      data: null,
      render: (data, type, row) => {
        const hasBookingInfo =
          row.fld_booking_date &&
          row.fld_booking_slot &&
          row.fld_booking_date != null &&
          row.fld_booking_slot != null;

        const formatted = hasBookingInfo
          ? formatBookingDateTime(row.fld_booking_date, row.fld_booking_slot)
          : "—";

        const historyButton = hasBookingInfo
          ? `<button class="show-history-btn text-xs px-2 py-1 rounded" 
                data-booking-id="${row.bookingid}">
              ⏳ 
           </button>`
          : "";

        return `
        <div class="flex items-center gap-2 justify-between">
          <div class="text-gray-600">${formatted}</div>
          ${historyButton}
        </div>
      `;
      },
    },
    {
      title: "Sale Type",
      data: "fld_sale_type",
      render: (data) =>
        `<div class="text-indigo-700 font-medium ">${data || "—"}</div>`,
    },
    {
      title: "Status",
      data: "fld_consultation_sts",
      render: (data) => {
        const statusColor =
          data === "Completed"
            ? "text-green-600"
            : data === "Pending"
              ? "text-orange-600"
              : "text-gray-600";
        return `<span class="${statusColor} font-semibold">${data || "—"
          }</span>`;
      },
    },
  ].filter(Boolean); // <-- removes null/false entries

  const tableOptions = {
    responsive: true,
    pageLength: 25,
    lengthMenu: [5, 10, 25, 50],
    order: [],
    columnDefs: [{ targets: "_all", orderable: false }],
    dom: '<"flex justify-between items-center mb-4"lf>rt<"flex justify-between items-center mt-4"ip>',
    language: {
      search: "",
      searchPlaceholder: "Search bookings...",
      lengthMenu: "Show _MENU_ entries",
      info: "Showing _START_ to _END_ of _TOTAL_ entries",
      infoEmpty: "No bookings available",
      infoFiltered: "(filtered from _MAX_ total entries)",
    },
    drawCallback: function () {
      const api = this.api();
      const container = $(api.table().container());

      container
        .find(".show-history-btn")
        .off("click")
        .on("click", function () {
          const bookingId = $(this).data("booking-id");
          const tr = $(this).closest("tr");
          const row = api.row(tr);

          if (row.child.isShown()) {
            row.child.hide();
            tr.removeClass("shown");
          } else {
            if (historyData[bookingId]) {
              const html = generateHistoryHTML(historyData[bookingId]);
              row.child(html, "hover:!bg-transparent").show();
              tr.addClass("shown");
            } else {
              row
                .child(
                  '<div class="p-2 text-sm text-blue-500">Loading...</div>'
                )
                .show();
              fetchBookingHistory(bookingId).then((data) => {
                const html = generateHistoryHTML(data || []);
                row.child(html, "hover:!bg-transparent").show();
                tr.addClass("shown");
              });
            }
          }
        });

      // Add search & select styling
      container
        .find('input[type="search"], select')
        .addClass(
          "border px-3 py-1 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600 !py-1 border-gray-300 text-[12px]"
        );

      container
        .find(".details-btn")
        .off("click")
        .on("click", function () {
          const bookingId = $(this).data("id");
          navigate(`/admin/booking_detail/${bookingId}`);
        });

      container
        .find(".status-dropdown")
        .off("change")
        .on("change", function () {
          const bookingId = $(this).data("id");
          const field = $(this).data("field");
          const value = $(this).val();

          if (bookingId && field && value) {
            if (window.confirm(`Are you sure you want to set ${field} to "${value}"?`)) {
              handleMiniStatusChange(bookingId, field, value);
            } else {
              $(this).val(""); // reset if cancelled
            }
          }
        });
    },
  };

  async function handleMiniStatusChange(bookingId, field, value) {
    try {
      const response = await fetch(`${API_URL}/api/bookings/updateMiniStatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          field,
          value,
        }),
      });

      const result = await response.json();

      if (result.status) {
        toast.success(`${field} updated successfully`);
        setBookings((prev) =>
          prev.map((booking) =>
            booking.bookingid === bookingId
              ? { ...booking, [field]: value }
              : booking
          )
        );
      } else {
        toast.error(result.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating mini status:", error);
      toast.error("Something went wrong while updating");
    }
  }

  return (
    <div className="">
      <div className="">
        <div className="">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-semibold text-gray-900">
              External Calls
            </h2>
            <button
              className="border border-gray-500 text-gray-500 hover:text-white px-2 py-1 rounded hover:bg-gray-500 text-sm ml-3  "
              onClick={fetchAllBookings}
            >
              <RefreshCcw size={13} />
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className=" flex justify-between items-center px-3 py-2 bg-[#d7efff7d]">
              <h2 className="text-[16px] font-semibold text-gray-900">
                All External Calls
              </h2>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {isLoading ? "..." : bookings.length}
                </span>
              </div>
            </div>

            <div className="p-4">
              {isLoading ? (
                <SkeletonLoader
                  rows={6}
                  columns={[
                    "Client",
                    "Consultant",
                    "Added By",
                    "Booking Information",
                    "Call Type",
                    "Status",
                  ]}
                />
              ) : (
                <div className="overflow-hidden">
                  <DataTable
                    ref={tableRef}
                    data={bookings}
                    columns={columns}
                    className="table-auto w-full text-[12px] border border-gray-300 divide-y divide-gray-300 dataTable the-table-set border-b-0"
                    options={tableOptions}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
