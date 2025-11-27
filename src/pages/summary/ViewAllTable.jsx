import React, { useEffect, useState } from "react";
import TableSection from "./TableSection";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { AnimatePresence, motion } from "framer-motion";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../../utils/idb";
import toast from "react-hot-toast";
import SkeletonLoader from "../../components/SkeletonLoader";
import moment from "moment-timezone";
import { formatBookingDateTime, formatDate } from "../../helpers/CommonHelper";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

import {
  Activity,
  ArrowUpRightFromCircle,
  CheckCircle,
  Clock,
  UserCheck,
  UserX,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  ArrowLeft,
  EyeIcon,
} from "lucide-react";
import SocketHandler from "../../hooks/SocketHandler";
import { getSocket } from "../../utils/Socket";
import API_URL from "../../utils/constants";

const badgeMeta = {
  "Call Scheduled": {
    bg: "bg-slate-100",
    text: "text-slate-800",
    icon: <Activity size={10} />,
  },
  "Call Rescheduled": {
    bg: "bg-slate-100",
    text: "text-slate-800",
    icon: <Activity size={10} />,
  },
  "Consultant Assigned": {
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: <UserCheck size={10} />,
  },
  Pending: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    icon: <Clock size={10} />,
  },
  Accept: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: <CheckCircle size={10} />,
  },
  Accepted: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: <CheckCircle size={10} />,
  },
  Reject: {
    bg: "bg-rose-100",
    text: "text-rose-800",
    icon: <UserX size={10} />,
  },
  Rejected: {
    bg: "bg-rose-100",
    text: "text-rose-800",
    icon: <UserX size={10} />,
  },
  Completed: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: <CheckCircle size={10} />,
  },
  Converted: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: <ArrowUpRightFromCircle size={10} />,
  },
  Rescheduled: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    icon: <Clock size={10} />,
  },
  "Reassign Request": {
    bg: "bg-gray-100",
    text: "text-gray-800",
    icon: <Clock size={10} />,
  },
  "Client did not join": {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: <UserX size={10} />,
  },
  Cancelled: {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: <UserX size={10} />,
  },
  _: { bg: "bg-gray-100", text: "text-gray-900", icon: <Activity size={10} /> },
};

const crms = [
  { id: 1, fld_name: "CRM1" },
  { id: 2, fld_name: "CRM2" },
];
const consultants = [
  { id: 1, fld_name: "Consultant 1", type: "ACTIVE" },
  { id: 2, fld_name: "Consultant 2", type: "INACTIVE" },
];

const today = moment().tz("Asia/Kolkata").startOf("day");

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords,
  loading,
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <div className="flex items-center  text-gray-700 mb-2 sm:mb-0">
        <span>
          Showing page {currentPage} of {totalPages} ({totalRecords} total
          records)
        </span>
      </div>

      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className={`px-3 py-2  font-medium rounded-md flex items-center transition-colors ${
            currentPage === 1 || loading
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <ChevronLeft size={16} className="mr-1" />
          Previous
        </button>

        {/* Page Numbers */}
        <div className="hidden sm:flex space-x-1">
          {currentPage > 3 && totalPages > 5 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                disabled={loading}
                className={`px-2 py-1  font-medium rounded-md transition-colors ${
                  loading
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                1
              </button>
              {currentPage > 4 && (
                <span className="px-2 py-2 text-gray-500">...</span>
              )}
            </>
          )}

          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={loading}
              className={`px-2 py-1  font-medium rounded-md transition-colors ${
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : loading
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}

          {currentPage < totalPages - 2 && totalPages > 5 && (
            <>
              {currentPage < totalPages - 3 && (
                <span className="px-2 py-1 text-gray-500">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={loading}
                className={`px-2 py-1  font-medium rounded-md transition-colors ${
                  loading
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Mobile page indicator */}
        <div className="sm:hidden px-2 py-1  text-gray-700">
          {currentPage} / {totalPages}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className={`px-3 py-2  font-medium rounded-md flex items-center transition-colors ${
            currentPage === totalPages || loading
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          Next
          <ChevronRight size={16} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

const ViewAllTable = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [filters, setFilters] = useState({
    sale_type: "",
    call_rcrd_status: "",
    booking_status: [],
    keyword_search: "",
    filter_type: "Booking",
    date_range: ["", ""],
    crm_id: null,
    consultant_id: null,
    consultant_type: "ACTIVE",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(
    queryParams.get("request_status")
  );
  const [confirmationStatus, setConfirmationStatus] = useState(
    queryParams.get("confirmation_status")
  );
  const [allData, setAllData] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [historyData, setHistoryData] = useState({});
  const [loadingRows, setLoadingRows] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    limit: 50,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const { user } = useAuth();

  const [consultants, setConsultants] = useState([]);
  const [filteredConsultants, setFilteredConsultants] = useState([]);
  const [crms, setCrms] = useState([]);
  const [consultantType, setConsultantType] = useState("ACTIVE");

  const navigate = useNavigate();

  const handleNavigate = (id) => {
    navigate(`/admin/booking_detail/${id}`);
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

  const formatDateForAPI = (date) =>
    date
      ? `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
      : null;

  const fetchData = async (
    setData,
    callRequestStatus,
    callConfirmationStatus,
    limit = true,
    page = 1
  ) => {
    const payload = {
      userId: user.id,
      userType: user.fld_admin_type,
      assigned_team: user.fld_team_id,
      filters: {
        consultationStatus:
          filters.booking_status.length === 1
            ? filters.booking_status[0]
            : null,
        callRequestStatus,
        callConfirmationStatus,
        recordingStatus: filters.call_rcrd_status,
        fromDate: filters.date_range[0]
          ? formatDateForAPI(filters.date_range[0])
          : "",
        toDate: filters.date_range[1]
          ? formatDateForAPI(filters.date_range[1])
          : "",
        consultantId: filters.consultant_id || null,
        crmId: filters.crm_id || null,
        search: filters.keyword_search,
        sale_type: filters.sale_type || null,
        filter_type: filters.filter_type || "Booking",
      },
      type: limit ? "all" : "",
      page: page,
      limit: 50, // Items per page
    };

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/fetchSummaryBookings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filterPayload: payload }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status) {
        // Handle paginated response
        if (result.pagination) {
          setData(result.data || []);
          setPagination({
            currentPage: result.pagination.currentPage || page,
            totalPages: result.pagination.totalPages || 0,
            totalRecords: result.pagination.totalRecords || 0,
            limit: result.pagination.limit || 50,
            hasNextPage: result.pagination.hasNextPage || false,
            hasPreviousPage: result.pagination.hasPreviousPage || false,
          });
          setCurrentPage(result.pagination.currentPage || page);
        } else {
          // Fallback for non-paginated response
          setData(result.data || []);
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalRecords: (result.data || []).length,
            limit: 50,
            hasNextPage: false,
            hasPreviousPage: false,
          });
        }
      } else {
        console.error("API Error:", result.message || "Failed to fetch data");
        toast.error(result.message || "Failed to fetch data");
        setData([]);
        // Reset pagination on error
        setPagination({
          currentPage: 1,
          totalPages: 0,
          totalRecords: 0,
          limit: 50,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Network error occurred while fetching data");
      setData([]);
      // Reset pagination on error
      setPagination({
        currentPage: 1,
        totalPages: 0,
        totalRecords: 0,
        limit: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    fetchData(setAllData, selectedStatus, confirmationStatus, true, 1);
    setShowFilters(false);
  };

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.totalPages &&
      newPage !== currentPage &&
      !loading
    ) {
      setCurrentPage(newPage);
      fetchData(setAllData, selectedStatus, confirmationStatus, true, newPage);

      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      sale_type: "",
      call_rcrd_status: "",
      booking_status: [],
      keyword_search: "",
      filter_type: "Booking",
      date_range: ["", ""],
      crm_id: null,
      consultant_id: null,
      consultant_type: "ACTIVE",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  useEffect(() => {
    if (user && user.id) {
      handleApplyFilters();
    }
  }, [user]);
  const handleReload = () => {
    handleApplyFilters();
  };

  const fetchBookingHistory = async (bookingId) => {
    if (historyData[bookingId]) return historyData[bookingId];

    setLoadingRows((prev) => new Set(prev).add(bookingId));

    try {
      const res = await fetch(
        `${API_URL}/api/bookings/history/${bookingId}`
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      const data = result.status ? result.data : [];
      setHistoryData((prev) => ({ ...prev, [bookingId]: data }));
      return data;
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch booking history");
      setHistoryData((prev) => ({ ...prev, [bookingId]: [] }));
      return [];
    } finally {
      setLoadingRows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  const renderHistoryRow = (bookingId) => {
    const data = historyData[bookingId];
    const isLoading = loadingRows.has(bookingId);

    return (
      <tr className="bg-gray-50">
        <td colSpan={6} className="px-4 py-3 border-b">
          <div className="flex flex-col items-start w-full text-[12px]">
            {isLoading ? (
              <div className="text-blue-500  flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                Loading booking history...
              </div>
            ) : data && data.length > 0 ? (
              <ol className="relative border-l-2 border-blue-200 space-y-3 w-full">
                {data.map((item, idx) => (
                  <li key={idx} className="relative">
                    {/* Dot */}
                    <div className="absolute -left-1.5 top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white z-10" />

                    {/* Content */}
                    <div className=" pl-5">
                      <span className="font-medium text-gray-800">
                        {item.fld_comment}
                      </span>
                      <span className="flex items-center text-gray-500 text-xs mt-1 gap-1">
                        <Clock size={12} className="text-blue-600" />
                        {formatDate(item.fld_addedon)}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-gray-500 text-sm">No history found.</div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Filter data based on search query
  const filteredData = allData.filter((row) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      row.user_name?.toLowerCase().includes(query) ||
      row.admin_name?.toLowerCase().includes(query) ||
      row.crm_name?.toLowerCase().includes(query) ||
      row.fld_sale_type?.toLowerCase().includes(query) ||
      row.fld_call_request_sts?.toLowerCase().includes(query) ||
      row.fld_client_id?.toLowerCase().includes(query) ||
      row.user_email?.toLowerCase().includes(query) ||
      row.admin_email?.toLowerCase().includes(query)
    );
  });

  ////////socket start/////////////

  useEffect(() => {
    const socket = getSocket();

    // Helper function to check if booking matches this table's criteria
    const matchesTableCriteria = (booking) => {
      const requestStatus = booking.fld_call_request_sts;
      const bookingConfirmation = booking.fld_call_confirmation_status;

      if (selectedStatus === "Accept") {
        return (
          requestStatus === selectedStatus &&
          bookingConfirmation === confirmationStatus
        );
      } else {
        return requestStatus === selectedStatus;
      }
    };

    // Helper function to check user permissions
    const hasPermission = (booking) => {
      if (user.fld_admin_type === "EXECUTIVE") {
        return booking.fld_addedby == user.id;
      } else if (user.fld_admin_type === "CONSULTANT") {
        return (
          booking.fld_consultantid == user.id ||
          booking.fld_secondary_consultant_id == user.id
        );
      } else if (user.fld_admin_type === "SUBADMIN") {
        const bookingTeams = Array.isArray(booking.fld_teamid)
          ? booking.fld_teamid
          : String(booking.fld_teamid)
              .split(",")
              .map((id) => id.trim());

        const userTeams = Array.isArray(user.fld_team_id)
          ? user.fld_team_id
          : String(user.fld_team_id)
              .split(",")
              .map((id) => id.trim());

        return bookingTeams.some((teamId) => userTeams.includes(teamId));
      } else if (user.fld_admin_type === "SUPERADMIN") {
        return true;
      }
      return false;
    };

    const handleBookingAdded = (newBooking) => {
      if (!hasPermission(newBooking) || !matchesTableCriteria(newBooking)) {
        return;
      }

      const mappedBooking = {
        ...newBooking,
        client_name: newBooking.user_name,
        client_email: newBooking.user_email,
        client_phone: newBooking.user_phone,
      };

      setAllData((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some((booking) => booking.id == mappedBooking.id)) {
          return list;
        }
        return [mappedBooking, ...list]; // add at top
      });
    };

    const handleBookingUpdated = (updatedBooking) => {
      const mappedBooking = {
        ...updatedBooking,
        client_name: updatedBooking.user_name,
        client_email: updatedBooking.user_email,
        client_phone: updatedBooking.user_phone,
      };

      setAllData((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const existingIndex = list.findIndex(
          (booking) => booking.id == mappedBooking.id
        );

        if (
          matchesTableCriteria(updatedBooking) &&
          hasPermission(updatedBooking)
        ) {
          // Booking should be in this table
          if (existingIndex >= 0) {
            // Update existing booking
            const newList = [...list];
            newList[existingIndex] = mappedBooking;
            return newList;
          } else {
            // Add new booking at the top
            return [mappedBooking, ...list];
          }
        } else {
          // Booking should not be in this table, remove it if it exists
          if (existingIndex >= 0) {
            return list.filter((booking) => booking.id != mappedBooking.id);
          }
        }

        return list;
      });
    };

    socket.on("bookingAdded", handleBookingAdded);
    socket.on("bookingUpdated", handleBookingUpdated);

    return () => {
      socket.off("bookingAdded", handleBookingAdded);
      socket.off("bookingUpdated", handleBookingUpdated);
    };
  }, [user.id]);

  //////socket end///////////

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
      <div className="mb-4 flex items-center gap-3 justify-between">
        <div className="flex justify-start items-center ">
          <h4 className="text-[16px] font-semibold text-gray-900">
            Call Summary{" "}
            {/* <span className="text-sm text-gray-400">{selectedStatus}</span> */}
          </h4>
        </div>
        <div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => navigate(-1)}
              className="bg-none hover:bg-gray-300  text-black text-[11px] px-2  rounded-sm flex items-center space-x-2 transition-colors hover:text-gray-700
"
            >
              <ArrowLeft className="mr-1" size={12} />
              <span>Back</span>
            </button>
            <button
              className="border border-gray-500 text-gray-500 hover:text-white px-2 py-1 rounded hover:bg-gray-500 text-sm  cursor-pointer "
              onClick={handleReload}
            >
              <RefreshCcw size={13} />
            </button>
            <button
              className="bg-blue-500 text-white px-2 py-1 rounded text-[11px]"
              onClick={() => {
                setShowFilters(!showFilters);
                if (showFilters) fetchConsultantsAndCrms();
              }}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-300"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1">Call Type</label>
                <select
                  className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                  value={filters.sale_type}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, sale_type: e.target.value }))
                  }
                >
                  <option value="">Select Call Type</option>
                  <option value="Presales">Presales</option>
                  <option value="Postsales">Postsales</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Recording Status</label>
                <select
                  className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                  value={filters.call_rcrd_status}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      call_rcrd_status: e.target.value,
                    }))
                  }
                >
                  <option value="">Select Recording Status</option>
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Select CRM</label>
                <Select
                  options={crms.map((c) => ({
                    value: c.id,
                    label: c.fld_name,
                  }))}
                  value={
                    filters.crm_id
                      ? {
                          value: filters.crm_id,
                          label: crms.find((c) => c.id === filters.crm_id)
                            ?.fld_name,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setFilters((f) => ({
                      ...f,
                      crm_id: opt ? opt.value : null,
                    }))
                  }
                  isClearable
                  placeholder="Select CRM"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block mb-1">Consultant Type</label>
                <select
                  className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                  value={filters.consultant_type}
                  onChange={(e) => {
                    handleConsultantTypeChange(e.target.value);
                    setFilters((f) => ({
                      ...f,
                      consultant_type: e.target.value,
                      consultant_id: null,
                    }));
                  }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Select Consultant</label>
                <Select
                  options={filteredConsultants.map((c) => ({
                    value: c.id,
                    label: c.fld_name,
                  }))}
                  value={
                    filters.consultant_id
                      ? {
                          value: filters.consultant_id,
                          label: filteredConsultants.find(
                            (c) => c.id === filters.consultant_id
                          )?.fld_name,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setFilters((f) => ({
                      ...f,
                      consultant_id: opt ? opt.value : null,
                    }))
                  }
                  isClearable
                  placeholder="Select Consultant"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block mb-1">Keyword Search</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                  placeholder="Search Name or Email"
                  value={filters.keyword_search}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      keyword_search: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block mb-1">Filter Type</label>
                <select
                  className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                  value={filters.filter_type}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, filter_type: e.target.value }))
                  }
                >
                  <option value="Booking">Booking Date</option>
                  <option value="Created">Created Date</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Date Range</label>
                <DatePicker
                  className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                  selectsRange
                  startDate={filters.date_range[0]}
                  endDate={filters.date_range[1]}
                  onChange={(update) =>
                    setFilters((f) => ({ ...f, date_range: update }))
                  }
                  isClearable
                  placeholderText="Select date range"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                className="bg-gray-500 text-white px-2 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                onClick={handleClearFilters}
              >
                <RefreshCcw size={15} />
              </button>
              <button
                className="bg-green-600 text-white px-2 py-1 rounded text-[11px] hover:bg-green-700 transition-colors"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                {loading ? "Applying..." : "Apply Filters"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-3 py-2 bg-[#d7efff7d]">
          <div className="flex justify-between items-center">
            <h2 className="text-[16px] font-semibold text-gray-900">
              {" "}
              {selectedStatus}
            </h2>
            {/* Search Bar */}
            {allData.length > 0 && (
              <input
                type="text"
                className="w-[16%] border px-3 py-1 bg-white rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                placeholder="Search in current page results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            )}
          </div>
        </div>
        <div className="p-4">
          {/* Loading State */}
          {loading ? (
            <SkeletonLoader
              rows={6}
              columns={[
                "Client",
                "Consultant",
                "Added By",
                "Booking Info",
                "Call Type",
                "Status",
              ]}
            />
          ) : (
            <>
              {/* Table */}
              <div className="bg-white rounded shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 bg-white n-table-set">
                    <thead className="sticky top-0 bg-gray-100 shadow text-gray-700">
                      <tr>
                        {[
                          "Client",
                          "Consultant",
                          "Added By",
                          "Booking Info",
                          "Call Type",
                          "Status",
                        ].map((col) => (
                          <th
                            key={col}
                            className="px-4 py-2 text-left text-sm font-semibold border-b"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length > 0 ? (
                        filteredData.map((row, index) => {
                          const deletedClass =
                            row.delete_sts === "Yes"
                              ? "line-through opacity-50"
                              : "";
                          const badge =
                            badgeMeta[row.fld_call_request_sts] ||
                            badgeMeta["_"];
                          const isExpanded = expandedRow === row.id;

                          return (
                            <React.Fragment key={row.id}>
                              <tr
                                className={`group border-b border-gray-300 ${
                                  index % 2 === 0 ? "bg-white" : ""
                                } transition-colors`}
                              >
                                <td
                                  className={`px-4 py-2 text-gray-600 border-r border-gray-300 ${deletedClass}`}
                                >
                                  {(() => {
                                    const clientId = row.fld_client_id || "";
                                    const displayText = `${row.user_name} - ${clientId}`;
                                    const shouldShowTooltip =
                                      displayText.length > 20;

                                    return (
                                      <span
                                        onClick={() => handleNavigate(row.id)}
                                        className="hover:underline text-blue-600 font-medium cursor-pointer truncate block w-[150px]"
                                        {...(shouldShowTooltip && {
                                          "data-tooltip-id": "my-tooltip",
                                          "data-tooltip-content": displayText,
                                        })}
                                      >
                                        {displayText}
                                      </span>
                                    );
                                  })()}
                                </td>

                                <td
                                  className={`px-4 py-2 text-gray-600 border-r border-gray-300 ${deletedClass}`}
                                >
                                  <div className="font-medium">
                                    {row.admin_name}
                                  </div>
                                </td>
                                <td
                                  className={`px-4 py-2 text-gray-600 border-r border-gray-300 ${deletedClass}`}
                                >
                                  <div className="font-medium">
                                    {row.crm_name}
                                  </div>
                                </td>
                                <td
                                  className={`px-4 py-2 text-gray-600 border-r border-gray-300 ${deletedClass}`}
                                >
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      {formatBookingDateTime(
                                        row.fld_booking_date,
                                        row.fld_booking_slot
                                      )}
                                    </span>
                                    <button
                                      className="ml-2 text-gray-500 hover:text-blue-600 transition-colors"
                                      onClick={async () => {
                                        if (isExpanded) {
                                          setExpandedRow(null);
                                        } else {
                                          setExpandedRow(row.id);
                                          await fetchBookingHistory(row.id);
                                        }
                                      }}
                                      title="View booking history"
                                    >
                                      <EyeIcon
                                        className="bg-green-600 hover:bg-green-700 cursor-pointer text-white p-1 rounded"
                                        size={20}
                                      />
                                    </button>
                                  </div>
                                </td>
                                <td
                                  className={`px-4 py-2 text-gray-600 border-r border-gray-300 ${deletedClass}`}
                                >
                                  <span className="font-medium">
                                    {row.fld_sale_type}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-gray-600 border-r border-gray-300">
                                  <div
                                    className={`py-[1px] px-[6px] inline-flex items-center gap-1 rounded text-[10px] font-medium ${badge.bg} ${badge.text} ${deletedClass}`}
                                  >
                                    {badge.icon}
                                    {row.fld_call_request_sts}
                                  </div>
                                  {row.fld_call_request_sts === "Accept" && (
                                    <>
                                      {row.fld_call_confirmation_status ===
                                        "Call Confirmation Pending at Client End" && (
                                        <span className="inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] bg-blue-100 text-blue-800">
                                          <Clock size={10} />{" "}
                                          {row.fld_call_confirmation_status}
                                        </span>
                                      )}
                                      {row.fld_call_confirmation_status ===
                                        "Call Confirmed by Client" && (
                                        <span className="inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] bg-green-100 text-green-800">
                                          <CheckCircle size={8} />{" "}
                                          {row.fld_call_confirmation_status}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </td>
                              </tr>

                              {isExpanded && renderHistoryRow(row.id)}
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <td
                          colSpan="6"
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-4 py-2 rounded">
                            No bookings found.
                          </div>
                        </td>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Component */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  totalRecords={pagination.totalRecords}
                  onPageChange={handlePageChange}
                  loading={loading}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAllTable;
