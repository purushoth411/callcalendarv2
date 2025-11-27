import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../utils/idb";
import { useNavigate } from "react-router-dom";
import ConsultantTimings from "./ConsultantTimings";
import BlockSlot from "./BlockSlot";
import { getSocket } from "../../utils/Socket";
import API_URL from "../../utils/constants";
import PresaleBookingSlots from "./PresaleBookingSlots";

function Dashboard() {
  const { user } = useAuth();
  const [callCounts, setCallCounts] = useState({
    Accept: 0,
    Reject: 0,
    Cancelled: 0,
    Rescheduled: 0,
    Completed: 0,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const statuses = [
    "Accept",
    "Reject",
    "Cancelled",
    "Rescheduled",
    "Completed",
  ];

  ///socket ////////

  useEffect(() => {
    const socket = getSocket();



    const handleBookingUpdated = (updatedBooking) => {
      console.log("Socket Called - Booking Updated");
      fetchAllStatuses();
    };



    socket.on("bookingUpdated", handleBookingUpdated);


    return () => {

      socket.off("bookingUpdated", handleBookingUpdated);

    };
  }, [user.id]);

  ////////socket////////

  const fetchParticularStatus = async (crmId, status) => {
    try {
      const response = await fetch(
        `${API_URL}/api/dashboard/getparticularstatuscalls`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ crm_id: crmId, status }),
        }
      );
      const result = await response.json();
      return result.status && Array.isArray(result.data)
        ? result.data.length
        : 0;
    } catch (error) {
      console.error("Error fetching calls for status:", status, error);
      return 0;
    }
  };

  const fetchAllStatuses = async () => {
    setLoading(true);
    try {
      const counts = {};
      const crmId = user?.fld_admin_type === "EXECUTIVE" ? user?.id : "";

      for (let status of statuses) {
        counts[status] = await fetchParticularStatus(crmId, status);
      }
      setCallCounts(counts);
    } catch (error) {
      toast.error("Failed to fetch call statuses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      user?.fld_admin_type === "SUPERADMIN" ||
      user?.fld_admin_type === "EXECUTIVE"
    ) {
      fetchAllStatuses();
    }
  }, [user]);

  const submitAndRedirect = (status) => {
    console.log("Redirect to", status);

    navigate(`/bookings/${status}`);
  };

  return (
    <div className="">
      <div className="flex gap-2 items-center mb-4"><h2 className="text-[16px] font-semibold text-gray-900">Dashboard</h2></div>
      {(user?.fld_admin_type === "SUPERADMIN" ||
        user?.fld_admin_type === "EXECUTIVE") && (
          <div className="w-full bg-white p-4  rounded">
            <div className="flex justify-between items-center flex-1 mb-4">
              <h4 className="text-[15px] font-semibold text-gray-900">
                Call Status Summary - Today
              </h4>
              <button
                onClick={fetchAllStatuses}
                className="bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 text-[12px] ml-2"
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 justify-center">
              {statuses.map((status) => (
                <div
                  key={status}
                  onClick={() => submitAndRedirect(status)}
                  className={`cursor-pointer text-center p-7 rounded shadow border transition-colors
        ${status === "Accept"
                      ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                      : status === "Reject"
                        ? "bg-rose-50 hover:bg-rose-100 border-rose-200"
                        : status === "Cancelled"
                          ? "bg-purple-50 hover:bg-purple-100 border-purple-200"
                          : status === "Rescheduled"
                            ? "bg-amber-50 hover:bg-amber-100 border-amber-200"
                            : /* Completed */
                            "bg-blue-50 hover:bg-blue-100 border-blue-200"
                    }`}
                >
                  <div
                    className={`font-semibold
          ${status === "Accept"
                        ? "text-emerald-700"
                        : status === "Reject"
                          ? "text-rose-700"
                          : status === "Cancelled"
                            ? "text-purple-700"
                            : status === "Rescheduled"
                              ? "text-amber-700"
                              : "text-blue-700"
                      }`}
                  >
                    {status}
                  </div>

                  <div className="mt-1 text-xl font-bold flex justify-center items-center">
                    {loading ? (
                      <div className="w-5 h-5 animate-pulse bg-orange-500 rounded" />
                    ) : (
                      <p className="bg-orange-500 text-white px-2 py-1 rounded text-sm">
                        {callCounts[status]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* {(user?.fld_admin_type === "SUBADMIN" || user?.fld_admin_type === "CONSULTANT") && <BlockSlot user={user} />} */}

        {(user?.fld_admin_type === "SUPERADMIN") && <BlockSlot user={user} />}

        {/* {(user?.fld_admin_type === "SUPERADMIN") && <PresaleBookingSlots user={user} />} */}

      {user?.fld_admin_type === "SUPERADMIN" && (
        <div className="bg-white p-4 mt-5 rounded">
          <ConsultantTimings />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
