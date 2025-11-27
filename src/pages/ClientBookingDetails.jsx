import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_URL from '../utils/constants';

export default function ClientBookingDetails() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loaderMessage, setLoaderMessage] = useState("");

  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/bookings/fetchBookingById`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ bookingId }),
          }
        );

        const result = await response.json();

        if (result.status) {
          console.log("Booking Data:", result.data);
          setBooking(result.data);
        } else {
          setLoaderMessage("Booking Not Found!");
          console.warn("Booking not found or error:", result.message);
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        setLoaderMessage("Something went wrong!");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans">
        {/* Navbar */}
        <nav className="bg-gray-300 py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center">
              <div className="ml-4 lg:ml-16">
                <div className="w-32 h-8 bg-gray-400 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </nav>

        {/* Skeleton Loader */}
        <div className="flex justify-center items-center min-h-96">
          <div className="w-full max-w-2xl mx-4 bg-white rounded-lg shadow-lg p-8 mt-12 mb-16">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-300 rounded w-1/3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-5 bg-gray-300 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/5"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No Booking Found
  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans">
        <nav className="bg-gray-300 py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center">
              <div className="ml-4 lg:ml-16 text-xl font-semibold">
                Rapid Collaborate
              </div>
            </div>
          </div>
        </nav>
        <div className="flex justify-center items-center min-h-96">
          <div className="w-full max-w-2xl mx-4 bg-white rounded-lg shadow-lg p-8 mt-12 mb-16">
            <h4 className="text-xl text-gray-700">
              {loaderMessage || "No booking found."}
            </h4>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Navbar */}
      <nav className="py-3" style={{ backgroundColor: "rgb(215, 215, 215)" }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <div className="ml-4 lg:ml-16 text-xl font-semibold text-gray-800">
              Rapid Collaborate
            </div>
          </div>
        </div>
      </nav>

      {/* Booking Details */}
      {booking.fld_call_confirmation_status === "Call Confirmed by Client" && (
        <div className="flex justify-center items-center py-6 flex-1 ">
          <div className="w-full max-w-2xl mx-auto ">
            <div className="bg-white rounded-lg shadow-xl p-4 border-2 border-gray-300">
              <div style={{ backgroundColor: "rgb(239, 239, 239)" }}>
                <div
                  className="w-full h-2 rounded-t"
                  style={{ backgroundColor: "rgb(72, 42, 129)" }}
                ></div>

                <div className="bg-white p-7">
                  <div className="text-gray-600 text-sm space-y-4" style={{ lineHeight: "2em" }}>
                    <p className="text-black">
                      Hi <span>{booking.fld_name}</span>,
                    </p>

                    <p className="text-black">
                      Thank you for confirming the call {booking.fld_bookingcode}.
                      Here are the details of your appointment:
                    </p>

                    <p className="text-black font-bold">
                      Topic - {booking.fld_call_regarding}
                    </p>

                    <div className="text-black">
                      <strong>
                        {formatDate(booking.fld_booking_date)}, {booking.fld_booking_slot},{" "}
                        {booking.fld_timezone}
                      </strong>
                      <br />
                      MEETING LINK:{" "}
                      <a
                        href={booking.fld_call_joining_link}
                        className="text-blue-600 underline hover:text-blue-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {booking.fld_call_joining_link}
                      </a>
                    </div>

                    <p className="text-black">Thanks, <br />Rapid Collaborate.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-900 text-white py-2 mt-auto">
        <div className="container mx-auto px-4">
          <small>All Rights Reserved, Rapid Collaborate, (c) Copyright 2024.</small>
        </div>
      </div>
    </div>
  );
}
