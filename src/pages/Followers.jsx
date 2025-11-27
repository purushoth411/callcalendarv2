import React, { useEffect, useState, useRef } from "react";
import $ from "jquery";
import DataTable from "datatables.net-react";
import ReactDOMServer from "react-dom/server";
import DT from "datatables.net-dt";
import { toast } from "react-hot-toast";
import { useAuth } from "../utils/idb.jsx";
import { PlusIcon } from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader.jsx";
import { AnimatePresence, motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { useNavigate, useParams } from "react-router-dom";
import { formatBookingDateTime, formatDate } from "../helpers/CommonHelper.jsx";
import { getSocket } from "../utils/Socket.jsx";
import API_URL from "../utils/constants.jsx";

export default function Followers() {
  const { user } = useAuth();

  DataTable.use(DT);

  const [followers, setFollowers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [historyData, setHistoryData] = useState({}); // Store history for each follower
  const [loadingHistory, setLoadingHistory] = useState(new Set());
  const [showAddForm, setShowAddForm] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [consultants, setConsultants] = useState([]);
  const [filteredConsultants, setFilteredConsultants] = useState([]);
  const [crms, setCrms] = useState([]);
  const [selectedCRM, setSelectedCRM] = useState(null);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [consultantType, setConsultantType] = useState("ACTIVE");
  const { dashboard_status } = useParams();

  const { followerid } = useParams();

  const navigate = useNavigate();

  const tableRef = useRef(null);

  ///socket ////////

  useEffect(() => {
    const socket = getSocket();

    const handleCallClaimed = (followerId) => {
      console.log("Socket Called - Call Claimed ");
      setFollowers((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map((follower) =>
          follower.followerid == followerId
            ? { ...follower, followstatus: "Claimed" } // use correct column name
            : follower
        );
      });
    };

    const handleFollowerAdded = (followerData) => {
      if (!user) return;

      const { follower_consultant_id, consultantid } = followerData;

      const isRelevant =
        user.fld_admin_type === "SUPERADMIN" ||
        String(user.id) === String(follower_consultant_id) ||
        String(user.id) === String(consultantid);

      if (isRelevant) {
        setFollowers((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          const alreadyExists = list.some(
            (f) => String(f.followerid) === String(followerData.followerid)
          );
          if (alreadyExists) return list;
          return [followerData, ...list];
        });
      }
    };

    socket.on("callClaimed", handleCallClaimed);
    socket.on("followerAdded", handleFollowerAdded);

    return () => {
      socket.off("callClaimed", handleCallClaimed);
      socket.off("followerAdded", handleFollowerAdded);
    };
  }, [user.id]);

  ///socket

  useEffect(() => {
    fetchAllFollowers();

    // Cleanup function to destroy DataTable on unmount
    return () => {
      if (tableRef.current) {
        $(tableRef.current).DataTable().destroy();
      }
    };
  }, []);

  // Add effect to handle DataTable reinitialization when data changes
  useEffect(() => {
    if (!isLoading && followers.length > 0 && tableRef.current) {
      // Destroy existing DataTable if it exists
      if ($.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
      }
    }
  }, [followers, isLoading]);

  const fetchAllFollowers = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${API_URL}/api/followers/getAllFollowers?usertype=${user?.fld_admin_type}&userid=${user?.id}`
      );

      const result = await response.json();

      if (result.status) {
        setFollowers(result.data);
        if (dashboard_status) {
          navigate("/followers");
        }
      } else {
        setFollowers([]);
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
      setFollowers([]);
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

  const handleCrmStatusUpdate = (id, status) => {
    if (!status) return;
    // Replace BASE_URL or use axios/fetch as needed
    fetch(`/api/update-crm-status`, {
      method: "POST",
      body: JSON.stringify({ id, status }),
    });
  };

  const updateFollowersStatus = async (approveData, followerid, bookingid) => {
    try {
      const res = await fetch(
        `${API_URL}/api/followers/followerclaimbooking/${followerid}/${bookingid}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id, userName: user.fld_name }),
        }
      );

      const data = await res.json();
      if (data.status) {
        toast.success("Booking Claimed");
        fetchAllFollowers();
      } else {
        toast.error(data.message || "Status update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating status");
    }
  };

  useEffect(() => {
    $(document).on("click", ".edit-btn", function () {
      const followerid = $(this).data("followerid");
      const bookingid = $(this).data("bookingid");
      const selected = followers.find((d) => d.id === followerid);
      //console.log(selected);

      updateFollowersStatus(selected, followerid, bookingid);
    });

    return () => {
      $(document).off("click", ".edit-btn");
    };
  }, [followers]);

  //console.log(user.fld_admin_type);

  const columns = [
    {
      title: "Client",
      data: "user_name",
      render: (data, type, row) => {
        const clientId = row.fld_client_id || "";
        const isDeleted = row.delete_sts === "Yes";
        const textStyle = isDeleted ? "line-through text-gray-400" : "";
        const displayText = `${data} - ${clientId}`;
        const shouldShowTooltip = displayText.length > 20;
        return `
       <button
        ${
          shouldShowTooltip
            ? `data-tooltip-id="my-tooltip" data-tooltip-content="${displayText}"`
            : ""
        }
        class="details-btn font-medium text-blue-600 hover:underline truncate w-[150px] text-left ${textStyle}"
        data-id="${row.id}">
        ${displayText}
      </button>
        `;
      },
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
      <div class="flex justify-between gap-2">
        <div class="text-gray-600">${formatted}</div>
        <button class="show-history-btn text-xs px-2 py-1 rounded" 
                data-booking-id="${row.id}">
          ⏳ 
        </button>
      </div>`;
      },
    },
    {
      title: "Added By",
      data: "admin_name",
      render: (data) => `<div class="text-gray-700">${data || ""}</div>`,
    },
    {
      title: "Consultant",
      data: "consultant_name",
      render: (data) => `<div class="text-gray-700">${data || ""}</div>`,
    },
    {
      title: "Follower Consultant",
      data: "follower_consultant_name",
      render: (data) => `<div class="text-gray-700">${data || ""}</div>`,
    },
    {
      title: "Added On ",
      data: "addedon",
      render: (data, type, row) => {
        const formatted = formatDate(row.addedon);
        return `
      <div class="flex items-center gap-2">
        <div class="text-gray-600">${formatted}</div>
      </div>`;
      },
    },
    {
      title: "Action",
      data: "followstatus",
      orderable: false,
      render: function (data, type, row) {
        let bookingTime = new Date(
          `${row.fld_booking_date} ${row.fld_booking_slot}`
        );
        let currentTime = new Date();

        // Show Claim button if conditions are met
        if (
          data === "Pending" &&
          currentTime < bookingTime &&
          (user.fld_admin_type == "SUBADMIN" ||
            user.fld_admin_type == "CONSULTANT")
        ) {
          return `
        <div class="flex items-center gap-2">
          <div class="text-red-600 font-semibold">Pending</div>
          <button 
            class="edit-btn bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-white leading-none text-[11px] cursor-pointer" 
            data-followerid="${row.followerid}" data-bookingid="${row.id}">
            Claim
          </button>
        </div>
      `;
        }
        // Show status only
        else if (data === "Pending") {
          return `<div class="text-red-600 font-semibold">Pending</div>`;
        } else {
          return `<div class="text-green-600 font-semibold">Claimed</div>`;
        }
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
      searchPlaceholder: "Search followers...",
      lengthMenu: "Show _MENU_ entries",
      info: "Showing _START_ to _END_ of _TOTAL_ entries",
      infoEmpty: "No followers available",
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
            tr.removeClass("shown !hover:bg-transparent");
          } else {
            if (historyData[bookingId]) {
              const html = generateHistoryHTML(historyData[bookingId]);
              row.child(html, "hover:!bg-transparent").show();
              tr.addClass("shown !hover:bg-transparent");
            } else {
              row
                .child(
                  '<div class="p-2 text-sm text-blue-500">Loading...</div>'
                )
                .show();
              fetchBookingHistory(bookingId).then((data) => {
                const html = generateHistoryHTML(data || []);
                row.child(html, "hover:!bg-transparent").show();
                tr.addClass("shown !hover:bg-transparent");
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
    },
  };

  return (
    <div className="">
      <div className="">
        <div className="">
          <div className="mb-4 flex items-center gap-3 justify-between">
            <h2 className="text-[16px] font-semibold text-gray-900">
              Follower Management
            </h2>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="">
              {isLoading ? (
                <SkeletonLoader
                  rows={6}
                  columns={[
                    "Client",
                    "Booking Information",
                    "Consultant",
                    "Added By",
                    "Added On",
                    "Status",
                  ]}
                />
              ) : (
                <div className="overflow-hidden">
                  <DataTable
                    ref={tableRef}
                    data={followers}
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
