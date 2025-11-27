import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import moment from "moment-timezone";
import Select from "react-select";
import {
  ArrowRight,
  ArrowDown,
  UserPlus,
  Calendar,
  Clock,
  Link,
  MessageSquare,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

const CallUpdateOtherActions = ({
  bookingData,
  user,
  consultantList,
  externalCallInfo,
  onUpdateExternal,
  onSubmitCompletedComment,
  onAddFollower,
  onUpdateExternalBooking,
  followerConsultants = [],
  hasFollowers,
  getFollowerConsultant,
  loadingFollowers,
}) => {
  const [consultantName, setConsultantName] = useState(
    externalCallInfo?.fld_consultant_name || ""
  );
  const [initialConsultationStatus, setInitialConsultationStatus] = useState(
    bookingData?.fld_consultation_sts || ""
  );
  const [consultationStatus, setConsultationStatus] = useState("");
  const [externalComment, setExternalComment] = useState("");
  const [callCompleteComment, setCallCompleteComment] = useState("");
  const [callCompleteRating, setCallCompleteRating] = useState("");
  const [callRecordingUrl, setCallRecordingUrl] = useState("");

  const [showFollowerForm, setShowFollowerForm] = useState(false);
  const [followerConsultantId, setFollowerConsultantId] = useState("");
  const [followerConsultantName, setFollowerConsultantName] = useState("");

  const [externalBookingDate, setExternalBookingDate] = useState("");
  const [externalBookingTime, setExternalBookingTime] = useState("");
  const [callJoiningLink, setCallJoiningLink] = useState(
    bookingData.fld_call_joining_link || ""
  );

  const isSubadmin = user.fld_admin_type === "SUBADMIN";
  const isExecutive = user.fld_admin_type === "EXECUTIVE";
  const isConsultant = user.fld_admin_type === "CONSULTANT";

  const bookingTime = dayjs(
    `${bookingData.fld_booking_date} ${bookingData.fld_booking_slot}`,
    "YYYY-MM-DD HH:mm"
  );

  const isBeforeBookingTime = dayjs().isBefore(bookingTime);
  const hasNoFollowers = hasFollowers === false;

  const showFollowerSection =
    bookingData.fld_call_confirmation_status === "Call Confirmed by Client" &&
    (isConsultant || isSubadmin) &&
    isBeforeBookingTime &&
    hasNoFollowers &&
    bookingData.fld_call_request_sts !== "Completed" &&
    bookingData.fld_call_related_to !== "I_am_not_sure";

  const showExecutiveExternalBooking =
    isExecutive &&
    bookingData.fld_call_related_to === "I_am_not_sure" &&
    bookingData.fld_call_external_assign === "Yes" &&
    bookingData.fld_call_request_sts !== "Completed";

  const isPendingStatus =
    !["Completed", "Reject", "Cancelled", "Client did not join"].includes(
      bookingData.fld_call_request_sts
    ) &&
    bookingData.fld_call_related_to === "I_am_not_sure" &&
    bookingData.fld_call_external_assign === "Yes" &&
    bookingData.fld_booking_date &&
    bookingData.fld_booking_slot;

  const resetStates = () => {
    setConsultantName(externalCallInfo?.fld_consultant_name || "");
    setInitialConsultationStatus(bookingData?.fld_consultation_sts || "");
    setConsultationStatus("");
    setExternalComment("");
    setCallCompleteComment("");
    setCallCompleteRating("");
    setCallRecordingUrl("");
    setShowFollowerForm(false);
    setFollowerConsultantId("");
    setFollowerConsultantName("");
    setExternalBookingDate("");
    setExternalBookingTime("");
    setCallJoiningLink(bookingData?.fld_call_joining_link || "");
  };

  useEffect(() => {
    resetStates();
  }, [bookingData, externalCallInfo]);

  const handleExternalSubmit = async () => {
    const payload = {
      bookingid: bookingData.id,
      consultant_name: consultantName,
      consultation_sts: consultationStatus,
      externalCallComnt: externalComment,
    };
    onUpdateExternal(payload);
  };

  const handleCompletionSubmit = async () => {
    const payload = {
      bookingid: bookingData.id,
      call_complete_comment: callCompleteComment,
      call_complete_rating: callCompleteRating,
      call_complete_recording: callRecordingUrl,
    };
    onSubmitCompletedComment(payload);
  };

  const handleFollowerSubmit = (e) => {
    e.preventDefault();
    const payload = {
      bookingid: bookingData.id,
      followerConsultantId: followerConsultantId,
      followerConsultantName: followerConsultantName,
    };
    onAddFollower(payload);
  };

  const handleExternalBookingSubmit = () => {
    const payload = {
      bookingid: bookingData.id,
      call_joining_link: callJoiningLink,
      external_booking_date: externalBookingDate,
      external_booking_time: externalBookingTime,
    };
    onUpdateExternalBooking(payload);
  };

  const getRatings = () => [1, 2, 3, 4, 5];

  const followerOptions = followerConsultants.map((f) => ({
    value: f.id,
    label: f.name,
  }));

  return (
    <>
      {/* Call Booking Action */}
      {isSubadmin && isPendingStatus && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Call Booking Action
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consultant Name
              </label>
              {externalCallInfo?.fld_consultant_name ? (
                <p className="text-gray-900 font-medium">
                  {externalCallInfo.fld_consultant_name}
                </p>
              ) : (
                <input
                  type="text"
                  value={consultantName}
                  onChange={(e) => setConsultantName(e.target.value)}
                  placeholder="Enter consultant name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consultation Status
              </label>
              <select
                value={consultationStatus}
                onChange={(e) => setConsultationStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select status</option>
                {initialConsultationStatus !== "Accept" && (
                  <option value="Accept">Accept</option>
                )}
                <option value="Client did not join">Client did not join</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                External Call Comment
              </label>
              <textarea
                value={externalComment}
                onChange={(e) => setExternalComment(e.target.value)}
                placeholder="Enter your comment here..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleExternalSubmit}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* After Call Comments Form */}
      {isExecutive &&
        bookingData.fld_consultation_sts === "Completed" &&
        !bookingData.fld_call_complete_comment &&
        bookingData.callRecordingSts === "Call Recording Pending" && (
          <div className="bg-white  border border-gray-200  rounded-md p-3 ">
            <h2 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-3 mb-3">
              <Star className="mr-2" size={16} />
              After Call Comments
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {/* Comments - Full Width */}
              <div>
                <label className="text-[12px] font-semibold text-gray-700 !mb-2">
                  Comments
                </label>
                <textarea
                  value={callCompleteComment}
                  onChange={(e) => setCallCompleteComment(e.target.value)}
                  placeholder="Add Comments"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
                />
              </div>

              {/* Rating + Call Recording in 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 !mb-2">
                    Rating
                  </label>
                  <select
                    value={callCompleteRating}
                    onChange={(e) => setCallCompleteRating(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Rating</option>
                    {getRatings().map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-gray-700 !mb-2">
                    Call Recording URL
                  </label>
                  <input
                    type="text"
                    value={callRecordingUrl}
                    onChange={(e) => setCallRecordingUrl(e.target.value)}
                    placeholder="G-Drive URL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleCompletionSubmit}
                className="inline-flex items-center px-2 py-1 bg-[#ff6800] text-white text-sm font-medium rounded-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
              >
                Submit
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

      {/* After Call Comments Display */}
      {bookingData.fld_consultation_sts === "Completed" &&
        bookingData.fld_call_complete_comment &&
        bookingData.callRecordingSts === "Call Recording Updated" &&
        bookingData.fld_call_complete_recording && (
          <div className="bg-white  border border-gray-200  rounded-md p-3 ">
            <h2 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-3 mb-3">
              <Star className="mr-2" size={16} />
              After Call Comments
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-2">
                <i class="fa fa-book mt-1" aria-hidden="true"></i>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 !mb-2">
                    Comments
                  </label>
                  <p className="text-gray-900">
                    {bookingData.fld_call_complete_comment}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <i class="fa fa-star mt-1" aria-hidden="true"></i>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 !mb-2">
                    Rating
                  </label>
                  <p className="text-gray-900">
                    {bookingData.fld_call_complete_rating}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <i class="fa fa-key mt-1" aria-hidden="true"></i>
                <div className="truncate ">
                  <label className="text-[12px] font-semibold text-gray-700 !mb-2">
                    Call Recordings
                  </label>
                  <p className="text-blue-600 underline break-words truncate w-full">
                    {bookingData.fld_call_complete_recording.startsWith(
                      "http"
                    ) ? (
                      <a
                        href={bookingData.fld_call_complete_recording}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {bookingData.fld_call_complete_recording}
                      </a>
                    ) : (
                      <a
                        href={`/assets/call_recordings/${bookingData.fld_call_complete_recording}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center"
                      >
                        Download Call Recording File{" "}
                        <ArrowDown className="w-4 h-4 ml-1" />
                      </a>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Add Follower */}
      {showFollowerSection && (
        <div className="bg-white border border-gray-200 rounded p-4 w-full m-w-[40%]">
          <div className="">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-3 mb-3">
              <UserPlus size={16} className="mr-2" />
              Add Follower
            </h2>

            <button
              className="inline-flex items-center px-2 py-1 bg-orange-500 text-white text-[11px] font-medium rounded-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
              onClick={() => {
                setShowFollowerForm(!showFollowerForm);
                getFollowerConsultant();
              }}
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Add Follower
            </button>
          </div>

          {showFollowerForm && (
            <div className="space-y-4 mt-4">
              {loadingFollowers ? (
                <p className="text-blue-600 text-sm mb-2 flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Fetching followers... This may take some time.
                </p>
              ) : (
                <>
                  <Select
                    options={followerOptions}
                    value={
                      followerOptions.find(
                        (option) => option.value === followerConsultantId
                      ) || null
                    }
                    onChange={(selectedOption) => {
                      setFollowerConsultantId(selectedOption?.value || "");
                      setFollowerConsultantName(selectedOption?.label || "");
                    }}
                    placeholder="Select Follower"
                    className="basic-single"
                    classNamePrefix="select"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleFollowerSubmit}
                      className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-[13px]  font-medium rounded-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Add <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Update Booking Info */}
      {showExecutiveExternalBooking && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h2 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-3 mb-3">
            <Calendar className="mr-2" size={16} />
            Update Booking Info
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="url"
              value={callJoiningLink}
              onChange={(e) => setCallJoiningLink(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Call Joining Link"
              required
            />
            <input
              type="date"
              value={externalBookingDate}
              onChange={(e) => {
                const selectedDate = moment.tz(e.target.value, "Asia/Kolkata");

                // Block Sundays
                if (selectedDate.day() === 0) {
                  toast.error("Sundays are not allowed. Please select another date.");
                  return;
                }

                setExternalBookingDate(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              // Min = tomorrow in IST
              // min={moment.tz("Asia/Kolkata").add(1, "day").format("YYYY-MM-DD")}
              min={moment.tz("Asia/Kolkata").format("YYYY-MM-DD")}
              required
            />
            {/* <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={externalBookingTime}
              onChange={(e) => setExternalBookingTime(e.target.value)}
              required
            >
              <option value="">Select Time</option>
              {Array.from({ length: 24 }).flatMap((_, h) =>
                [0, 30].map((m) => {
                  const time = `${h.toString().padStart(2, "0")}:${m
                    .toString()
                    .padStart(2, "0")}`;
                  return time > "09:00" && time < "19:00" ? (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ) : null;
                })
              )}
            </select> */}
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={externalBookingTime}
              onChange={(e) => setExternalBookingTime(e.target.value)}
              required
            >
              <option value="">Select Time</option>
              {Array.from({ length: 24 }).flatMap((_, h) =>
                [0, 30].map((m) => {
                  const time = `${h.toString().padStart(2, "0")}:${m
                    .toString()
                    .padStart(2, "0")}`;

                  // Slots allowed only between 09:00 and 19:00
                  if (!(time >= "09:00" && time <= "19:00")) return null;

                  // If selected date = today, filter out past slots
                  if (externalBookingDate === moment.tz("Asia/Kolkata").format("YYYY-MM-DD")) {
                    const now = moment.tz("Asia/Kolkata");

                    // --- FIXED rounding ---
                    const nextSlot = now.clone().startOf("hour");
                    if (now.minutes() < 30) {
                      nextSlot.minutes(30);
                    } else {
                      nextSlot.add(1, "hour").minutes(0);
                    }

                    const slotMoment = moment.tz(time, "HH:mm", "Asia/Kolkata");

                    if (slotMoment.isBefore(nextSlot)) return null;
                  }

                  return (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  );
                })
              )}
            </select>

            <div className="flex items-end justify-end col-span-3">
              <button
                type="button"
                onClick={handleExternalBookingSubmit}
                className="inline-flex items-center justify-center px-2 py-1 bg-blue-600 text-white text-[12px] font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
              >
                <ArrowRight className="mr-1" size={13} />
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CallUpdateOtherActions;
