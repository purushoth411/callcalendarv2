import React, { useEffect, useState, useRef } from "react";
import $ from "jquery";
import DataTable from "datatables.net-react";
import ReactDOMServer from "react-dom/server";
import DT from "datatables.net-dt";
import { useAuth } from "../../utils/idb.jsx";
import {
  ChevronDown,
  ChevronUp,
  PlusIcon,
  RefreshCcw,
  Users,
} from "lucide-react";
import {
  formatBookingDateTime,
  formatDate,
  getConsultationStatusClass,
  getCurrentDate,
  getDateBefore,
} from "../../helpers/CommonHelper.jsx";
import SkeletonLoader from "../../components/SkeletonLoader.jsx";
import AddBooking from "./AddBooking.jsx";
import { AnimatePresence, motion } from "framer-motion";
import StatusUpdate from "./StatusUpdate.jsx"; //
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import moment from "moment/moment.js";
import EditSubjectArea from "./EditSubjectArea.jsx";
import SocketHandler from "../../hooks/SocketHandler.jsx";
import { getSocket } from "../../utils/Socket.jsx";
import API_URL from "../../utils/constants.jsx";

export default function Bookings() {
  const { user } = useAuth();

  DataTable.use(DT);

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [historyData, setHistoryData] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [consultants, setConsultants] = useState([]);
  const [filteredConsultants, setFilteredConsultants] = useState([]);
  const [crms, setCrms] = useState([]);
  const [selectedCRM, setSelectedCRM] = useState(null);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [consultantType, setConsultantType] = useState("ACTIVE");
  const { dashboard_status } = useParams();
  const [showEditSubjectForm, setShowEditSubjectForm] = useState(false);
  const [selectedRow, setSelectedRow] = useState([]);
  const [showTeamBookings, setShowTeamBookings] = useState(false);
  const [teamBookings, setTeamBookings] = useState([]);
  const [loadingTeamBookings, setLoadingTeamBookings] = useState(false);

  const { bookingid } = useParams();



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
      if (newBooking.fld_consultant_another_option === "TEAM") {
        setTeamBookings((prev) => {
          const list = Array.isArray(prev) ? prev : [];

          if (list.some((booking) => booking.id == mappedBooking.id)) {
            return list;
          }

          return [...list, mappedBooking];
        });
      }
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

    const handleBookingDeleted = ({ bookingId }) => {
      console.log("Socket Called - Booking Deleted");
      setBookings((prev) => prev.filter((booking) => booking.id != bookingId));
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

    socket.on("bookingAdded", handleBookingAdded);
    socket.on("bookingUpdated", handleBookingUpdated);
    socket.on("bookingDeleted", handleBookingDeleted);
    socket.on("miniStatusUpdated", handleMiniStatusUpdated);

    return () => {
      socket.off("bookingAdded", handleBookingAdded);
      socket.off("bookingUpdated", handleBookingUpdated);
      socket.off("bookingDeleted", handleBookingDeleted);
      socket.off("miniStatusUpdated", handleMiniStatusUpdated);
    };
  }, [user.id]);

  ////////socket////////

  useEffect(() => {
    if (bookingid) {
      setShowForm(true);
    }
  }, [bookingid]);

  const navigate = useNavigate();

  const today = getCurrentDate("YYYY-MM-DD");
  const lastWeek = getDateBefore(7);

  const isSuperadmin = user?.fld_admin_type === "SUPERADMIN";

  const fromDate = dashboard_status ? today : lastWeek;
  const toDate = dashboard_status ? today : today;




  const [filters, setFilters] = useState({
    sale_type: "",
    call_rcrd_status: "",
    booking_status: [],
    keyword_search: "",
    filter_type: "Booking",
    date_range: [fromDate, toDate],
  });

  const today_y = new Date();
  const startOfDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const quickSet = (type) => {
    let from, to;

    if (type === "yesterday") {
      const y = new Date(today_y);
      y.setDate(today_y.getDate() - 1);
      from = startOfDay(y);
      to = new Date(startOfDay(y).setHours(23, 59, 59, 999));
    }

    if (type === "7days") {
      const past = new Date(today_y);
      past.setDate(today_y.getDate() - 7);
      from = startOfDay(past);
      to = today_y;
    }

    if (type === "30days") {
      const past = new Date(today_y);
      past.setDate(today_y.getDate() - 30);
      from = startOfDay(past);
      to = today_y;
    }

    setFilters({ ...filters, date_range: [from, to] });
  };

  const fetchConsultantsAndCrms = async () => {
    try {
      // Fetch consultants first
      const consultantRes = await fetch(
        `${API_URL}/api/helpers/getUsersByRole`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "CONSULTANT", status: "Active" }),
        }
      );
      const consultantData = await consultantRes.json();

      // Then fetch CRMs
      const crmRes = await fetch(
        `${API_URL}/api/helpers/getUsersByRole`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "EXECUTIVE", status: "Active" }),
        }
      );
      const crmData = await crmRes.json();

      // Set state
      setConsultants(consultantData.users || []);
      setFilteredConsultants(consultantData.users || []);
      setCrms(crmData.users || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleConsultantTypeChange = async (type) => {
    setConsultantType(type);

    try {
      const res = await fetch(
        `${API_URL}/api/helpers/getUsersByRole`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "CONSULTANT", status: type }),
        }
      );

      const data = await res.json();
      setFilteredConsultants(data.users || []);
    } catch (err) {
      console.error("Error filtering consultants:", err);
    }
  };

  const handleApplyFilters = async () => {
    setIsLoading(true);
    try {
      const filterPayload = {
        userId: user.id,
        userType: user.fld_admin_type,
        subAdminType: user.fld_subadmin_type,
        assigned_team: user.fld_team_id,
        filters: {
          consultationStatus:
            filters.booking_status.length === 1
              ? filters.booking_status[0]
              : null,
          recordingStatus: filters.call_rcrd_status,
          fromDate: filters.date_range[0]
            ? moment(filters.date_range[0]).format("YYYY-MM-DD")
            : null,
          toDate: filters.date_range[1]
            ? moment(filters.date_range[1]).format("YYYY-MM-DD")
            : null,

          consultantId: selectedConsultant || null,
          crmId: selectedCRM || null,
          search: filters.keyword_search,
          sale_type: filters.sale_type || null,
          filter_type: filters.filter_type || "Booking",
        },
      };

      const response = await fetch(
        `${API_URL}/api/bookings/fetchBooking`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filterPayload),
        }
      );

      const data = await response.json();

      if (data.status) {
        setBookings(data.data);
      } else {
        setBookings([]);
        console.warn("No bookings found");
      }
    } catch (error) {
      console.error("Filter fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCallStatusUpdationPending = (row) => {
    if (row.fld_consultation_sts === "Accept") {
      const bookingSlot = row.fld_booking_slot; // e.g., "03:30 PM"
      const bookingDate = row.fld_booking_date; // e.g., "2024-07-26"

      // Parse the booking slot and add 30 minutes
      const slotDateTime = new Date(`${bookingDate} ${bookingSlot}`);
      const callEndTime = new Date(slotDateTime.getTime() + 30 * 60000); // 30 mins later

      // Add 1 hour to call end time
      const oneHourAfterEndTime = new Date(callEndTime.getTime() + 60 * 60000);

      const now = new Date();
      const currentDate = now.toISOString().split("T")[0]; // e.g., "2024-07-26"

      if (bookingDate < currentDate) {
        return "Call status updation pending";
      } else if (bookingDate === currentDate && now >= oneHourAfterEndTime) {
        return "Call status updation pending";
      } else {
        return "";
      }
    }
    return "";
  };

  const handleAddNewClick = () => {
    setShowForm(true);
  };

  const tableRef = useRef(null);

  useEffect(() => {
    fetchAllBookings();

    // Cleanup function to destroy DataTable on unmount
    return () => {
      if (tableRef.current) {
        $(tableRef.current).DataTable().destroy();
      }
    };
  }, []);
  const handleReload = () => {
    fetchAllBookings();
  };

  // Add effect to handle DataTable reinitialization when data changes
  useEffect(() => {
    if (!isLoading && bookings.length > 0 && tableRef.current) {
      // Destroy existing DataTable if it exists
      if ($.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
      }
      getDateBefore(7);
    }
  }, [bookings, isLoading]);

  const fetchAllBookings = async () => {
    try {
      setIsLoading(true);
      const today = getCurrentDate("YYYY-MM-DD");
      const lastWeek = getDateBefore(7);

      const isSuperadmin = user?.fld_admin_type === "SUPERADMIN";

      const fromDate = dashboard_status ? today : lastWeek;
      // const toDate = isSuperadmin ? today : today;
      const toDate = dashboard_status ? today : today;

      const filtersToSend = {
        ...filters,
        fromDate,
        toDate,
      };

      const response = await fetch(
        `${API_URL}/api/bookings/fetchBooking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            userType: user?.fld_admin_type,
            subAdminType: user.fld_subadmin_type,
            assigned_team: user?.fld_team_id || "",
            filters: filtersToSend,
            dashboard_status,
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
      // if(user?.fld_admin_type=="CONSULTANT"){
      // fetchTeamBookings();
      // }
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
      <div class="absolute left-2 top-0 h-full border-l-2 border-blue-400"></div>-->
    
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

  const handleToggleTeamBookings = async () => {
    if (!showTeamBookings) {
      setLoadingTeamBookings(true);
      await fetchTeamBookings();
      setLoadingTeamBookings(false);
    }
    setShowTeamBookings(!showTeamBookings);
  };

  const fetchTeamBookings = async () => {
    setLoadingTeamBookings(true);
    try {
      const response = await fetch(
        `${API_URL}/api/bookings/getConsultantTeamBookings?userId=${user.id}`
      );
      const data = await response.json();
      if (response.ok) {
        setTeamBookings(data.data || []);
      } else {
        setTeamBookings([]);
      }
    } catch (error) {
      console.error("Error fetching team bookings:", error);
      setTeamBookings([]);
    } finally {
      setLoadingTeamBookings(false);
      setShowTeamBookings((prev) => !prev); // toggle visibility
    }
  };

  const handleCrmStatusUpdate = async (id, status) => {
    if (!status) {
      toast.error("Select any status");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/updateStatusByCrm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingid: id,
            statusByCrm: status,
            user: user,
          }),
        }
      );

      const result = await response.json();
      console.log("Response result:", result); // Debug log

      if (result.status === true || result.status === "true") {
        toast.success("Status Updated Successfully");
        fetchAllBookings();
      } else {
        toast.error(result.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred while updating status");
      console.error("Update error:", error);
    }
  };

  const columns = [

    {
      title: "Client",
      data: "client_name",
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
                    data-id="${row.id}"
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
      <div>
        <button
          ${shouldShowTooltip
            ? `data-tooltip-id="my-tooltip" data-tooltip-content="${displayText}"`
            : ""
          }
          class="details-btn font-medium text-blue-600 hover:underline truncate w-[150px] text-left ${textStyle}"
          data-id="${row.id}">
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

      </div>
    `;
      },
    },
    {
      title: "Consultant",
      data: "consultant_name",
      render: (data) => `<div class="text-gray-700">${data || ""}</div>`,
    },
    {
      title: "Added By",
      data: "crm_name",
      render: (data) => `<div class="text-gray-700">${data || ""}</div>`,
    },
    {
      title: "Booking Info",
      data: null,
      render: (data, type, row) => {
        const formatted = formatBookingDateTime(
          row.fld_booking_date,
          row.fld_booking_slot
        );
        return `
      <div class="flex items-center gap-2 justify-between">
        <div class="text-gray-600">${formatted}</div>
        <button class="show-history-btn text-xs px-2 py-1 rounded" 
                data-booking-id="${row.booking_id}">
          ⏳ 
        </button>
      </div>`;
      },
    },

    {
      title: "Call Type",
      data: "fld_sale_type",
      render: (data) => {
        if (data === "Presales") {
          return `<div class="text-blue-600 font-semibold">Presales</div>`;
        } else if (data === "Postsales") {
          return `<div class="text-green-600 font-semibold">Postsales</div>`;
        } else {
          return `<div class="text-gray-600 text-sm">${data}</div>`;
        }
      },
    },

    {
      title: "Status",
      data: null,
      render: (data, type, row) => {
        const call_status_updation_pending = getCallStatusUpdationPending(row);
        return ReactDOMServer.renderToString(
          <StatusUpdate
            row={row}
            user={user}
            onCrmStatusChange={handleCrmStatusUpdate}
            call_status_updation_pending={call_status_updation_pending}
          />
        );
      },
    },
  ];

  const tableOptions = {
    responsive: true,
    pageLength: 25,
    lengthMenu: [5, 10, 25, 50],
    order: [],
    columnDefs: [{ targets: "_all", orderable: false }],
    dom: '<"flex justify-between items-center mb-4 text-[13px]"lf>rt<"flex justify-between items-center mt-4"ip>',
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

      container
        .find(".the_status")
        .off("change")
        .on("change", function () {
          const selectedStatus = $(this).val();
          const classList = $(this).attr("class");
          const match = classList.match(/statusByCrm(\d+)/);
          const id = match ? match[1] : null;

          if (id && selectedStatus) {
            if (
              window.confirm(
                `Are you sure you want to mark this as "${selectedStatus}"?`
              )
            ) {
              handleCrmStatusUpdate(id, selectedStatus);
            } else {
              $(this).val("");
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
        .find(".edit-sub-area")
        .off("click")
        .on("click", function () {
          const rowData = JSON.parse($(this).attr("data-row"));
          setSelectedRow(rowData);
          setShowEditSubjectForm(true);
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
    createdRow: function (row, data, dataIndex) {
      const rowClass = getConsultationStatusClass(data);
      if (rowClass) {
        $(row).addClass(rowClass);
      }
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
            booking.id === bookingId
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
  const handleClearFilters = () => {
    const today = getCurrentDate("YYYY-MM-DD");
    const lastWeek = getDateBefore(7);

    const isSuperadmin = user?.fld_admin_type === "SUPERADMINFALSE";

    const fromDate = isSuperadmin ? today : lastWeek;
    const toDate = isSuperadmin ? today : today;
    setFilters({
      sale_type: "",
      call_rcrd_status: "",
      booking_status: [],
      keyword_search: "",
      filter_type: "Booking",
      date_range: [fromDate, toDate],
    });
    setSelectedCRM(null);
    setConsultantType("ACTIVE");
    setSelectedConsultant(null);
  };
  return (
    <div className="">
      <SocketHandler
        otherSetters={[
          {
            setFn: setConsultants,
            isBookingList: false,
            consultantType: consultantType,
          },
          {
            setFn: setFilteredConsultants,
            isBookingList: false,
            consultantType: consultantType,
          },
          { setFn: setCrms, isBookingList: false },
        ]}
      />
      <div className="">
        <div className="">
          <div className="mb-4 flex items-center gap-3 justify-between">
            <div className="flex justify-between items-center flex-1">
              <h2 className="text-[16px] font-semibold text-gray-900">
                Booking Management
              </h2>

              <button
                className="border border-gray-500 text-gray-500 hover:text-white px-2 py-1 rounded hover:bg-gray-500 text-sm ml-3  cursor-pointer"
                onClick={handleReload}
              >
                <RefreshCcw size={13} />
              </button>
            </div>
            {user?.fld_admin_type === "CONSULTANT" && (
              <button
                onClick={handleToggleTeamBookings}
                className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors text-[11px] flex items-center gap-1"
              >
                <Users size={12} />
                {loadingTeamBookings
                  ? "Loading..."
                  : showTeamBookings
                    ? "Hide Team Bookings"
                    : "Show Team Bookings"}
                {showTeamBookings ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
              </button>
            )}

            {user.fld_admin_type == "EXECUTIVE" && (
              <button
                onClick={handleAddNewClick}
                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors text-[11px] flex items-center gap-1"
              >
                <PlusIcon size={11} className="leading-none" /> Add New
              </button>
            )}
          </div>
          {user?.fld_admin_type === "CONSULTANT" && (
            <>
              {showTeamBookings && !loadingTeamBookings && (
                <>
                  {teamBookings.length > 0 ? (
                    <div className="mt-2 mb-2 px-2 py-1 bg-red-50 rounded-md shadow-sm max-w-full">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {teamBookings.map((booking, index) => (
                          <div
                            key={index}
                            className="relative group bg-white rounded-md border border-gray-200 p-2 cursor-pointer transition hover:shadow-sm"
                            tabIndex={0}
                            aria-label={`Booking by client ID ${booking.fld_client_id}`}
                          >
                            <span
                              onClick={() =>
                                navigate(
                                  `/admin/booking_detail/${booking.booking_id}`
                                )
                              }
                              className="block text-center px-2 py-0.5 text-xs font-medium border border-red-300 rounded bg-red-100 text-red-700 select-none truncate"
                            >
                              {booking.client_name} – {booking.fld_client_id}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-600 italic">
                      No Team Calls Found
                    </p>
                  )}
                </>
              )}
            </>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-3 py-2 bg-[#d7efff7d]">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <h2 className="text-[16px] font-semibold text-gray-900">
                    All Bookings
                  </h2>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-gray-500">Total:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                      {isLoading ? "..." : bookings.length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setShowFilters(!showFilters);
                      if (!showFilters) fetchConsultantsAndCrms();
                    }}
                    className="bg-gray-500 text-white px-2 py-1 rounded text-[11px] hover:bg-gray-600"
                  >
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  className="bg-white p-4 rounded-lg shadow mb-6 border the_filter"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Call Type
                      </label>
                      <select
                        className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                        value={filters.sale_type}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            sale_type: e.target.value,
                          })
                        }
                      >
                        <option value="">Select Call Type</option>
                        <option value="Presales">Presales</option>
                        <option value="Postsales">Postsales</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select CRM
                      </label>
                      <Select
                        options={crms.map((c) => ({
                          value: c.id,
                          label: c.fld_name,
                        }))}
                        value={
                          crms.find((c) => c.id === selectedCRM)
                            ? {
                              value: selectedCRM,
                              label: crms.find((c) => c.id === selectedCRM)
                                .fld_name,
                            }
                            : null
                        }
                        onChange={(opt) => setSelectedCRM(opt.value)}
                        placeholder="Select CRM"
                      />
                    </div>

                    {/* Consultant Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Consultant Type
                      </label>
                      <select
                        value={consultantType}
                        onChange={(e) =>
                          handleConsultantTypeChange(e.target.value)
                        }
                        className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>

                    {/* Consultant Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Consultant
                      </label>
                      <Select
                        options={filteredConsultants.map((c) => ({
                          value: c.id,
                          label: c.fld_name,
                        }))}
                        value={
                          filteredConsultants.find(
                            (c) => c.id === selectedConsultant
                          )
                            ? {
                              value: selectedConsultant,
                              label: filteredConsultants.find(
                                (c) => c.id === selectedConsultant
                              ).fld_name,
                            }
                            : null
                        }
                        onChange={(opt) => setSelectedConsultant(opt.value)}
                        placeholder="Select Consultant"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Call Recording Status
                      </label>
                      <select
                        className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                        value={filters.call_rcrd_status}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            call_rcrd_status: e.target.value,
                          })
                        }
                      >
                        <option value="">Select Call Recording Status</option>
                        <option value="Call Recording Updated">
                          Call Recording Updated
                        </option>
                        <option value="Call Recording Pending">
                          Call Recording Pending
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Booking Status
                      </label>
                      <Select
                        isMulti
                        options={[
                          "Pending",
                          "Call Scheduled",
                          "Call Rescheduled",
                          "Consultant Assigned",
                          "Accept",
                          "Reject",
                          "Completed",
                          "Rescheduled",
                          "Converted",
                          "Cancelled",
                          "Client did not join",
                          "Postponed",
                        ].map((status) => ({
                          value: status,
                          label: status,
                        }))}
                        value={filters.booking_status.map((status) => ({
                          value: status,
                          label: status,
                        }))}
                        onChange={(selected) =>
                          setFilters({
                            ...filters,
                            booking_status: selected.map(
                              (option) => option.value
                            ),
                          })
                        }
                        placeholder="Select booking statuses"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keyword Search
                      </label>
                      <input
                        type="text"
                        className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                        placeholder="Search Name or Email"
                        value={filters.keyword_search}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            keyword_search: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Filter Type
                      </label>
                      <select
                        className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                        value={filters.filter_type}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            filter_type: e.target.value,
                          })
                        }
                      >
                        <option value="Booking">Booking Date</option>
                        <option value="Created">Created Date</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Range
                      </label>
                      <DatePicker
                        className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                        selectsRange
                        startDate={filters.date_range[0]}
                        endDate={filters.date_range[1]}
                        onChange={(update) =>
                          setFilters({ ...filters, date_range: update })
                        }
                        isClearable
                        placeholderText="Select date range"
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => quickSet("yesterday")}
                          className="px-2 py-0.5 f-11 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Yesterday
                        </button>
                        <button
                          onClick={() => quickSet("7days")}
                          className="px-2 py-0.5 f-11 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Last 7 Days
                        </button>
                        <button
                          onClick={() => quickSet("30days")}
                          className="px-2 py-0.5 f-11 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Last 30 Days
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-right flex justify-end gap-2 ">
                    <button
                      className="bg-gray-500 text-white px-2 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                      onClick={handleClearFilters}
                    >
                      <RefreshCcw size={13} />
                    </button>
                    <button
                      className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors text-[11px]"
                      onClick={handleApplyFilters}
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
      <AnimatePresence>
        {showForm && (
          <div className="mb-6">
            <AddBooking
              user={user}
              fetchAllBookings={fetchAllBookings}
              setShowForm={setShowForm}
              bookingId={bookingid}
            />
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showEditSubjectForm && (
          <div className="mb-6">
            <EditSubjectArea
              setShowEditSubjectForm={setShowEditSubjectForm}
              selectedRow={selectedRow}
              fetchAllBookings={fetchAllBookings}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
