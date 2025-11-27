import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowDown,
  Eye,
  ArrowRight,
  User,
  Mail,
  Trash2,
  ProjectorIcon,
  X,
  PhoneMissed,
  Handshake,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../utils/idb";
import toast from "react-hot-toast";
import ViewCommentModal from "./ViewCommentModal";
import SetAsConvertedModal from "./SetAsConvertedModal";
import ChatBox from "./ChatBox";
import ReassignModal from "./ReassignModal";
import UserInformation from "./UserInformation";
import { AnimatePresence, motion } from "framer-motion";
import ConsultantInformation from "./ConsultantInformation";
import {
  fetchAllConsultants,
  fetchFollowerData,
} from "../../../helpers/CommonApi";
import Select from "react-select";
import CallUpdateActions from "./CallUpdateActions";
import OverallHistory from "./OverallHistory";
import OtherCalls from "./OtherCalls";
import CallUpdateOtherActions from "./CallUpdateOtherActions";
import SocketHandler from "../../../hooks/SocketHandler";
import { getSocket } from "../../../utils/Socket";
import API_URL from "../../../utils/constants";

const BookingDetail = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [bookingData, setBookingData] = useState([]);
  const { user, priceDiscoutUsernames } = useAuth();
  const [statusByCrm, setStatusByCrm] = useState("");

  const [reassignComment, setReassignComment] = useState("");
  const [showReassignForm, setShowReassignForm] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [messageData, setMessageData] = useState([]);
  const [isMsgSending, setIsMsgSending] = useState(false);
  const [otherBookings, setOtherBookings] = useState([]);
  const [isReassigning, setIsReassigning] = useState(false);
  const [externalCallInfo, setExternalCallInfo] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("Processing...");
  const [primaryConsultantId, setPrimaryConsultantId] = useState("");
  const [cancelComment, setCancelComment] = useState("");
  const [consultantList, setConsultantList] = useState([]);
  const [followerList, setFollowerList] = useState([]);
  const [followerConsultants, setFollowerConsultants] = useState([]);
  const [hasFollowers, setHasFollowers] = useState(false);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const isSuperAdminOrExecutive =
    user?.fld_admin_type === "SUPERADMIN" ||
    user?.fld_admin_type === "EXECUTIVE";
  const [activeTab, setActiveTab] = useState(
    isSuperAdminOrExecutive ? "consultant" : "user"
  );
  ///socket
    useEffect(() => {
  const socket = getSocket();

  const handleIncomingChat = (notif) => {
    if (notif.fld_bookingid == bookingId) {
      setMessageData((prev) => [ ...prev,notif]);
    }
  };

  socket.on("chatAdded", handleIncomingChat);

  return () => {
    socket.off("chatAdded", handleIncomingChat);
  };
}, [bookingId]);


  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleBookingDeleted = ({ bookingId: deletedId }) => {
      if (String(deletedId) == String(bookingId)) {
        toast.error("Booking deleted by other user", { duration: 3000 });

        setTimeout(() => {
          navigate("/bookings");
        }, 2000);
      }
    };

    const handleBookingUpdated = (updatedBooking) => {
      console.log("SOcket Function called");
      if (String(updatedBooking.id) == String(bookingId)) {
        console.log("Updated by socket");

        fetchBookingById(updatedBooking.id, false);
      }
    };

    socket.on("bookingDeleted", handleBookingDeleted);
    socket.on("bookingUpdated", handleBookingUpdated);

    return () => {
      socket.off("bookingDeleted", handleBookingDeleted);
      socket.off("bookingUpdated", handleBookingUpdated);
    };
  }, [navigate, bookingId]);

  useEffect(() => {
    fetchBookingById(bookingId);
  }, [bookingId]);

  const fetchBookingById = async (bookingId, loader = true) => {
    let tempBooking = null;
    try {
      resetBookingStates();

      if (!loader) {
        setIsProcessing(true);
        setLoaderMessage("Updating Booking Details...");
      } else {
        setIsProcessing(true);
        setLoaderMessage("Loading...");
      }

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
        setBookingData(result.data);
        tempBooking = result.data;

        const isSuperOrSubAdmin =
          user?.fld_admin_type == "SUPERADMIN" ||
          user?.fld_admin_type == "SUBADMIN";
        const isConsultant =
          user?.fld_admin_type == "CONSULTANT" &&
          (String(tempBooking.fld_consultantid) == String(user?.id) ||
            String(tempBooking.fld_secondary_consultant_id) ==
              String(user?.id));
        const isExecutive =
          user?.fld_admin_type == "EXECUTIVE" &&
          String(tempBooking.fld_addedby) == String(user?.id);
        if (isSuperOrSubAdmin || isConsultant || isExecutive) {
          setHasPermission(true);
        } else {
          toast.error("You don't have permission.");

  setTimeout(() => {
    navigate(-1); 
  }, 2000);
          setHasPermission(false);
        }
      } else {
        setLoaderMessage("Booking Not Found!");
        console.warn("Booking not found or error:", result.message);
      }
    } catch (error) {
      setLoaderMessage("Error in Loading!");
      console.error("Error fetching booking:", error);
    } finally {
      fetchMsgData(bookingId);
      getOtherBookings();
      getExternalCallByBookingId(bookingId);
      if (
        tempBooking && (
        tempBooking.fld_subject_area ||
        tempBooking.fld_call_related_to)
      ) {
        fetchConsultants(
          tempBooking.fld_subject_area,
          tempBooking.fld_call_related_to
        );
      } else {
        fetchConsultants(null, null);
      }
      setIsProcessing(false);
      setLoaderMessage("Processing...");
    }
  };

  // 🔹 Reset all booking-related states
const resetBookingStates = () => {
  setBookingData([]);
  setStatusByCrm("");
  setReassignComment("");
  setShowReassignForm(false);
  setShowConvertForm(false);
  setIsSubmitting(false);
  setShowConvertModal(false);
  setMessageData([]);
  setIsMsgSending(false);
  setOtherBookings([]);
  setIsReassigning(false);
  setExternalCallInfo([]);
  setIsProcessing(false);
  setLoaderMessage("Processing...");
  setPrimaryConsultantId("");
  setCancelComment("");
  setConsultantList([]);
  setFollowerList([]);
  setFollowerConsultants([]);
  setHasFollowers(false);
  setLoadingFollowers(false);
  setHasPermission(true);
};


  const followerData = {
    bookingid: bookingId,
  };

  const loadFollowerList = async () => {
    const response = await fetchFollowerData(followerData);
    if (response.status) {
      setFollowerList(response.data);
      if (response.data.length > 0) {
        setHasFollowers(true);
      } else {
        setHasFollowers(false);
      }
    } else {
      console.warn("Error fetching followers:", response.message);
      setFollowerList([]);
      setHasFollowers(false);
    }
  };
  useEffect(() => {
    loadFollowerList();
    // getFollowerConsultant();
  }, []);

  const getFollowerConsultant = async () => {
    try {
      setLoadingFollowers(true);
      const res = await fetch(
        `${API_URL}/api/helpers/getFollowerConsultant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingid: bookingId, user: user }),
        }
      );

      const result = await res.json();

      if (result.status) {
        console.log("Follower consultant data:", result.data);
        setFollowerConsultants(result.data);
      } else {
        console.log("Failed to fetch follower consultant:", result.message);
        return null;
      }
    } catch (error) {
      console.error("Error fetching follower consultant:", error);
      return null;
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchConsultants = async (subject_area, call_related_to) => {
    try {
      let filteredConsultants = [];
      if (call_related_to === "subject_area_related") {
        const res = await fetch(
          `${API_URL}/api/helpers/getConsultantsBySubjectArea`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ subject_area }),
          }
        );
        const data = await res.json();
        if (res.ok) {
          setConsultantList(data);
        }
      } else if (call_related_to === "price_and_discount_related") {
        const consultantsData = await fetchAllConsultants();
        filteredConsultants = consultantsData.results || [];

        filteredConsultants = filteredConsultants.filter((c) =>
          priceDiscoutUsernames.includes(c.fld_username)
        );

        setConsultantList(filteredConsultants);
      } else {
        const consultantsData = await fetchAllConsultants();

        setConsultantList(consultantsData.results || []);
      }
    } catch (error) {
      console.error("Error fetching consultants:", error);
    }
  };

  const fetchMsgData = async (bookingId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/helpers/getMessageData?bookingId=${bookingId}`
      );
      const data = await response.json();
      if (data.status) {
        setMessageData(data.messages);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const getExternalCallByBookingId = async (bookingId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/bookings/getExternalCallByBookingId?bookingId=${bookingId}`
      );
      const data = await response.json();
      if (data.status) {
        setExternalCallInfo(data.data);
      } else {
        console.error("Error fetching external call info");
      }
    } catch (err) {
      console.error("Error fetching external call info:", err);
    }
  };

  // Get background color based on status
  const getStatusColor = (status) => {
    console.log("Status"+status)
    switch (status) {
      case "Accept":
        return "#c2f5da"; // greenish
      case "Reject":
        return "#f5d0cd"; // reddish
      case "Client did not join":
        return "#cdd2f5"; // bluish
      case "Rescheduled":
        return "#f5f5cd"; // yellowish
      case "Completed":
        return "#d2cdf5"; // purple-ish
      default:
        return "#f8f8f8"; // default light gray
    }
  };

  const handleDeleteCallRequest = async () => {
    if (!window.confirm("Are you sure you want to delete this call request?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/deleteBookingById`,
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
        toast.success("Call request deleted successfully");

        // Delay navigation by 2 seconds (2000 ms)
        setTimeout(() => {
          navigate("/bookings");
        }, 2000);
      } else {
        toast.error("Failed to delete call request");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Server error during deletion");
    }
  };

  const handleSetAsConverted = async (rcCode, projectId) => {
    if (!rcCode || !projectId) {
      toast.error("Please enter RC Code and Project ID");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/setAsConverted`,
        {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            bookingId,
            rcCode,
            projectId,
            user,
          }),
        }
      );

      if (!response.ok) {
        // HTTP error (500, 404 etc.)
        throw new Error("Server error");
      }

      const result = await response.json();

      if (result.status) {
        toast.success("Marked as converted successfully");
        setBookingData((prev) => ({ ...prev, fld_converted_sts: "Yes" }));
        setShowConvertForm(false);
        canSetAsConverted = false;
      } else {
        toast.error(result.message || "Failed to mark as converted");
      }
    } catch (error) {
      console.error("Conversion error:", error);
      // toast.error("Failed to mark as converted");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendMessage = async (message) => {
    if (!message || message.trim() === "") {
      toast.error("Enter a message before sending");
      return;
    }
    try {
      setIsMsgSending(true);
      const response = await fetch(
        `${API_URL}/api/helpers/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender_id: user.id,
            comment: message,
            admin_type: user.fld_admin_type,
            bookingid: bookingId,
            sender_name:user?.fld_name || "Unknown User"
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Message Sent");
        fetchMsgData(bookingId);
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsMsgSending(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusByCrm) {
      toast.error("Please select a status");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${API_URL}/api/bookings/updateStatusByCrm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingid: bookingId,
            statusByCrm: statusByCrm,
            user: user,
          }),
        }
      );

      const data = await response.json();
      if (data.status) {
        toast.success("Status updated successfully");

        setBookingData((prev) => ({
          ...prev,
          statusByCrm: statusByCrm,
        }));
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Status update failed:", error);
      toast.error("Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOtherBookings = async () => {
    // console.log("Booking Data:" + JSON.stringify(bookingData, null, 2));
    try {
      const queryParams = new URLSearchParams({
        consultantId: bookingData.fld_consultantid,
        bookingDate: bookingData.fld_booking_date,
        bookingSlot: bookingData.fld_booking_slot,
      });

      const response = await fetch(
        `${API_URL}/api/bookings/getBookingData?bookingId=${bookingId}`
      );

      const result = await response.json();

      if (result.status) {
        setOtherBookings(result.data);
        console.log("OtherBooking:" + JSON.stringify(otherBookings, null, 2));
      } else {
        console.error("Failed to fetch other bookings");
      }
    } catch (err) {
      console.error("Error fetching other bookings:", err);
    }
  };

  // Handle mark as confirmed
  const handleMarkAsConfirmed = async () => {
    if (
      !window.confirm(
        "Are you sure you want to mark this as confirmed by the client?"
      )
    )
      return;

    setIsProcessing(true);
    setLoaderMessage("Marking as confirming...");

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/markAsConfirmByClient`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        }
      );

      const result = await response.json();

      if (result.status) {
        toast.success("Marked as confirmed by client");

        if (result.reschedulePending) {
          setLoaderMessage("Rescheduling other calls...");

          const res2 = await fetch(
            `${API_URL}/api/bookings/rescheduleOtherBookings`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookingId }),
            }
          );

          const res2Json = await res2.json();
          if (res2Json.status) {
            toast.success("Other bookings rescheduled");
          } else {
            toast.error(
              res2Json.message || "Failed to reschedule other bookings"
            );
          }
        }
      } else {
        toast.error(result.message || "Failed to mark as confirmed");
      }
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error("Something went wrong while marking as confirmed");
    } finally {
      setIsProcessing(false);
      setLoaderMessage("Processing...");
    }
  };

  // Handle delete call request

  // Handle set as converted

  // Handle reassign comment
  const handleReassignComment = async () => {
    if (!reassignComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      setIsReassigning(true); // optional: for disabling button or showing spinner

      const response = await fetch(
        `${API_URL}/api/bookings/reassignComment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingid: bookingId,
            reassign_comment: reassignComment,
            user: user,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.status) {
        toast.success(
          data.message || "Reassign request submitted successfully"
        );
        setShowReassignForm(false);
        setReassignComment("");
        setBookingData((prev) => ({
          ...prev,
          fld_call_request_sts: "Reassign Request",
          fld_reassign_comment: reassignComment,
        }));
      } else {
        toast.error(data.message || "Failed to submit reassign request");
      }
    } catch (error) {
      console.error("Reassign comment error:", error);
    } finally {
      setIsReassigning(false); // optional
    }
  };

  const handleReassignToConsultant = async () => {
    if (!primaryConsultantId) {
      toast.error("Please select a consultant");
      return;
    }

    try {
      setIsProcessing(true);
      setLoaderMessage("Reassigning Consultant...");
      const res = await fetch(
        `${API_URL}/api/bookings/reassignToConsultant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: bookingData.id,
            primary_consultant_id: primaryConsultantId,
            user,
          }),
        }
      );

      const data = await res.json();
      if (data.status) {
        toast.success("Reassigned successfully");
        fetchBookingById(bookingData.id);
      } else {
        toast.error(data.message || "Reassignment failed");
      }
    } catch (err) {
      console.error("Reassignment error:", err);
      toast.error("Error while reassigning");
    } finally {
      setIsProcessing(false);
      setLoaderMessage("Processing...");
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      setIsProcessing(true);
      setLoaderMessage("Cancelling...");
      const res = await fetch(
        `${API_URL}/api/bookings/updateConsultationStatus`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingid: bookingData.id,
            comment: cancelComment,
            consultation_sts: "Cancelled",
            user,
          }),
        }
      );

      const data = await res.json();
      if (data.status) {
        toast.success("Call status updated to Cancelled");
        fetchBookingById(bookingData.id);
      } else {
        toast.error(data.message || "Cancellation failed");
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      toast.error("Error while cancelling");
    } finally {
      setIsProcessing(false);
      setLoaderMessage("Processing...");
    }
  };

  const onUpdateStatus = async (statusData) => {
    if (!statusData.consultationStatus) {
      toast.error("Please select a consultation status.");
      return;
    }

    // 🟡 Validation by status
    if (statusData.consultationStatus === "Rescheduled") {
      if (statusData.statusOptions.length === 0) {
        toast.error("Please select options for Rescheduling.");
        return;
      }
    }

    if (statusData.consultationStatus === "Accept") {
      if (statusData.statusOptions.length !== 2) {
        toast.error("Please select exactly 2 options for Accept.");
        return;
      }
    }

    if (statusData.consultationStatus === "Client did not join") {
      if (!statusData.comment || statusData.comment.trim() === "") {
        toast.error("Enter Comments for 'Client did not join'.");
        return;
      }
    }

    if (statusData.consultationStatus === "Reject") {
      if (statusData.statusOptions.length === 0) {
        toast.error("Please select at least one reason for rejection.");
        return;
      }
    }

    if (statusData.consultationStatus === "Completed") {
      if (!statusData.callSummary || statusData.callSummary.trim() === "") {
        toast.error("Call Summary is required for completion.");
        return;
      }
    }
    try {
      setIsProcessing(true);
      setLoaderMessage("Updating Status...");

      const formData = new FormData();

      // Append text fields
      formData.append("bookingid", statusData.bookingId);
      formData.append("comment", statusData.comment || "");
      formData.append("consultation_sts", statusData.consultationStatus || "");
      formData.append("status_options", statusData.statusOptions || "");
      formData.append(
        "status_options_rescheduled_others",
        statusData.rescheduledOthers || ""
      );
      formData.append("rescheduled_date", statusData.rescheduledDate || "");
      formData.append("rescheduled_time", statusData.rescheduledTime || "");
      formData.append("scalequestion1", statusData.scaleQuestion1 || "");
      formData.append("scalequestion2", statusData.scaleQuestion2 || "");
      formData.append("scalequestion3", statusData.scaleQuestion3 || "");
      formData.append(
        "specific_commnets_for_the_call",
        statusData.callSummary || ""
      );

      formData.append("user", JSON.stringify(user));

      if (statusData.file) {
        formData.append("booking_file", statusData.file);
      }

      const response = await fetch(
        `${API_URL}/api/bookings/updateConsultationStatus`,
        {
          method: "POST",
          body: formData, // browser sets the correct multipart/form-data boundary automatically
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Consultation status updated successfully.");
      } else {
        toast.error(data.error || "Failed to update status.");
      }
    } catch (error) {
      console.error("API Error:", error);
      toast.error("Something went wrong while updating the status.");
    } finally {
      setIsProcessing(false);
      setLoaderMessage("Processing...");
    }
  };

  const onAssignExternal = async (externalData) => {
    const { consultantName, bookingId } = externalData;

    if (!consultantName) {
      toast.error("Consultant Name is Missing");
      return;
    }

    if (!bookingId) {
      toast.error("Booking Id is Missing");
      return;
    }

    try {
      setIsProcessing(true);
      setLoaderMessage("Assigning External Call...");

      const response = await fetch(
        `${API_URL}/api/bookings/assignExternalCall`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ consultantName, bookingId }),
        }
      );

      const result = await response.json();

      if (result.status) {
        toast.success("External Call Assigned Successfully");
        fetchBookingById(bookingId); // refresh booking info
      } else {
        toast.error(result.message || "Assignment failed");
      }
    } catch (error) {
      console.error("Error during external assignment:", error);
      toast.error("Something went wrong while assigning external call");
    } finally {
      setIsProcessing(false);
      setLoaderMessage("Processing...");
    }
  };

  const onReassignCall = async (reassignData) => {
    if (!reassignData.consultantId) {
      toast.error("Please select a consultant");
      return;
    }

    try {
      setIsProcessing(true);
      setLoaderMessage("Reassigning call...");

      const response = await fetch(
        `${API_URL}/api/bookings/updateReassignCallStatus`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingid: reassignData.bookingId,
            consultant_id: reassignData.consultantId,
            bookingdate: reassignData.bookingDate,
            bookingslot: reassignData.bookingSlot,
            user: user,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.status) {
        toast.success("Call reassigned successfully");
        fetchBookingById(reassignData.bookingId); // refresh booking info using the correct ID
      } else {
        const errMsg = result.message || "Call reassignment failed";
        toast.error(errMsg);
      }
    } catch (error) {
      console.error("Reassignment error:", error);
      toast.error("An error occurred while reassigning the call");
    } finally {
      setIsProcessing(false);
      setLoaderMessage("Processing...");
    }
  };

  const onUpdateExternal = async (payload) => {
    payload.user = user;
    // Validate Booking ID
    if (!payload.bookingid) {
      toast.error("Invalid Booking ID");
      return;
    }

    // Validate Consultant Name
    if (!payload.consultant_name || payload.consultant_name.trim() === "") {
      toast.error("Enter Consultant Name!");
      return;
    }

    // Validate Consultation Status
    if (!payload.consultation_sts || payload.consultation_sts.trim() === "") {
      toast.error("Select Status!");
      return;
    }

    // Validate Comment
    if (!payload.externalCallComnt || payload.externalCallComnt.trim() === "") {
      toast.error("Enter Comments!");
      return;
    }

    try {
      setIsProcessing(true);
      setLoaderMessage("Updating External Call...");

      const response = await fetch(
        `${API_URL}/api/bookings/updateExternalConsultationStatus`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("Response:", result);

      if (result.status) {
        toast.success("Call Status Updated successfully!");
        fetchBookingById(bookingId);
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Network error");
    } finally {
      setIsProcessing(false);
      setLoaderMessage("Processing...");
    }
  };

  const onSubmitCompletedComment = async (payload) => {
    if (!user) {
      toast.error("User not logged in");
      return;
    }

    payload.user = user;

    if (!payload.bookingid) {
      toast.error("Invalid Booking ID");
      return;
    }

    if (!payload.call_complete_rating) {
      toast.error("Please provide a rating");
      return;
    }

    if (
      !payload.call_complete_recording ||
      payload.call_complete_recording.trim() === ""
    ) {
      toast.error("Please provide a recording URL");
      return;
    }

    if (
      !payload.call_complete_comment ||
      payload.call_complete_comment.trim() === ""
    ) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      setIsProcessing(true);
      setLoaderMessage("Submitting...");

      const response = await fetch(
        `${API_URL}/api/bookings/submitCallCompletionComment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("Response:", result);

      if (result.status) {
        toast.success("Call Comment Submitted successfully!");
        fetchBookingById(payload.bookingid); // Use payload.bookingid instead of bookingId
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Network error");
    } finally {
      setIsProcessing(false);
      setLoaderMessage("Processing...");
    }
  };

  const onAddFollower = async (payload) => {
    if (!user) {
      toast.error("User not logged in");
      return;
    }

    payload.user = user;

    if (!payload.bookingid) {
      toast.error("Invalid Booking ID");
      return;
    }

    if (!payload.followerConsultantId) {
      toast.error("Please Select Any Follower");
      return;
    }

    try {
      setIsProcessing(true);
      setLoaderMessage("Adding Follower...");

      const response = await fetch(
        `${API_URL}/api/helpers/addFollower`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("Response:", result);

      if (result.status) {
        toast.success("Follower Added successfully!");
        fetchBookingById(payload.bookingid);
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Error in adding Follower:", err);
      toast.error("Network error");
    } finally {
      setIsProcessing(false);
      setLoaderMessage("Processing...");
    }
  };
  const onUpdateExternalBooking = async (payload) => {
    if (!user) {
      toast.error("User not logged in");
      return;
    }

    payload.user = user; // Add user to the payload

    if (!payload.bookingid) {
      toast.error("Invalid Booking ID");
      return;
    }

    if (!payload.call_joining_link) {
      toast.error("Please enter Call Joining Link");
      return;
    }

    if (!payload.external_booking_date) {
      toast.error("Please select Booking Date");
      return;
    }

    if (!payload.external_booking_time) {
      toast.error("Please select Booking Time");
      return;
    }

    // ✅ Confirm only after validation
    const isConfirmed = window.confirm(
      "Are you sure you want to update booking information?"
    );
    if (!isConfirmed) return;

    try {
      setIsProcessing(true);
      setLoaderMessage("Updating External Call...");

      const response = await fetch(
        `${API_URL}/api/helpers/updateExternalBookingInfo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("Response:", result);

      if (result.status) {
        toast.success("Booking Info Updated Successfully!");
        fetchBookingById(payload.bookingid); // refresh data
      } else {
        toast.error(result.msg || "Something went wrong");
      }
    } catch (err) {
      console.error("Error while updating booking:", err);
      toast.error("Network error");
    } finally {
      setIsProcessing(false);
      setLoaderMessage("Processing...");
    }
  };

  const scrollToChat = () => {
    const chatBox = document.querySelector(".chatbox");
    if (chatBox) {
      chatBox.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Count questions
  const questionCount = bookingData.fld_question_data
    ? bookingData.fld_question_data.split("~~").filter((q) => q.trim()).length
    : 0;

  // Check conditions for various buttons
  const canDelete =
    bookingData.fld_consultation_sts !== "Completed" &&
    bookingData.fld_consultantid > 1 &&
    bookingData.fld_call_related_to !== "I_am_not_sure";

  const hasOtherConfirmedBooking = (otherBookings || []).some(
    (row) =>
      row.id !== bookingData.id &&
      row.fld_call_confirmation_status === "Call Confirmed by Client" &&
      row.fld_consultation_sts === "Accept"
  );
console.log("booking", bookingData)
  const canMarkAsConfirmed =
    user.fld_admin_type === "SUPERADMIN" &&
    bookingData.fld_call_confirmation_status != "Call Confirmed by Client" &&
    (((bookingData.fld_call_confirmation_status === "Call Confirmation Pending at Client End" || bookingData.fld_call_confirmation_status === "") &&
      (bookingData.fld_call_request_sts !== "Rescheduled" ||  bookingData.fld_call_request_sts === "Call Rescheduled" || bookingData.fld_call_request_sts === "Accept") &&
      !hasOtherConfirmedBooking &&
      bookingData.fld_call_related_to !== "I_am_not_sure") ||
      (bookingData.fld_booking_date &&
        bookingData.fld_booking_slot &&
        bookingData.fld_call_related_to === "I_am_not_sure" &&
        bookingData.fld_call_external_assign === "Yes" &&
        bookingData.fld_call_request_sts === "Accept"));

  const canUpdateStatus =
    (user.fld_admin_type === "SUBADMIN" ||
      user.fld_admin_type === "EXECUTIVE") &&
    !bookingData.statusByCrm &&
    bookingData.fld_call_request_sts === "Accept";

  var canSetAsConverted =
    user.fld_admin_type === "EXECUTIVE" &&
    bookingData.fld_call_request_sts === "Completed" &&
    bookingData.fld_converted_sts === "No" &&
    bookingData.fld_sale_type === "Presales";
    var canSetAsConverted =false;

  const canShowReasignConsultant =
    user.fld_admin_type === "EXECUTIVE" &&
    bookingData.fld_call_related_to !== "I_am_not_sure" &&
    bookingData.fld_call_request_sts !== "Completed";
  // const canShowReasignConsultant=true;

  const canCancelCall =
    user.fld_admin_type === "EXECUTIVE" &&
    bookingData.fld_call_related_to !== "I_am_not_sure" &&
    bookingData.fld_call_request_sts !== "Cancelled" &&
    bookingData.fld_call_request_sts !== "Completed";
  if (!hasPermission) {
    return (
      <div className="p-4 text-center text-red-600 font-semibold">
        You don't have permission to view this booking.Redirecting...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <SocketHandler
        otherSetters={[
          { setFn: setConsultantList, isBookingList: true },
          { setFn: setFollowerConsultants, isBookingList: false },
        ]}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-[16px] font-semibold text-gray-900">
            View Booking Information
          </h4>

          <div className="flex items-center gap-3">
            {/* Delete Button */}
            {/* {canDelete && (
                  <button
                    onClick={handleDeleteCallRequest}
                    className="bg-red-500 hover:bg-red-600 text-[11px] text-white px-2 py-1  rounded-md flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Trash2 size={10} />
                    <span>Delete Call Request</span>
                  </button>
                )} */}

            {/* Set as Converted */}
            {canSetAsConverted && (
              <>
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="bg-green-600 hover:bg-green-600 text-white px-4 rounded-sm the_act cursor-pointer"
                >
                  Set as Converted
                </button>
                <SetAsConvertedModal
                  isOpen={showConvertModal}
                  onClose={() => setShowConvertModal(false)}
                  onConvert={handleSetAsConverted}
                  isSubmitting={isSubmitting}
                />
              </>
            )}

            <ViewCommentModal user={user} bookingData={bookingData} />

            {/* View Chat */}
            {/* <button
                  onClick={scrollToChat}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 rounded-md flex items-center space-x-2 transition-colors"
                >
                  <ArrowDown size={16} />
                  <span>View Chat</span>
                </button> */}

            {/* Back Button */}
            {/* Mark as Confirmed Button */}
            {canMarkAsConfirmed && (
              <div className="flex justify-end">
                <button
                  onClick={handleMarkAsConfirmed}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 rounded-md transition-colors cursor-pointer"
                >
                  Mark as Confirmed by Client
                </button>
              </div>
            )}

            {/* Loading Overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <svg
                      className="animate-spin h-6 w-6 text-blue-600"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span className="text-gray-700 font-medium">
                      {loaderMessage}
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reassign Comment Form */}
            {user.fld_admin_type === "EXECUTIVE" &&
              bookingData.fld_call_request_sts === "Consultant Assigned" &&
              bookingData.fld_consultant_approve_sts === "Yes" && (
                <>
                  {/* <div className=" flex justify-end">
                    <button
                      onClick={() => setShowReassignForm(true)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 rounded-md transition-colors cursor-pointer"
                    >
                      Request for reassign
                    </button>
                  </div> */}

                  <ReassignModal
                    show={showReassignForm}
                    onClose={() => setShowReassignForm(false)}
                    comment={reassignComment}
                    setComment={setReassignComment}
                    onSubmit={handleReassignComment}
                    isReassigning={isReassigning}
                  />
                </>
              )}
            <button
              onClick={() => navigate(-1)}
              className="bg-none hover:bg-gray-300  text-black text-[11px] px-2 py-1 cursor-pointer  rounded-sm flex items-center space-x-2 transition-colors hover:text-gray-700"
            >
              <ArrowLeft className="mr-1" size={12} />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Status Update Section */}
        {canUpdateStatus && (
          <div className="mb-6 bg-white p-2 rounded">
            <div className="flex items-end justify-end space-x-4">
              <select
                value={statusByCrm}
                onChange={(e) => setStatusByCrm(e.target.value)}
                className="border px-1 py-1 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600 min-w-48"
              >
                <option value="">Update Call Status</option>
                <option value="Completed">✔️ Completed</option>
                <option value="Not Join">❌ Client Did Not Join</option>
                <option value="Postponed">⏳ Postponed</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                className={`${
                  isSubmitting
                    ? "bg-blue-300 hover:bg-blue-400"
                    : "bg-[#ff6800] hover:bg-orange-600"
                } text-white px-2 py-1 rounded transition-colors flex items-center cursor-pointer text-[12px]`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting.." : "Submit"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="pt-1 ml-1"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-chevrons-right-icon lucide-chevrons-right"
                >
                  <path d="m6 17 5-5-5-5"></path>
                  <path d="m13 17 5-5-5-5"></path>
                </svg>
              </button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <div className="flex flex-col gap-4">
              <ConsultantInformation
                bookingData={bookingData}
                user={user}
                bgColor={getStatusColor(bookingData?.fld_call_request_sts)}
              />

              <UserInformation
                data={bookingData}
                user={user}
                bgColor={getStatusColor(bookingData?.fld_call_request_sts)}
                externalCallInfo={externalCallInfo}
              />
              
             <ChatBox
              user={user}
              messageData={messageData}
              onSend={(message) => sendMessage(message)}
              isMsgSending={isMsgSending}
            />
            </div>
          </div>
          <div className="space-y-3">
            <CallUpdateActions
                bookingData={bookingData}
                user={user}
                consultantList={consultantList}
                onUpdateStatus={onUpdateStatus}
                onAssignExternal={onAssignExternal}
                onReassignCall={onReassignCall}
              />
              <CallUpdateOtherActions
                bookingData={bookingData}
                user={user}
                consultantList={consultantList}
                externalCallInfo={externalCallInfo}
                onUpdateExternal={onUpdateExternal}
                onSubmitCompletedComment={onSubmitCompletedComment}
                onAddFollower={onAddFollower}
                onUpdateExternalBooking={onUpdateExternalBooking}
                followerConsultants={followerConsultants}
                hasFollowers={hasFollowers}
                getFollowerConsultant={getFollowerConsultant}
                loadingFollowers={loadingFollowers}
              />
               
                {/* Reassign to Consultant Form */}
                {canShowReasignConsultant && (
                  <div className=" flex-wrap gap-4 bg-white border border-gray-200 rounded p-4 m-1">
                    <div className="w-full ">
                      <h2 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-3 mb-3">
                        <Handshake size={16} className="mr-2" />
                        Reassign
                      </h2>
                      <label className="block mb-2 font-medium">
                        Reassign to another Consultant
                      </label>
                      <Select
                        name="consultant_id"
                        className="react-select-container"
                        classNamePrefix="react-select"
                        options={consultantList
                          .filter(
                            (consultant) =>
                              consultant.id !== bookingData.fld_consultantid
                          )
                          .map((consultant) => ({
                            value: consultant.id,
                            label: consultant.fld_name,
                          }))}
                        value={
                          consultantList
                            .filter(
                              (consultant) =>
                                consultant.id !== bookingData.fld_consultantid
                            )
                            .map((consultant) => ({
                              value: consultant.id,
                              label: consultant.fld_name,
                            }))
                            .find(
                              (option) => option.value === primaryConsultantId
                            ) || null
                        }
                        onChange={(selectedOption) =>
                          setPrimaryConsultantId(
                            selectedOption ? selectedOption.value : ""
                          )
                        }
                        placeholder="Select Primary Consultant"
                        isClearable
                      />
                    </div>

                    <div className="w-full  self-end mt-3 justify-end flex">
                      <button
                        type="button"
                        onClick={handleReassignToConsultant}
                        className="bg-[#ff6800]  text-white px-2 py-1 rounded hover:bg-orange-600"
                      >
                        {" "}
                        Update Consultant{" "}
                        <i
                          className="fa fa-arrow-right ml-1"
                          aria-hidden="true"
                        ></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancel Booking Form */}
                {canCancelCall && (
                  <>
                    <div className=" flex-wrap gap-4  bg-white border border-gray-200 rounded p-4 m-1 ">
                      <h2 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-3 mb-3">
                        <PhoneMissed size={16} className="mr-2" />
                        Call Cancelled
                      </h2>
                      <div className="w-full ">
                        <label className="block mb-2">
                          Comments <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded px-4 py-2"
                          value={cancelComment}
                          onChange={(e) => setCancelComment(e.target.value)}
                          placeholder="Add Comments"
                        />
                      </div>

                      <div className="w-full  self-end mt-1 justify-end flex">
                        <button
                          type="button"
                          onClick={handleCancelBooking}
                          className="bg-[#ff6800] text-white px-2 py-1 rounded hover:bg-orange-600"
                        >
                          {" "}
                          Update{" "}
                          <i
                            className="fa fa-arrow-right ml-1"
                            aria-hidden="true"
                          ></i>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              
            <OtherCalls
              bookingId={bookingId}
              clientId={bookingData.fld_client_id}
              fetchBookingById={fetchBookingById}
            />
            <OverallHistory bookingData={bookingData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
