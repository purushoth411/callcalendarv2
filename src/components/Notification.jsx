import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react"; // your bell icon
import { toast } from "react-hot-toast";
import { useAuth } from "../utils/idb";
import { useLocation, useNavigate } from "react-router-dom";
import { getSocket } from "../utils/Socket";
import API_URL from "../utils/constants";

const Notification = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  // Listen to socket notifications
useEffect(() => {
  if (!user?.id) return;

  const socket = getSocket();
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }

  const handleIncomingNotification = (notif) => {
    console.log("Notification socket called");
    toast.success("📩 New message received");

    setNotifications((prev) => [notif, ...prev]);
    setNotificationCount((prev) => prev + 1);
  };

  socket.on("notification", handleIncomingNotification);

  return () => {
    socket.off("notification", handleIncomingNotification);
  };
}, [user.id]);


  // Fetch notifications from API
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/helpers/getNotifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        }
      );
      const result = await response.json();
      if (result.status) {
        setNotifications(result.data || []);
        setNotificationCount(result.data.length);
      } else {
        toast.error(result.message || "Failed to fetch notifications");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching notifications");
    } finally {
      setLoading(false);
    }
  };

  const { pathname } = useLocation();

  useEffect(() => {
    fetchNotifications();
  }, [pathname]);

  // Toggle dropdown and fetch on open
  const toggleDropdown = () => {
    if (!showDropdown) {
      fetchNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const navigate = useNavigate();

const handleNotificationClick = async (notif) => {
  try {
    await fetch(`${API_URL}/api/helpers/markAsRead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: notif.id }),
    });
    navigate(`/admin/booking_detail/${notif.fld_bookingid}`);
  } catch (error) {
    console.error("Failed to mark as read:", error);
  }
};

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative px-2 py-2 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="true"
        aria-expanded={showDropdown}
        aria-label="Show notifications"
      >
        <Bell size={14} />
        {notificationCount > 0 && (
          <span
            className="absolute top-0 right-0 inline-flex items-center justify-center 
        px-1 py-1 text-[8px] font-bold leading-none text-white bg-red-600 rounded-full
        transform translate-x-1/2 -translate-y-1/2 "
          >
            {notificationCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="origin-top-right absolute right-0 mt-2 w-72 rounded shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-0.5 max-h-60 overflow-y-auto">
            {loading ? (
              <>
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse flex flex-col gap-2 border-b last:border-b-0 border-gray-200 px-3 py-2"
                  >
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No notifications
              </p>
            ) : (
              notifications.map((notif, idx) => (
                <div  onClick={()=>handleNotificationClick(notif)}
                  key={idx}
                  className="border-b last:border-b-0 border-gray-200 px-2 py-1 hover:bg-gray-100 cursor-pointer rounded"
                >
                  <p className="text-[12px] text-gray-700">{notif.fld_message}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(notif.fld_addedon).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;
