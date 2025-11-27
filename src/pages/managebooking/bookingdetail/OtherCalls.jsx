import React, { useEffect, useState } from 'react';
import { Clock, User, Calendar, Phone, FileText, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '../../../helpers/CommonHelper';
import API_URL from '../../../utils/constants';

const OtherCalls = ({ bookingId, clientId, fetchBookingById }) => {
  const [allbookingData, setAllbookingData] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(bookingId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAllClientBookingData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/api/bookings/getAllClientBookingData?clientId=${clientId}`
        );

        const result = await response.json();

        if (result.status) {
          const filteredData = result.data.filter(
    booking => booking.id != selectedBookingId
  );
  setAllbookingData(filteredData);
        } else {
          console.error("Failed to fetch other bookings");
        }
      } catch (err) {
        console.error("Error fetching other bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      getAllClientBookingData();
    }
  }, [clientId]);

  useEffect(() => {
    setSelectedBookingId(bookingId);
  }, [bookingId]);

  const handleRowClick = (id) => {
    setSelectedBookingId(id);
    fetchBookingById(id);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      "Completed": "bg-green-100 text-green-800",
      "Pending": "bg-yellow-100 text-yellow-800",
      "Cancelled": "bg-red-100 text-red-800",
      "Scheduled": "bg-blue-100 text-blue-800",
      "Rescheduled": "bg-purple-100 text-purple-800",
      "Accept": "bg-orange-100 text-orange-800"
    };
    
    const colorClass = statusColors[status] || "bg-gray-100 text-gray-800";
    
    return (
      <span className={`px-2 py-1 leading-none rounded-full text-[9px] font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      
      <h2 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-300 pb-3 mb-3">
        <Phone size={14} className="" />
        Previous Calls
        <span className="bg-red-100 text-gray-600 px-2 py-1 rounded text-[12px] leading-none ">
           {allbookingData.filter(item => item.id !== selectedBookingId).length} calls
        </span>
      </h2>

      {allbookingData.length === 0 ? (
        <div className="text-center py-2 text-gray-500">
          <Phone className="w-7 h-7 mx-auto mb-3 text-gray-300" />
          <p className="text-[14px] font-medium">No previous calls available</p>
          <p className="text-[12px]">This client has no call history</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-gray-200">
          <div className="overflow-y-auto max-h-[16.6rem]">
            <table className="w-full text-[11px]">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-white uppercase tracking-wider whitespace-nowrap">
                    Call Type
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-white uppercase tracking-wider whitespace-nowrap">
                    Consultant
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-white uppercase tracking-wider whitespace-nowrap">
                    Booking Date
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-white uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allbookingData
    .filter(item => item.id !== selectedBookingId ) 
    .map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item.id)}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      item.id == selectedBookingId 
                        ? 'bg-blue-50  border-blue-500' 
                        : ''
                    }`}
                  >
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* <div className="mr-1">
                          <Phone className="text-gray-600" size={11}  />
                        </div> */}
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.fld_sale_type || 'General Call'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* <div className="mr-1">
                          <User className="text-gray-900" size={11}  />
                        </div> */}
                        <div className="text-gray-900">
                          {item.admin_name || 'Unassigned'}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* <Calendar className="text-gray-400 mr-1" size={11} /> */}
                        <div>
                          <div className="text-gray-900">{formatDate(item.fld_booking_date)}</div>
                          <div className="text-gray-500">{item.fld_booking_slot}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {getStatusBadge(item.fld_call_request_sts)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherCalls;