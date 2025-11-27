import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { XIcon } from "lucide-react";
import Select from "react-select";
import toast from "react-hot-toast";
import {
  fetchAllConsultants,
  fetchAllSubjectAreas,
  fetchPlanDetails,
} from "../../helpers/CommonApi";
import { useAuth } from "../../utils/idb";
import { callRegardingOptions, toastWarning } from "../../helpers/CommonHelper";
import { useNavigate } from "react-router-dom";
import SocketHandler from "../../hooks/SocketHandler";
import API_URL from "../../utils/constants";

export default function AddBooking({
  user,
  fetchAllBookings,
  setShowForm,
  bookingId,
}) {
  const { user: loggedInUser, priceDiscoutUsernames } = useAuth();
  const navigate = useNavigate();

  let decodedBookingId;
  if (bookingId) {
    decodedBookingId = atob(bookingId);
  }

  const [formData, setFormData] = useState({
    user: loggedInUser,
    sale_type: "",
    client_id: "",
    crm_id: loggedInUser.id || "",
    projectid: "",
    project_milestone: "",
    project_milestone_name: "",
    call_related_to: "",
    subject_area: "",
    no_of_consultant: "1",
    consultant_id: "",
    consultant_another_option: "",
    secondary_consultant_id: "",
    name: "",
    email: "",
    phone: "",
    company_name: "",
    insta_website: "",
    topic_of_research: "",
    call_regarding: "",
    asana_link: "",
    internal_comments: "",
    set_int_comments: false,

    booking_date: "",
    que_counter: "",
    question_data: "",
    force_presales_add: "",
    completedCalls: "",
    allowedCalls: "",
    requestMessage: "",
    client_plan_id: "",
    client_plan_name: "",
    rc_call_request_id: "",
    call_request_id: "",
    add_call_by:
      loggedInUser && loggedInUser.adm_admin_type == "SUPERADMIN"
        ? "ADMIN"
        : "SELF",
  });
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);

  const [consultants, setConsultants] = useState([]);

  const [subjectAreas, setSubjectAreas] = useState([]);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [showReassignOptions, setShowReassignOptions] = useState(false);
  const [selectedConsultantName, setSelectedConsultantName] = useState("");
  const [planDetails, setPlanDetails] = useState([]);
  const [showRequestField, setShowRequestField] = useState(false);
  const [submitButtonText, setSubmitButtonText] = useState("Submit Booking");

  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    const consultantsData = await fetchAllConsultants();
    const subjectAreasData = await fetchAllSubjectAreas();
    const planDetails = await fetchPlanDetails();
    setConsultants(consultantsData.results || []);
    setSubjectAreas(subjectAreasData.data || []);
    setPlanDetails(planDetails.results || []);
  };

  const [pageLoading, setPageLoading] = useState(false);

  const [rcCallData, setRcCallData] = useState(null);
  useEffect(() => {
    if (decodedBookingId) {
      const fetchCallRequestData = async () => {
        try {
          setPageLoading(true);
          const response = await fetch(
            `${API_URL}/api/additional/callrequestrc`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: decodedBookingId }),
            }
          );
          const result = await response.json();
          if (result.status) {
            // TODO: handle result.data, e.g., populate formData or other state
            console.log("Call Request Data:", result.data);
            setRcCallData(result.data);
            setFormData((prev) => ({
              ...prev,
              rc_call_request_id: decodedBookingId,
              sale_type: "Postsales",
              client_id: result.data?.student_code || "",
              projectid: result.data?.project_id || "",
              project_milestone: result.data?.milestone_id || "",
              project_milestone_name: result.data?.milestone_title || "",
              call_regarding: result.data?.call_regarding || "",
            }));

            const consultantsData = await fetchAllConsultants();
            let filteredConsultants = consultantsData.results || [];

            // Set consultants to dropdown
            setConsultants(filteredConsultants);
          } else {
            toast.error(result.message || "No Calls Found");
          }
        } catch (error) {
          console.error("Error fetching call request data:", error);
          toast.error("Something went wrong while fetching call request data.");
        } finally {
          setPageLoading(false);
          navigate("/bookings");
        }
      };

      fetchCallRequestData();
    }
  }, [decodedBookingId]);
  useEffect(() => {
    console.log(consultants);
  }, []);
  useEffect(() => {
    const fetchWriterEmails = async () => {
      if (rcCallData?.project_id && rcCallData?.milestone_id) {
        try {
          setPageLoading(true);
          const response = await fetch(
            "https://rapidcollaborate.com/rc-main/cron/index/getwritersemail",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                project_id: rcCallData.project_id,
                milestone_id: rcCallData.milestone_id,
              }),
            }
          );

          const result = await response.json();
          console.log("Writer Email Data:", result);
          if (result.status && result.data) {
            const { main_writer_email, sub_writer_email } = result.data;

            const mainWriter = consultants.find(
              (c) =>
                c.fld_email?.toLowerCase() == main_writer_email?.toLowerCase()
            );

            console.log("main writer", mainWriter);

            const subWriter = sub_writer_email
              ? consultants.find(
                  (c) =>
                    c.fld_email?.toLowerCase() ==
                    sub_writer_email?.toLowerCase()
                )
              : null;
            console.log("sub writer", subWriter);

            setFormData((prev) => ({
              ...prev,
              consultant_id: mainWriter?.id || "",
              secondary_consultant_id: subWriter?.id || "",
            }));
          }
        } catch (e) {
          console.error("Error fetching writer emails:", e);
        } finally {
          setPageLoading(false);
        }
      }
    };

    fetchWriterEmails(); // Call the async function
  }, [rcCallData, consultants]);

  useEffect(() => {
    console.log(consultants);
  }, [consultants]);

  useEffect(() => {
    const fetchClientDetails = async () => {
      const clientId = formData.client_id;

      if (formData.sale_type === "Presales" && clientId.length > 3) {
        try {
          const res = await fetch(
            `${API_URL}/api/bookings/getPresaleClientDetails/${clientId}`
          );
          const data = await res.json();

          if (data.status && data.data) {
            const clientData = {
              name: data.data.name || "",
              email: data.data.email || "",
              phone: data.data.phone || "",
              insta_website: data.data.insta_website || "",
              company_name: data.data.assigned_company || "",
            };

            // Update formData
            setFormData((prev) => ({
              ...prev,
              ...clientData,
            }));

            const recordingRes = await fetch(
              `${API_URL}/api/bookings/checkCallrecording`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: clientData.email,
                  ref_id: clientId,
                }),
              }
            );

            const recordingData = await recordingRes.json();

            if (recordingData.status === false) {
              toast.error(
                "Previous call recording not uploaded for this client!"
              );
              setSubmitDisabled(true);
            } else {
              setSubmitDisabled(false);
            }
          } else {
            console.warn("Client not found or invalid response (Presales)");
            setFormData((prev) => ({
              ...prev,
              name: "",
              email: "",
              phone: "",
            }));
          }
        } catch (err) {
          console.error("Presales error", err);
        }
      }

      // Postsales
      if (formData.sale_type === "Postsales" && clientId.length > 3) {
        try {
          const res = await fetch(
            `https://rapidcollaborate.com/rc-main/cron/index/getpostsaleclientdetails?client_id=${clientId}`
          );
          const data = await res.json();

          if (data.status && data.data) {
            const plan = planDetails.find(
              (p) => String(p.id) === String(data.data.plan_type)
            );
            console.log("Plan Details:", planDetails);

            const clientData = {
              name: data.data.name || "",
              email: data.data.email || "",
              phone: data.data.phone || "",
              client_plan_id: data.data.plan_type || "",
              client_plan_name: plan
                ? plan.plan
                : data.data.plan_type == "1"
                ? "Basic"
                : data.data.plan_type == "2"
                ? "Standard"
                : "Advanced",
              allowedCalls: plan
                ? plan.allowedCalls
                : data.data.plan_type == "1"
                ? "1"
                : data.data.plan_type == "2"
                ? "2"
                : "3",
            };
            setFormData((prev) => ({
              ...prev,
              ...clientData,
            }));

            setProjects(data.data.projects || []);

            const recordingRes = await fetch(
              `${API_URL}/api/bookings/checkCallrecording`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: clientData.email,
                  ref_id: clientId,
                }),
              }
            );

            const recordingData = await recordingRes.json();

            if (recordingData.status === false) {
              toast.error(
                "Previous call recording not uploaded for this client!"
              );
              setSubmitDisabled(true);
            } else {
              setSubmitDisabled(false);
            }
          } else {
            console.warn("Client not found or invalid response (Postsales)");
            setFormData((prev) => ({
              ...prev,
              name: "",
              email: "",
              phone: "",
            }));
            setProjects([]);
          }
        } catch (err) {
          console.error("Postsales error", err);
        }
      }
    };

    fetchClientDetails();
  }, [formData.client_id, formData.sale_type]);

  const checkConsultantConditions = (consultantId, consultantName) => {
    checkConsultantWebsiteCondition(consultantId, consultantName);
    checkConsultantTeamCondition(consultantId, consultantName);

    //checkPresalesCall(consultantId, consultantName);
  };

  const checkConsultantWebsiteCondition = (consultantId, consultantName) => {
    try {
      fetch(
        `${API_URL}/api/bookings/checkConsultantWebsiteCondition`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            consultantid: consultantId,
            email: formData.email,
            insta_website: formData.insta_website,
          }),
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            if (data.webStatus == "DIFFERENT") {
              setSubmitDisabled(true);
              toast.error(
                `Call already completed with ${consultantName} on ${data.bookingTime}`
              );
            } else {
              setSubmitDisabled(false);
            }
          } else {
            //toast.info("No previous call found.");
            console.log("No previous call found.");
          }
        })
        .catch((err) => {
          console.error("Error checking consultant website:", err);
          //  toast.error("Server error while checking consultant condition.");
        });
    } catch (err) {
      console.error("Unexpected error:", err);
      //toast.error("Unexpected error occurred.");
    }
  };

  const checkConsultantTeamCondition = (consultantId, consultantName) => {
    try {
      fetch(`${API_URL}/api/bookings/checkConsultantTeamCondition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          primaryconsultantid: consultantId,
          clientemail: formData.email,
          saletype: formData.sale_type,
          login_crm_id: loggedInUser.id, // send login CRM ID
        }),
      })
        .then((res) => res.text())
        .then((result) => {
          if (result === "call not completed") {
            setSubmitDisabled(false);
            // toast.info("No previous completed call.");
            console.log("No previous completed call.");
          } else if (result === "add call") {
            setSubmitDisabled(false);
            // toast.success("You can proceed with the call.");
          } else {
            const [displayMsg, displayConId, displayPrimaryConId] =
              result.split("||");

            if (displayPrimaryConId === displayConId) {
              setSubmitDisabled(true);
            } else {
              setSubmitDisabled(false);
            }

            if (displayMsg) {
              toast.error("You cannot add the call. " + displayMsg);
            }
          }
        })
        .catch((err) => {
          console.error("Error:", err);
          //toast.error("Something went wrong. Try again.");
        });
    } catch (err) {
      console.error("Unexpected error:", err);
      //toast.error("Unexpected error occurred.");
    }
  };

  const checkPresalesCall = (consultantId, consultantName) => {
    fetch(`${API_URL}/api/bookings/checkPresalesCall`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientemail: formData.email, // match backend
        saletype: formData.sale_type,
        primaryconsultantid: consultantId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          toast.error(
            `Previous call is still pending with ${consultantName} on ${data.booking_time}`,
            { autoClose: 5000 }
          );
          setSubmitDisabled(true);
        } else {
          setSubmitDisabled(false);
        }
      })
      .catch((err) => {
        console.error("Error checking presales call:", err);
        //  toast.error("Unexpected error occurred.");
      });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCallRelatedToChange = async (selectedOptionValue) => {
    const related_to = selectedOptionValue || "";

    // Reset fields
    setFormData((prev) => ({
      ...prev,
      call_related_to: related_to,
      subject_area: "",
      consultant_id: "",
    }));

    // If related_to is "subject_area_related", don't fetch consultants
    if (related_to === "subject_area_related") {
      setConsultants([]);
      return;
    }

    // Fetch consultants for other options
    const consultantsData = await fetchAllConsultants();
    let filteredConsultants = consultantsData.results || [];

    // If it's for price and discount, filter by allowed usernames
    if (related_to === "price_and_discount_related") {
      filteredConsultants = filteredConsultants.filter((c) =>
        priceDiscoutUsernames.includes(c.fld_username)
      );
    }

    // Set consultants to dropdown
    setConsultants(filteredConsultants);
  };

  const handleSubjectAreaChange = async (selectedOption) => {
    const subject_area = selectedOption?.value || "";

    setFormData((prev) => ({
      ...prev,
      subject_area,
      consultant_id: "",
    }));

    if (!subject_area) {
      setConsultants([]);
      return;
    }

    try {
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
        setConsultants(data);
      } else {
        console.error("Error fetching consultants:", data.message);
        setConsultants([]);
      }
    } catch (err) {
      console.error("Network error:", err);
      setConsultants([]);
    }
  };

  const checkPostsaleCompletedCalls = async (email, milestone_id) => {
    // const allowedCalls=formData.allowedCalls;
    try {
      const response = await fetch(
        `${API_URL}/api/bookings/checkPostsaleCompletedCalls`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            milestone_id: milestone_id,
          }),
        }
      );

      const data = await response.json();

      if (data.status && data.result) {
        const completedCalls = parseInt(data.result.totalrow); // API returns count

        setFormData((prev) => ({
          ...prev,
          completedCalls: completedCalls,
        }));
        if (
          formData.allowedCalls !== "Unlimited" &&
          completedCalls >= formData.allowedCalls
        ) {
          setShowRequestField(true);
          setSubmitButtonText("Request to add call");
          toastWarning(
            `You have alraedy completed ${completedCalls} calls for this Milestone.You need to request to add more call`
          );
        } else {
          setShowRequestField(false);
          setSubmitButtonText("Submit Booking");
        }
      }
    } catch (error) {
      console.error("Error checking completed calls:", error);
    }
  };

  const handleSaleTypeChange = async (saleType) => {
    if (saleType === "Postsales") {
      await handlePostsalesChanges();
    } else {
      setConsultants([]);
      await handlePresalesChanges();
    }
  };

  const handlePostsalesChanges = async () => {
    const consultantsData = await fetchAllConsultants();
    const filteredConsultants =
      consultantsData.results || consultantsData.data || [];
    setConsultants(filteredConsultants);

    setFormData((prev) => ({
      ...prev,
      client_id: "",
      // projectid: "",
      project_milestone: "",
      call_related_to: "",
      subject_area: "",
      no_of_consultant: "1",
      consultant_id: "",
      consultant_another_option: "",
      secondary_consultant_id: "",
      name: "",
      email: "",
      phone: "",
    }));
  };

  const handlePresalesChanges = async () => {
    setFormData((prev) => ({
      ...prev,
      client_id: "",
      projectid: "",
      project_milestone: "",
      call_related_to: "",
      subject_area: "",
      no_of_consultant: "1",
      consultant_id: "",
      consultant_another_option: "",
      secondary_consultant_id: "",
      name: "",
      email: "",
      phone: "",
    }));
  };

  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sale_type) {
      toast.error("Please select a sale type");
      return;
    }
    if (!formData.client_id) {
      toast.error("Please select a client");
      return;
    }
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill client name, email and phone");
      return;
    }
    if (!formData.topic_of_research) {
      toast.error("Please select a topic of research");
      return;
    }
    if (!formData.call_regarding) {
      toast.error("Please select a call regarding");
      return;
    }
    if (!formData.asana_link) {
      toast.error("Please provide Asana URL / Quote ID");
      return;
    }
    if (formData.set_int_comments && !formData.internal_comments) {
      toast.error("Please fill internal comments");
      return;
    }

    if (formData.sale_type == "Presales") {
      if (!formData.call_related_to) {
        toast.error("Please select a call related to");
        return;
      } else if (
        !formData.consultant_id &&
        formData.call_related_to != "I_am_not_sure"
      ) {
        toast.error("Please select a Consultant");
        return;
      } else if (showReassignOptions && !formData.consultant_another_option && formData.call_related_to !="price_and_discount_related") {
        toast.error("Please select a Consultant SubOption");
        return;
      }
    }

    if (formData.sale_type == "Postsales") {
      if (
        !formData.consultant_id &&
        formData.call_related_to != "I_am_not_sure"
      ) {
        toast.error("Please select a Consultant");
        return;
      }  else if (!formData.projectid) {
        toast.error("Please select a Project ");
        return;
      } else if (!formData.project_milestone) {
        toast.error("Please select a Project Milestone");
        return;
      }
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/addBooking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();
      if (
        result.status &&
        result.message === "Call Request Added Successfully"
      ) {
        toast.success(result.message);
        fetchAllBookings();
        setShowForm(false);
      } else if (
        result.status &&
        result.message === "Add Call Request Already Sent!"
      ) {
        toast.error(result.message);
        // fetchAllBookings();
        // setShowForm(false);
      } else if (
        !result.status &&
        result.message === "Booking already exists"
      ) {
        toast.error(result.message);
        // fetchAllBookings();
        // setShowForm(false);
      } else {
        toast.error("Something went wrong.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const consultantOptions = consultants.map((con) => ({
    value: con.id,
    label: con.fld_name,
  }));

  useEffect(() => {
    console.log("Form data updated:", formData);
  }, [formData]);

  useEffect(() => {
    const fetchMileStones = async () => {
      if (!formData.projectid) {
        return;
      }
      try {
        const res = await fetch(
          `https://rapidcollaborate.com/rc-main/cron/index/getprojectmilestones?project_id=${formData.projectid}`
        );
        const data = await res.json();

        if (data.status && Array.isArray(data.data)) {
          setMilestones(data.data);
        } else {
          setMilestones([]);
        }
      } catch (error) {
        console.error("Error fetching milestones", error);
        setMilestones([]);
      }
    };
    fetchMileStones();
  }, [formData.projectid]);

  return (
    <motion.div className="fixed inset-0 bg-[#000000c2] flex items-center justify-center z-50">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 w-[25%] h-full bg-white shadow z-50 overflow-y-auto"
      >
        {/* Header */}
        <SocketHandler
          otherSetters={[
            {
              setFn: setConsultants,
              isBookingList: true,
              subjectArea: formData.subject_area,
              callRelatedTo: formData.call_related_to,
            },
          ]}
        />

        <div className="flex justify-between items-center px-4 py-3 border-b bg-[#224d68] text-white">
          <h2 className="text-[15px] font-semibold">Add Booking</h2>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-100 hover:text-red-500 text-2xl cursor-pointer"
          >
            <XIcon size={17} />
          </button>
        </div>

        <div className="relative w-full overflow-x-hidden">
          {pageLoading && (
            <div className=" bg-[#000000bd] flex items-center justify-center w-full">
              <div className="text-white text-xl">Loading...</div>
            </div>
          )}
          {/* Form */}
          <div className={`p-4 space-y-4  ${pageLoading ? "disabled" : ""}`}>
            <div>
              <label className="block mb-1">Select Call Type</label>
              <select
                name="sale_type"
                value={formData.sale_type}
                onChange={(e) => {
                  handleChange(e);
                  handleSaleTypeChange(e.target.value);
                }}
                className="w-full border px-3 py-2 rounded text-gray-500 border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                required
              >
                <option value="">Select Call Type</option>
                <option value="Presales">Presales</option>
                <option value="Postsales">Postsales</option>
              </select>
            </div>

            {(formData.sale_type === "Presales" ||
              formData.sale_type === "Postsales") && (
              <div>
                <label className="block mb-1">
                  {formData.sale_type === "Presales"
                    ? "Insta CRM RefId"
                    : "RC Student Code"}
                </label>
                <input
                  type="text"
                  name="client_id"
                  value={formData.client_id}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      client_id: value,
                      client_plan_id: "",
                      client_plan_name: "",
                      // projectid: "",
                      project_milestone: "",
                      project_milestone_name: "",
                      allowedCalls: "",
                      completedCalls: "",
                      insta_website: "",
                      company_name: "",
                    }));
                    setProjects([]);
                  }}
                  className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                  required
                />
              </div>
            )}

            {formData.sale_type === "Presales" && (
              <>
                <input
                  type="hidden"
                  name="insta_website"
                  value={formData.insta_website || ""}
                />
                <input
                  type="hidden"
                  name="company_name"
                  value={formData.company_name || ""}
                />
              </>
            )}

            {formData.sale_type === "Postsales" && (
              <>
                <input
                  type="hidden"
                  name="completedCalls"
                  value={formData.completedCalls || ""}
                />
                <input
                  type="hidden"
                  name="client_plan_id"
                  value={formData.client_plan_id || ""}
                />
                <input
                  type="hidden"
                  name="allowedCalls"
                  value={formData.allowedCalls || ""}
                />
              </>
            )}

            {formData.sale_type === "Postsales" &&
              formData.client_id &&
              projects.length > 0 && (
                <div>
                  <label className="block mb-1">Project</label>
                  <select
                    value={formData.projectid}
                    onChange={async (e) => {
                      const selectedProjectId = e.target.value;

                      setFormData((prev) => ({
                        ...prev,
                        projectid: selectedProjectId,
                      }));

                      // Fetch milestones for the selected project
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {"123" + project.id} - {project.project_title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {formData.projectid && milestones.length > 0 && (
              <div>
                <label className="block mb-1">Milestone</label>
                <select
                  value={formData.project_milestone}
                  onChange={async (e) => {
                    const selectedMilestoneId = e.target.value;
                    const selectedMilestone = milestones.find(
                      (m) => String(m.id) === selectedMilestoneId
                    );

                    const updatedForm = {
                      ...formData,
                      project_milestone: selectedMilestoneId,
                      project_milestone_name:
                        selectedMilestone?.segment_title || "",
                    };

                    setFormData(updatedForm);

                    await checkPostsaleCompletedCalls(
                      updatedForm.email,
                      selectedMilestoneId,
                      updatedForm.allowedCalls
                    );
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                >
                  <option value="">Select milestone</option>
                  {milestones.map((milestone) => (
                    <option key={milestone.id} value={milestone.id}>
                      {milestone.segment_title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.sale_type === "Postsales" &&
              formData.client_plan_name && (
                <div>
                  <label className="block mb-1">Plan</label>
                  <input
                    type="text"
                    name="client_plan_name"
                    value={formData.client_plan_name}
                    className="w-full border px-3 py-2 rounded border-[#cccccc]  focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                    required
                    disabled
                    readOnly
                  />
                </div>
              )}

            <div>
              <label className="block mb-1">Call Related To</label>
              <select
                name="call_related_to"
                value={formData.call_related_to}
                onChange={(e) => {
                  handleChange(e);
                  handleCallRelatedToChange(e.target.value);
                }}
                className="w-full border px-3 py-2 rounded border-[#cccccc] text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                required
              >
                <option value="">Select Option</option>
                {formData.sale_type === "Presales" && (
                  <>
                    <option value="direct_call">Direct Call</option>
                    <option value="subject_area_related">
                      Subject Area Related
                    </option>
                    <option value="price_and_discount_related">
                      Price And Discount Related
                    </option>
                  </>
                )}
                <option value="I_am_not_sure">I am not sure</option>
              </select>
            </div>

            {formData.call_related_to === "subject_area_related" && (
              <div>
                <label className="block mb-1">Subject Area</label>
                <Select
                  name="subject_area"
                  value={
                    formData.subject_area
                      ? {
                          value: formData.subject_area,
                          label: formData.subject_area,
                        }
                      : null
                  }
                  onChange={(selectedOption) => {
                    handleChange({
                      target: {
                        name: "subject_area",
                        value: selectedOption?.value || "",
                      },
                    });
                    handleSubjectAreaChange(selectedOption);
                  }}
                  options={subjectAreas.map((s) => ({
                    value: s.domain,
                    label: s.domain,
                  }))}
                  placeholder="Select Subject Area"
                  className="w-full"
                />
              </div>
            )}

            {formData.call_related_to !== "I_am_not_sure" && (
              <div>
                <label className="block mb-1">Primary Consultant</label>
                <Select
                  name="consultant_id"
                  options={consultantOptions}
                  value={
                    consultantOptions.find(
                      (option) => option.value === formData.consultant_id
                    ) || null
                  }
                  onChange={(selectedOption) => {
                    const selectedValue = selectedOption
                      ? selectedOption.value
                      : "";
                    const selectedLabel = selectedOption
                      ? selectedOption.label
                      : "";
                    setSelectedConsultantName(selectedLabel);

                    if (
                      selectedValue &&
                      selectedValue === formData.secondary_consultant_id
                    ) {
                      toast.error(
                        "Primary and Secondary Consultant cannot be the same."
                      );
                      return;
                    }

                    handleChange({
                      target: {
                        name: "consultant_id",
                        value: selectedValue,
                      },
                    });

                    if (selectedValue) {
                      checkConsultantConditions(selectedValue, selectedLabel);

                      const selectedConsultant = consultants.find(
                        (c) => c.id === selectedValue
                      );

                      // Check if they have "Reassign" permission
                      if (
                        selectedConsultant &&
                        selectedConsultant.fld_permission &&
                        JSON.parse(selectedConsultant.fld_permission).includes(
                          "Reassign"
                        )
                      ) {
                        setShowReassignOptions(true);
                      } else {
                        setShowReassignOptions(false);
                      }
                    } else {
                      setShowReassignOptions(false);
                    }
                  }}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isClearable
                  placeholder="Select Consultant"
                  required
                />
              </div>
            )}

            {formData.sale_type === "Postsales" &&
              formData.call_related_to !== "I_am_not_sure" && (
                <div className="mb-4">
                  <label className="block mb-1">Secondary Consultant</label>
                  <Select
                    name="secondary_consultant_id"
                    options={consultantOptions}
                    value={
                      consultantOptions.find(
                        (option) =>
                          option.value === formData.secondary_consultant_id
                      ) || null
                    }
                    onChange={(selectedOption) => {
                      const selectedSecondaryValue = selectedOption
                        ? selectedOption.value
                        : "";

                      // Prevent duplicate consultant selection
                      if (
                        selectedSecondaryValue &&
                        selectedSecondaryValue === formData.consultant_id
                      ) {
                        toast.error(
                          "Primary and Secondary Consultant cannot be the same."
                        );
                        return;
                      }

                      handleChange({
                        target: {
                          name: "secondary_consultant_id",
                          value: selectedSecondaryValue,
                        },
                      });
                    }}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                    placeholder="Select Secondary Consultant"
                  />
                </div>
              )}

            {showReassignOptions &&
              formData.sale_type === "Presales" &&
              (formData.call_related_to === "direct_call" ||
                formData.call_related_to === "subject_area_related") && (
                <div className="mb-4">
                  <label className="block mb-1">Sub Option</label>
                  <select
                    name="consultant_another_option"
                    value={formData.consultant_another_option || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                  >
                    <option value="">Select Sub Option</option>
                    <option value="CONSULTANT">
                      Assign Call to {selectedConsultantName}
                    </option>
                    <option value="TEAM">Assign Call to Team Member</option>
                  </select>
                </div>
              )}

            <div>
              <label className="block mb-1">Client Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                disabled
                className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                readOnly
              />
            </div>

            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                readOnly
              />
            </div>

            <div>
              <label className="block mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                disabled
                className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                readOnly
              />
            </div>

            <div className="md:col-span-3">
              <label className="block mb-1">Topic of Research</label>
              <textarea
                name="topic_of_research"
                value={formData.topic_of_research}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Call Regarding</label>
              <select
                name="call_regarding"
                value={formData.call_regarding}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded border-[#cccccc] text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                required
              >
                <option value="">Select</option>
                {Object.entries(
                  callRegardingOptions[formData.sale_type] || {}
                ).map(([key, label]) => (
                  <option key={key} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">Asana URL / Quote ID</label>
              <input
                type="text"
                name="asana_link"
                value={formData.asana_link}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                required
              />
            </div>

            <div className="md:col-span-3">
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="set_int_comments"
                  checked={formData.set_int_comments}
                  onChange={handleChange}
                  className="mr-2"
                />
                Add CRM Comments
              </label>
              {formData.set_int_comments && (
                <textarea
                  name="internal_comments"
                  value={formData.internal_comments}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600 mt-2"
                  placeholder="Enter comments"
                />
              )}
            </div>
            {showRequestField && (
              <div className="mt-4">
                <label
                  htmlFor="requestMessage"
                  className="block mb-1 font-medium"
                >
                  Request Message
                </label>
                <textarea
                  id="requestMessage"
                  name="requestMessage"
                  className="w-full p-2 border rounded"
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="md:col-span-3 flex justify-end pt-4">
              <button
                id="submitBtn"
                type="button"
                onClick={handleSubmit}
                className={`bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-[11px] flex items-center gap-1 cursor-pointer transition ${
                  submitDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
                disabled={submitDisabled || submitting}
              >
                {submitting ? "Submitting..." : submitButtonText}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-chevrons-right-icon lucide-chevrons-right"
                >
                  <path d="m6 17 5-5-5-5" />
                  <path d="m13 17 5-5-5-5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
