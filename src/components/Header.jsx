import { useAuth } from "../utils/idb.jsx";
import { useNavigate, NavLink } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  LogOut,
  CircleUserRound,
  Bell,
  LayoutDashboard,
  BarChart2,
  Users2,
  Globe2,
  CalendarCheckIcon,
  Phone,
  Table,
  List,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import logo from "../assets/images/callcalendar-logo.png";
import Notification from "./Notification.jsx";
import PlansDropdown from "./PlansDropdown.jsx";
import { getSocket } from "../utils/Socket.jsx";
import API_URL from "../utils/constants.jsx";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [followerCount, setFollowerCount] = useState(0);

  ///socket ////////

  useEffect(() => {
    const socket = getSocket();

    const handleUpdateFollowerCount = (followerData) => {
      if (!user) return;

      const { follower_consultant_id, consultantid } = followerData;

      if (user.fld_admin_type === "SUPERADMIN") {
        // Always increment for SUPERADMIN
        setFollowerCount((prev) => prev + 1);
      } else if (
        String(user.id) === String(follower_consultant_id) ||
        String(user.id) === String(consultantid)
      ) {
        // Increment if logged-in user matches consultant IDs
        setFollowerCount((prev) => prev + 1);
      }
    };

    socket.on("followerAdded", handleUpdateFollowerCount);

    return () => {
      socket.off("followerAdded", handleUpdateFollowerCount);
    };
  }, [user]);

  ////////socket////////

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) {
    navigate("/login");
    return null;
  }
  // console.log(user);
  useEffect(() => {
    if (user) {
      fetchPendingFollowerCallsCount();
    }
  }, [user]);
  const fetchPendingFollowerCallsCount = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/followers/fetchPendingFollowerCallsCount?usertype=${user?.fld_admin_type}&userid=${user?.id}`
      );
      const result = await response.json();
      if (result.status) {
        setFollowerCount(result.data);
      } else {
        setFollowerCount(0);
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
      setFollowerCount(0);
    }
  };

  const isSubadmin = user.fld_admin_type == "SUBADMIN";
  const isAdmin = user.fld_admin_type == "SUPERADMIN";
  const isExecutive = user.fld_admin_type == "EXECUTIVE";
  const isConsultant = user.fld_admin_type == "CONSULTANT";
  let canApproveCallRequest = false;

  if (user?.fld_permission) {
    try {
      const permission = JSON.parse(user.fld_permission);
      if (Array.isArray(permission)) {
        canApproveCallRequest = permission.includes("Approve_Add_Call_Request");
      }
    } catch (error) {
      console.error("Invalid permission JSON", error);
    }
  }


  return (
    <>
      {/* Top Header */}
      <header className="">
        
        <div className="max-w-[85rem] mx-auto flex items-center justify-between px-2 py-2  pr-5">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img src={logo} alt="Logo" className="h-10 " />
          </div>

          {/* User Info + Bell */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center px-2 cursor-pointer py-1 rounded-md bg-white text-black transition hover:bg-gray-100"
              >
                <CircleUserRound className="mr-1" size={13} />
                <span className="capitalize text-[12px]">{user.fld_name}</span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2  bg-white border border-gray-100  rounded-md shadow-lg z-10 cursor-pointer hover:bg-red-100"
                  >
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-1 text-sm  text-red-600 flex items-center cursor-pointer"
                    >
                      <LogOut className="mr-2" size={13} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Notification />
          </div>
        </div>
      </header>

      {/* Navbar below header */}
      <nav
        className={
          isConsultant
            ? "bg-gradient-to-r from-[#ffa505] to-[#FFC905] !text-black"
            : "bg-gradient-to-r from-[#224d68] to-[#3c7ca5] text-white"
        }
      >
        <div className="max-w-[85rem] mx-auto px-3 py-3">
          <div className="flex space-x-6 text-[12px]">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? isConsultant
                    ? "flex items-center underline text-black font-semibold"
                    : "flex items-center underline text-orange-500 font-semibold"
                  : isConsultant
                    ? "flex items-center text-black hover:text-gray-600"
                    : "flex items-center text-white hover:text-gray-300"
              }
            >
              <LayoutDashboard className="mr-1" size={12} />
              Dashboard
            </NavLink>
            {(isAdmin || isSubadmin) && (
              <NavLink
                to="/summary"
                className={({ isActive }) =>
                  isActive
                    ? isConsultant
                      ? "flex items-center underline text-black font-semibold"
                      : "flex items-center underline text-orange-500 font-semibold"
                    : isConsultant
                      ? "flex items-center text-black hover:text-gray-600"
                      : "flex items-center text-white hover:text-gray-300"
                }
              >
                <BarChart2 className="mr-1" size={12} />
                Summary
              </NavLink>
            )}
            {(isAdmin || isSubadmin) && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  isActive
                    ? isConsultant
                      ? "flex items-center underline text-black font-semibold"
                      : "flex items-center underline text-orange-500 font-semibold"
                    : isConsultant
                      ? "flex items-center text-black hover:text-gray-600"
                      : "flex items-center text-white hover:text-gray-300"
                }
              >
                <Users2 className="mr-1" size={12} />
                Users
              </NavLink>
            )}
            {(isAdmin || isSubadmin) && (
              <NavLink
                to="/teams"
                className={({ isActive }) =>
                  isActive
                    ? isConsultant
                      ? "flex items-center underline text-black font-semibold"
                      : "flex items-center underline text-orange-500 font-semibold"
                    : isConsultant
                      ? "flex items-center text-black hover:text-gray-600"
                      : "flex items-center text-white hover:text-gray-300"
                }
              >
                <Users2 className="mr-1" size={12} />
                Teams
              </NavLink>
            )}
            {(user?.fld_admin_type == "SUPERADMIN" || user.fld_admin_type == "CONSULTANT") ? (
              <div className="flex items-center justify-center">
              <div
                className={`flex items-center bg-white/80 shadow-sm backdrop-blur-md border border-gray-200 rounded-full p-0.5 transition-all`}
              >
                {/* Bookings Tab */}
                <NavLink
                  to="/bookings"
                  className={({ isActive }) =>
                    `f-11 flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? isConsultant
                          ? "bg-gray-900 text-white shadow-sm"
                          : "bg-orange-500 text-white shadow-sm"
                        : isConsultant
                        ? "text-gray-700 hover:bg-gray-100"
                        : "text-gray-600 hover:bg-orange-50"
                    }`
                  }
                >
                  <Table size={12} />
                  <span>Bookings</span>
                </NavLink>
        
                {/* Slots Tab */}
                <NavLink
                  to="/slots"
                  className={({ isActive }) =>
                    `f-11 flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? isConsultant
                          ? "bg-gray-900 text-white shadow-sm"
                          : "bg-orange-500 text-white shadow-sm"
                        : isConsultant
                        ? "text-gray-700 hover:bg-gray-100"
                        : "text-gray-600 hover:bg-orange-50"
                    }`
                  }
                >
                  <List size={12} />
                  <span>Slots</span>
                </NavLink>
              </div>
            </div>
            ) : (
              <NavLink
                to="/bookings"
                className={({ isActive }) =>
                  isActive
                    ? isConsultant
                      ? "flex items-center underline text-black font-semibold"
                      : "flex items-center underline text-orange-500 font-semibold"
                    : isConsultant
                      ? "flex items-center text-black hover:text-gray-600"
                      : "flex items-center text-white hover:text-gray-300"
                }
              >
                <CalendarCheckIcon className="mr-1" size={12} />
                Bookings
              </NavLink>
            )}
            {(user?.fld_admin_type == "SUPERADMIN" ||
              user?.fld_admin_type == "EXECUTIVE" ||
              user?.fld_admin_type == "SUBADMIN" ||
              user?.fld_admin_type == "CONSULTANT") && (
                <NavLink
                  to="/external_calls"
                  className={({ isActive }) =>
                    isActive
                      ? isConsultant
                        ? "flex items-center underline text-black font-semibold"
                        : "flex items-center underline text-orange-500 font-semibold"
                      : isConsultant
                        ? "flex items-center text-black hover:text-gray-600"
                        : "flex items-center text-white hover:text-gray-300"
                  }
                >
                  <Phone className="mr-1" size={12} />
                  External Calls
                </NavLink>
              )}
            {(user?.fld_admin_type == "SUPERADMIN" ||
              user?.fld_admin_type == "EXECUTIVE") && (
                <NavLink
                  to="/call_request_from_rc"
                  className={({ isActive }) =>
                    isActive
                      ? isConsultant
                        ? "flex items-center underline text-black font-semibold"
                        : "flex items-center underline text-orange-500 font-semibold"
                      : isConsultant
                        ? "flex items-center text-black hover:text-gray-600"
                        : "flex items-center text-white hover:text-gray-300"
                  }
                >
                  <Phone className="mr-1" size={12} />
                  Call Request From RC
                </NavLink>
              )}
            {(isAdmin || isSubadmin) && (
              <NavLink
                to="/domain_pref"
                className={({ isActive }) =>
                  isActive
                    ? isConsultant
                      ? "flex items-center underline text-black font-semibold"
                      : "flex items-center underline text-orange-500 font-semibold"
                    : isConsultant
                      ? "flex items-center text-black hover:text-gray-600"
                      : "flex items-center text-white hover:text-gray-300"
                }
              >
                <Globe2 className="mr-1" size={12} />
                Domain Pref
              </NavLink>
            )}
            {(user?.fld_admin_type == "SUPERADMIN" ||
              user?.fld_admin_type == "SUBADMIN" ||
              user?.fld_admin_type == "CONSULTANT") && (
                <NavLink
                  to="/followers"
                  className={({ isActive }) =>
                    isActive
                      ? isConsultant
                        ? "flex items-center underline text-black font-semibold"
                        : "flex items-center underline text-orange-500 font-semibold"
                      : isConsultant
                        ? "flex items-center text-black hover:text-gray-600"
                        : "flex items-center text-white hover:text-gray-300"
                  }
                >
                  <Users2 className="mr-1" size={12} />
                  Follower Calls
                  {followerCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[10px] px-2 py-[1px] rounded-full">
                      {followerCount}
                    </span>
                  )}
                </NavLink>
              )}

            {/* Call Ratings */}
            {/* {user?.fld_admin_type == "SUPERADMIN" && (
              <NavLink
                to="/completedcallratings"
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center  underline text-orange-500 font-semibold"
                    : "flex items-center text-white hover:text-gray-300"
                }
              >
                <BarChart2 className="mr-1" size={12} />
                Call Ratings
              </NavLink>
            )} */}
            {(user?.fld_admin_type == "SUPERADMIN" ||
              (user?.fld_admin_type == "SUBADMIN" &&
                canApproveCallRequest)) && <PlansDropdown />}
          </div>
        </div>
      </nav>
    </>
  );
}
