import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Select from "react-select";
import {
  ArrowRight,
  Settings,
  UserCheck,
  ExternalLink,
  FileText,
  Upload,
  Star,
} from "lucide-react";
import API_URL from "../../../utils/constants";

const CallUpdateActions = ({
  bookingData,
  user,
  consultantList,
  onUpdateStatus,
  onReassignCall,
  onAssignExternal,
}) => {
  const [selectedAction, setSelectedAction] = useState("");
  const [consultationStatus, setConsultationStatus] = useState("");
  const [statusOptions, setStatusOptions] = useState([]);
  const [comment, setComment] = useState("");
  const [selectedConsultant, setSelectedConsultant] = useState("");
  const [externalConsultantName, setExternalConsultantName] = useState("");
  const [rescheduledOthersText, setRescheduledOthersText] = useState("");
  const [scaleQuestion1, setScaleQuestion1] = useState("Being Poor");
  const [scaleQuestion2, setScaleQuestion2] = useState("Being Poor");
  const [scaleQuestion3, setScaleQuestion3] = useState("scale8");
  const [callSummary, setCallSummary] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const userType = user.fld_admin_type;
  
  const permissions = user.fld_permission;
  const [externalCount, setExternalCount] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [displayConsultantId, setDisplayConsultantId] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
const [ratingQ1, setRatingQ1] = useState(0);
  const [hoverQ1, setHoverQ1] = useState(0);

  const [ratingQ2, setRatingQ2] = useState(0);
  const [hoverQ2, setHoverQ2] = useState(0);

  // Tooltip labels
  const tooltips = ["Poor", "Average", "Good"];

  // Function to get star color based on selected rating
  const getStarColor = (index, activeValue) => {
    if (activeValue === 3) return "#22c55e"; // green for all when Good
    if (activeValue === 2) return index < 2 ? "#facc15" : "#E5E7EB"; // yellow for first 2 when Average
    if (activeValue === 1) return index === 0 ? "#ef4444" : "#E5E7EB"; // red for first star when Poor
    return "#E5E7EB"; // default gray
  };

  const StarRating = ({ rating, setRating, hover, setHover }) => {
    const activeValue = hover || rating; // priority to hover
    return (
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((star, index) => (
          <div className="relative group" key={star}>
            <button
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={getStarColor(index, activeValue)}
                className="w-7 h-7 transition-all duration-200 hover:scale-110 cursor-pointer"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25l2.954 6.01 6.646.967-4.8 4.676 1.133 6.616L12 17.77l-5.933 3.112 1.133-6.616-4.8-4.676 6.646-.967L12 2.25z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Tooltip */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
              {tooltips[index]}
            </span>
          </div>
        ))}
      </div>
    );
  };



  const resetStates = () => {
    setSelectedAction("");
    setConsultationStatus("");
    setStatusOptions([]);
    setComment("");
    setSelectedConsultant("");
    setExternalConsultantName("");
    setRescheduledOthersText("");
    setScaleQuestion1("Being Poor");
    setScaleQuestion2("Being Poor");
    setScaleQuestion3("scale8");
    setCallSummary("");
    setUploadedFile(null);
    setExternalCount(0);
    setIsButtonDisabled(false);
    setDisplayConsultantId("");
  };

  // Example: Reset whenever bookingData changes
  useEffect(() => {
    resetStates();
  }, [bookingData]);

  useEffect(() => {
    if (bookingData?.id) {
      fetchExternalCallCount(bookingData.id);
    }
  }, [bookingData?.id]);

  // Check if component should be visible
  const shouldShowComponent = () => {
    return (
      (userType === "CONSULTANT" || userType === "SUBADMIN") &&
      !["Completed", "Reject", "Cancelled"].includes(
        bookingData.fld_consultation_sts
      ) &&
      bookingData.fld_call_related_to !== "I_am_not_sure" &&
      bookingData.fld_call_external_assign !== "Yes"
    );
  };

  const fetchExternalCallCount = async (bookingId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/bookings/getExternalCallCount?bookingId=${bookingId}`
      );
      const data = await response.json();

      if (response.ok) {
        setExternalCount(data.totalExternalCalls);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  // Check if external assignment is allowed
  const canAssignExternal = () => {
    return (
      (bookingData.fld_consultation_sts !== "Accept" ||
        bookingData.fld_call_confirmation_status ===
          "Call Confirmed by Client") &&
      externalCount == 0
    );
  };

  // Generate status options based on current status and conditions
  const getStatusOptions = () => {
    const options = [];
    const currentStatus = bookingData.fld_consultation_sts || "";
    const isTeam = bookingData.fld_consultant_another_option === "TEAM";
    const callStatus = bookingData.fld_call_request_sts;
    const isConsultant = userType === "CONSULTANT";

    const bookingTime = new Date(
      `${bookingData.fld_booking_date} ${bookingData.fld_booking_slot}`
    );
    const currentTime = new Date();
    const isBeforeCallTime =
      currentTime < new Date(bookingTime.getTime() - 30 * 60000);
    const isAfterCallTime =
      currentTime > new Date(bookingTime.getTime() - 30 * 60000);

    let hidenext = false;
    let hideRescheduled = false;

    // PENDING | EMPTY | NULL | RESCHEDULED CASE
    if (
      currentStatus === "Pending" ||
      currentStatus === "" ||
      currentStatus === null ||
      currentStatus === "Rescheduled"
    ) {
      if (currentStatus !== "Pending") {
        options.push({ value: "Pending", label: "Pending" });
      }

      if (!isTeam && currentStatus !== "Accept") {
        options.push({ value: "Accept", label: "Accept" });
      }

      if (currentStatus !== "Rescheduled") {
        options.push({ value: "Rescheduled", label: "Reschedule" });
        hideRescheduled = true;
      }

      if (currentStatus !== "Reject") {
        options.push({ value: "Reject", label: "Reject" });
      }
    }

    // ACCEPT + BEFORE CALL TIME
    if (!isTeam && currentStatus === "Accept" && isBeforeCallTime) {
      if (currentStatus !== "Accept") {
        options.push({ value: "Accept", label: "Accept" });
      }
    }

    if (!isTeam) {
      options.push({
        value: "Client did not join",
        label: "Client did not join",
      });

      if (!hideRescheduled) {
        options.push({ value: "Rescheduled", label: "Rescheduled" });
      }

      options.push({ value: "Completed", label: "Completed" });
      hidenext = true;
    }

    // ACCEPT + AFTER CALL TIME
    if (currentStatus === "Accept" && isAfterCallTime) {
      if (currentStatus !== "Accept" && !isTeam) {
        options.push({ value: "Accept", label: "Accept" });
      }
    }

    if (!hidenext) {
      options.push({
        value: "Client did not join",
        label: "Client did not join",
      });
      options.push({ value: "Completed", label: "Completed" });
    }

    if (currentStatus === "Client did not join") {
      options.push({
        value: "Client did not join",
        label: "Client did not join",
      });
    }

    // REJECT CASE
    if (currentStatus === "Reject") {
      options.push({ value: "Reject", label: "Reject" });

      if (!isTeam) {
        options.push({ value: "Accept", label: "Accept" });
      }

      options.push({ value: "Rescheduled", label: "Rescheduled" });
    }

    // CANCELLED
    if (callStatus !== "Cancelled" && !isConsultant) {
      options.push({ value: "Cancelled", label: "Cancelled" });
    }

    return options;
  };

  const handleActionChange = (action) => {
    setSelectedAction(action);

    setConsultationStatus("");
    setStatusOptions([]);
    setComment("");
    setSelectedConsultant("");
    setExternalConsultantName("");
  };

  const handleStatusChange = (status) => {
    setConsultationStatus(status);
    console.log(status);
    setStatusOptions([]); // Reset options when status changes
  };

  const handleStatusOptionChange = (option, checked, isRadio = false) => {
    if (isRadio) {
      setStatusOptions([option]);
    } else {
      if (checked) {
        setStatusOptions([...statusOptions, option]);
      } else {
        setStatusOptions(statusOptions.filter((opt) => opt !== option));
      }
    }
  };

  const handleUpdateStatus = () => {
    const formData = {
      bookingId: bookingData.id,
      consultationStatus,
      statusOptions,
      comment,
      scaleQuestion1,
      scaleQuestion2,
      scaleQuestion3,
      callSummary,
      file: uploadedFile,
      rescheduledOthers: rescheduledOthersText,
    };
    onUpdateStatus(formData);
  };

  const handleReassignCall = () => {
    const formData = {
      bookingId: bookingData.id,
      consultantId: selectedConsultant,
      bookingSlot: bookingData.fld_booking_slot,
      bookingDate: bookingData.fld_booking_date,
    };
    onReassignCall(formData);
  };

  const handleAssignExternal = () => {
    const formData = {
      bookingId: bookingData.id,
      consultantName: externalConsultantName,
    };
    onAssignExternal(formData);
  };

  if (!shouldShowComponent()) {
    return null;
  }

  const consultantOptions = consultantList
    .filter((consultant) => consultant.id !== bookingData.fld_consultantid)
    .map((consultant) => ({
      value: consultant.id,
      label: consultant.fld_name,
    }));

  const checkCompletedCallsForSelectedConsultant = async (consultantId) => {
    if (
      !bookingData.fld_email ||
      !consultantId ||
      bookingData.fld_sale_type !== "Presales"
    )
      return;

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/checkCompletedCall`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            primaryconsultantid: consultantId,
            clientemail: bookingData.fld_email,
            saletype: bookingData.fld_sale_type,
          }),
        }
      );

      const resultText = await response.text();

      if (resultText === "call not completed" || resultText === "add call") {
        setIsButtonDisabled(false);
        // toast.success('Call not completed. You can proceed.');
        return;
      }

      // Else: call already completed
      const [displayMsg, displayConId, displayPrimConId] =
        resultText.split("||");
      setDisplayConsultantId(displayConId);

      if (displayPrimConId === displayConId) {
        setIsButtonDisabled(true);
      } else {
        setIsButtonDisabled(false);
      }

      if (displayMsg) {
        toast.error(displayMsg);
        //toast.error('You cannot reassign the call. Call already completed!');
      } else {
        toast.error("You cannot reassign the call. Call already completed!");
      }
    } catch (err) {
      console.error(err);
      //toast.error('Error checking consultant call status.');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded p-4 ">
      <div id="msgloader" className="text-center"></div>

      <div className="">
        <h2 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-3 mb-3">
          <Settings size={16} className="mr-2" />
          Call Booking Action
        </h2>

        <div className="flex w-full gap-2">
          {[
            {
              label: "Update Call Status",
              value: "Update Call Status",
              // icon: <UserCheck className="mr-1 mt-0.5" size={13} />,
            },
            {
              label: "Reassign Call",
              value: "Reassign Call",
              // icon: <UserCheck className="mr-1 mt-0.5" size={13} />,
            },
            {
              label: "Assign External",
              value: "Assign External",
              // icon: <ExternalLink className="mr-1 mt-0.5" size={13} />,
            },
          ].map((tab) => (
            <label
              key={tab.value}
              className={`flex items-start px-3 py-1 rounded-md border transition-all cursor-pointer
        ${
          selectedAction === tab.value
            ? "bg-orange-50 border-orange-500 text-orange-700"
            : "bg-white border-orange-200 hover:bg-orange-50 text-gray-700 hover:text-orange-700"
        }`}
            >
              <input
                type="radio"
                name="call_booking_action"
                value={tab.value}
                checked={selectedAction === tab.value}
                onChange={(e) => handleActionChange(e.target.value)}
                className="hidden"
              />
              {tab.icon}
              <span className="text-[12px] font-medium">{tab.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Update Call Status Form */}
      {selectedAction === "Update Call Status" && (
        <div className="space-y-4 mt-4 bg-orange-50 border-orange-400 border p-3 rounded">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={consultationStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full bg-white px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Option</option>
              {getStatusOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Accept Status Options */}
          {consultationStatus === "Accept" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Options <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-2 mb-4 border border-gray-200 rounded bg-white hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    value="I have gone through all the details"
                    onChange={(e) =>
                      handleStatusOptionChange(e.target.value, e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-[12px] text-gray-700">
                    I have gone through all the details
                  </span>
                </label>
                <label className="flex items-center p-2 mb-4 border border-gray-200 rounded bg-white hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    value="I have received the meeting link"
                    onChange={(e) =>
                      handleStatusOptionChange(e.target.value, e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-[12px] text-gray-700">
                    I have received the meeting link
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Client Did Not Join Comments */}
          {consultationStatus === "Client did not join" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Enter your comments..."
                required
              />
            </div>
          )}

          {/* Reject Status Options */}
          {consultationStatus === "Reject" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Relevant Options <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {[
                  "Details are incomplete",
                  "Meeting link is invalid",
                  "Call not related to my subject area",
                  "Call scheduled by mistake",
                ].map((option) => (
                  <label
                    key={option}
                    className="flex items-center p-2 mb-4 border border-gray-200 rounded bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={option}
                      onChange={(e) =>
                        handleStatusOptionChange(
                          e.target.value,
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-[12px] text-gray-700">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Rescheduled Status Options */}
          {consultationStatus === "Rescheduled" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Options <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {[
                  "I have another meeting scheduled offline",
                  "I have urgent work delivery",
                  "I have internal team call",
                  "Others",
                ].map((option) => (
                  <label
                    key={option}
                    className="flex items-center p-2 mb-4 border border-gray-200 rounded bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="rescheduled_options"
                      value={option}
                      onChange={(e) =>
                        handleStatusOptionChange(e.target.value, true, true)
                      }
                      className="w-3 h-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-[12px] text-gray-700">
                      {option}
                    </span>
                  </label>
                ))}
              </div>

              {statusOptions.includes("Others") && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Others <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={rescheduledOthersText}
                    onChange={(e) => setRescheduledOthersText(e.target.value)}
                    className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please specify..."
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Completed Status - Rating Questions */}
          {consultationStatus === "Completed" &&
            (userType == "CONSULTANT" ||
              (userType == "SUBADMIN" &&
                user.fld_subadmin_type == "consultant_sub")) && (
              <div className="space-y-4">
                <div>
                  {/* <label className="block text-sm font-medium text-gray-700 mb-4">
                    On Scale of 1, 2 and 3 (1 being Poor, 2 being Average and 3
                    being Good), Please answer the following questions.
                  </label> */}

                  <div className="space-y-4">
                    <div className="space-y-6 ">
      {/* Question 1 */}
      <div className="bg-white p-3 rounded shadow">
        <div className="mb-4  font-medium text-gray-700">
          Question 1 <span className="text-red-500">*</span>: Was the CRM able
          to Bridge the call effectively?
        </div>
        <StarRating
          rating={ratingQ1}
          setRating={setRatingQ1}
          hover={hoverQ1}
          setHover={setHoverQ1}
        />
      </div>

      {/* Question 2 */}
      <div className="bg-white p-3 rounded shadow">
        <div className="mb-4  font-medium text-gray-700">
          Question 2 <span className="text-red-500">*</span>: Was the CRM's voice loud and clear?
        </div>
        <StarRating
          rating={ratingQ2}
          setRating={setRatingQ2}
          hover={hoverQ2}
          setHover={setHoverQ2}
        />
      </div>
    </div>

                    {/* Question 3 with Toggle UI */}
                    <div className="bg-white p-3 rounded shadow">
                      <div className="mb-4  font-medium text-gray-700">
                        Question 3 <span className="text-red-500">*</span>: Was
                        the client informed about the call being recorded?
                      </div>

                      <div className="flex items-center gap-2">
                        {/* No Label */}
                        <span
                          className={`text-xs font-medium transition-colors ${
                            scaleQuestion3 !== "scale8"
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          No
                        </span>

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          onClick={() =>
                            setScaleQuestion3(
                              scaleQuestion3 === "scale8" ? "scale9" : "scale8"
                            )
                          }
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                            scaleQuestion3 === "scale8"
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition ${
                              scaleQuestion3 === "scale8"
                                ? "translate-x-5"
                                : "translate-x-1"
                            }`}
                          />
                        </button>

                        {/* Yes Label */}
                        <span
                          className={`text-xs font-medium transition-colors ${
                            scaleQuestion3 === "scale8"
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          Yes
                        </span>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex items-center space-x-2 mt-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            scaleQuestion3 === "scale8"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <span className="text-sm text-gray-600">
                          Client was {scaleQuestion3 === "scale8" ? "" : "not "}
                          informed about call recording
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Call Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={callSummary}
                    onChange={(e) => setCallSummary(e.target.value)}
                    className="w-full bg-white px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Enter call summary..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Upload className="w-4 h-4 inline mr-1" />
                    Upload File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadedFile(e.target.files[0])}
                    className="w-full bg-white px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

          <div className="flex justify-end pt-0">
            <button
              type="button"
              onClick={handleUpdateStatus}
              className="inline-flex items-center px-2 py-1 bg-[#ff6800] text-white text-[12px] font-medium rounded-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
            >
              <ArrowRight className="mr-1" size={12} />
              Update
            </button>
          </div>
        </div>
      )}

      {/* Reassign Call Form */}
      {selectedAction === "Reassign Call" && (
        <div className="space-y-6 mt-4 bg-orange-50 border-orange-400 border p-3 rounded">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Consultant <span className="text-red-500">*</span>
            </label>
            <div className=" gap-4">
              <div className="flex-1">
                <Select
                  value={
                    consultantOptions.find(
                      (option) => option.value === selectedConsultant
                    ) || null
                  }
                  onChange={(selectedOption) => {
                    const consultantId = selectedOption?.value || "";
                    setSelectedConsultant(consultantId);
                    checkCompletedCallsForSelectedConsultant(consultantId);
                  }}
                  options={consultantOptions}
                  placeholder="Select Consultant"
                  classNamePrefix="react-select the_hei"
                  isClearable
                  required
                />
                <input
                  type="hidden"
                  id="call_completed_consultant_id"
                  value={displayConsultantId}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleReassignCall}
                  disabled={isButtonDisabled}
                  className="inline-flex items-center px-2 py-1 mt-4 bg-[#ff6800] text-white text-[12px] font-medium rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="mr-2" size={12} />
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign External Form */}
      {selectedAction === "Assign External" && (
        <div className="space-y-6 mt-4 bg-orange-50 border-orange-400 border p-3 rounded">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consultant Name <span className="text-red-500">*</span>
            </label>
            <div className="">
              <input
                type="text"
                value={externalConsultantName}
                onChange={(e) => setExternalConsultantName(e.target.value)}
                placeholder="Enter consultant name"
                className="w-full bg-white flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAssignExternal}
                  className="inline-flex items-center px-2 py-1 mt-4 bg-[#ff6800] text-white text-[12px] font-medium rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <ArrowRight className="mr-2" size={12} />
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div id="call_completed_msg"></div>
      <div id="call_completed_error_msg"></div>
    </div>
  );
};

export default CallUpdateActions;
