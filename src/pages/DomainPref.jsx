import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import $ from "jquery";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { toast } from "react-hot-toast";
import { X } from "lucide-react";
import Select from "react-select";
import SkeletonLoader from "../components/SkeletonLoader";
import SocketHandler from "../hooks/SocketHandler";
import { getSocket } from "../utils/Socket";
import { useAuth } from "../utils/idb";
import API_URL from "../utils/constants";

DataTable.use(DT);

export default function DomainPref() {
  const [domains, setDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allConsultants, setAllConsultants] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting,setSubmitting]=useState(false);
  const {user}=useAuth();

  const [formData, setFormData] = useState({
    domain: "",
    pref_1: "",
    pref_2: "",
    pref_3: "",
    pref_4: "",
    pref_5: "",
    pref_6: "",
  });


/// socket ////////
const socket = getSocket();

useEffect(() => {
  const handleDomainAdded = (newDomain) => {
    console.log("Socket Called - Domain Added");
    setDomains((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.some((domain) => domain.id == newDomain.id)) {
        return list;
      }
      return [...list, newDomain];
    });
  };

  const handleDomainUpdated = (updatedDomain) => {
    console.log("Socket Called - Domain Updated");
    setDomains((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((domain) =>
        domain.id == updatedDomain.id ? updatedDomain : domain
      );
    });
  };

  socket.on("domainAdded", handleDomainAdded);
  socket.on("domainUpdated", handleDomainUpdated);

  return () => {
    socket.off("domainAdded", handleDomainAdded);
    socket.off("domainUpdated", handleDomainUpdated);
  };
}, []);
useEffect(() => {
  const handleDomainDeleted = ({ id }) => {
    console.log("Socket Called - Domain Deleted");
    setDomains((prev) => prev.filter((domain) => domain.id != id));
  };

  const handleDomainStatusUpdated = (updatedDomain) => {
    console.log("Socket Called - Domain Status Updated");
    setDomains((prev) =>
      prev.map((domain) =>
        domain.id == updatedDomain.id ? updatedDomain : domain
      )
    );
  };

  socket.on("domainDeleted", handleDomainDeleted);
  socket.on("domainStatusUpdated", handleDomainStatusUpdated);

  return () => {
    socket.off("domainDeleted", handleDomainDeleted);
    socket.off("domainStatusUpdated", handleDomainStatusUpdated);
  };
}, [user.id]);

/// socket ////////


  useEffect(() => {
    getAllDomains();
    getConsultants();
  }, []);

  const getAllDomains = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/api/helpers/getAllDomains`
      );
      const result = await response.json();
      if (result.status) {
        setDomains(result.data);
      } else {
        toast.error("Failed to fetch domains");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error fetching domains");
    } finally {
      setIsLoading(false);
    }
  };

  const getConsultants = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/users/getallusers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filters: {
              usertype: ["CONSULTANT"],
              keyword: "",
              status: "Active",
            },
          }),
        }
      );
      const result = await response.json();
      if (result.status) {
        setAllConsultants(result.data);
      } else {
        console.error("Failed to fetch Consultants");
      }
    } catch (error) {
      console.error("Error fetching consultants", error);
      toast.error("Error fetching Consultants");
    }
  };

  const handleSave = async () => {
    const { domain } = formData;
    if (!domain) {
      toast.error("Domain name is required");
      return;
    }

    try {
      setSubmitting(true);
      const method = "POST";
      const url = `${API_URL}/api/domains/addDomain`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.status) {
        toast.success(`Domain added successfully`);
        setFormData({
          domain: "",
          pref_1: "",
          pref_2: "",
          pref_3: "",
          pref_4: "",
          pref_5: "",
          pref_6: "",
        });

        setShowAddForm(false);
        getAllDomains();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save");
    }finally{
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    const { domain } = formData;
    if (!domain) {
      toast.error("Domain name is required");
      return;
    }

    try {
      setSubmitting(true);
      const method = "PUT";
      const url = `${API_URL}/api/domains/updateDomain/${editId}`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.status) {
        toast.success(`Domain updated successfully`);
        setFormData({
          domain: "",
          pref_1: "",
          pref_2: "",
          pref_3: "",
          pref_4: "",
          pref_5: "",
          pref_6: "",
        });
        setEditId(null);
        setShowEditForm(false);
        getAllDomains();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save");
    }finally{
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    const prefs = (item.cosultantId || "").split(",").map((p) => p.trim());
    setFormData({
      domain: item.domain,
      pref_1: prefs[0] || "",
      pref_2: prefs[1] || "",
      pref_3: prefs[2] || "",
      pref_4: prefs[3] || "",
      pref_5: prefs[4] || "",
      pref_6: prefs[5] || "",
    });
    setEditId(item.id);
    setShowEditForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this domain?")) return;

    try {
      const res = await fetch(
        `${API_URL}/api/domains/deleteDomain/${id}`,
        {
          method: "DELETE",
        }
      );
      const result = await res.json();
      if (result.status) {
        toast.success("Deleted successfully");
        getAllDomains();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete");
    }
  };

  const updateDomainStatus = async (domainId, status) => {
    try {
      const res = await fetch(
        `${API_URL}/api/domains/updateDomainStatus/${domainId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();
      if (data.status) {
        toast.success("Status updated");
      } else {
        toast.error(data.message || "Status update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating status");
    }
  };

  const columns = [
    { title: "Domain", data: "domain" },
    {
      title: "Pref 1",
      data: "cosultantId",
      render: (data) => data?.split(",")[0]?.trim() || "",
    },
    {
      title: "Pref 2",
      data: "cosultantId",
      render: (data) => data?.split(",")[1]?.trim() || "",
    },
    {
      title: "Pref 3",
      data: "cosultantId",
      render: (data) => data?.split(",")[2]?.trim() || "",
    },
    {
      title: "Pref 4",
      data: "cosultantId",
      render: (data) => data?.split(",")[3]?.trim() || "",
    },
    {
      title: "Pref 5",
      data: "cosultantId",
      render: (data) => data?.split(",")[4]?.trim() || "",
    },
    {
      title: "Pref 6",
      data: "cosultantId",
      render: (data) => data?.split(",")[5]?.trim() || "",
    },
    {
      title: "Status",
      data: "status",
      orderable: false,
      render: function (data, type, row) {
        const checked = data === "Active" ? "checked" : "";
        return `
      <label class="custom-switch">
        <input type="checkbox" class="custom-checkbox" data-id="${row.id}" ${checked}>
        <div class="custom-slider"></div>
      </label>
    `;
      },
    },
    {
      title: "Actions",
      data: null,
      orderable: false,
      render: (data, type, row) => `
        <button class="edit-btn bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-white leading-none text-[11px] cursor-pointer" data-id="${row.id}">Edit</button>
        <button class="delete-btn bg-red-600 px-2 py-1 rounded text-white leading-none text-[11px]" data-id="${row.id}">Delete</button>
      `,
    },
  ];

  useEffect(() => {
    $(document).on("click", ".edit-btn", function () {
      const id = $(this).data("id");
      const selected = domains.find((d) => d.id === id);
      handleEdit(selected);
    });

    $(document).on("click", ".delete-btn", function () {
      const id = $(this).data("id");
      handleDelete(id);
    });

    return () => {
      $(document).off("click", ".edit-btn");
      $(document).off("click", ".delete-btn");
    };
  }, [domains]);

  const tableOptions = {
    responsive: true,
    pageLength: 25,
    lengthMenu: [5, 10, 25, 50, 100],
     order: false,       
    ordering: false,
    dom: '<"flex justify-between items-center mb-4"lf>rt<"flex justify-between items-center mt-4"ip>',
    language: {
      search: "",
      searchPlaceholder: "Search Domains...",
      lengthMenu: "Show _MENU_ entries",
      info: "Showing _START_ to _END_ of _TOTAL_ entries",
      infoEmpty: "No entries available",
      infoFiltered: "(filtered from _MAX_ total entries)",
    },
    createdRow: (row, data) => {
      $(row)
        .find(".custom-checkbox")
        .on("change", function () {
          const domainId = $(this).data("id");
          const newStatus = this.checked ? "ACTIVE" : "INACTIVE";
          updateDomainStatus(domainId, newStatus);
        });
    },
    drawCallback: function () {
      const container = $(this.api().table().container());
      container
        .find('input[type="search"]')
        .addClass(
          "border px-3 py-1 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600 !py-1 border-gray-300 text-[12px]"
        );
      container
        .find("select")
        .addClass(
          "border px-3 py-1 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600 !py-1 border-gray-300 text-[12px]"
        );
    },
  };

  const openAddForm = () => {
    setFormData({
      domain: "",
      pref_1: "",
      pref_2: "",
      pref_3: "",
      pref_4: "",
      pref_5: "",
      pref_6: "",
    });

    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
  };

  return (
    <div className="">
      <SocketHandler otherSetters={[{ setFn: setAllConsultants, isBookingList: false }]} />
      <div className="">
        <div className="">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[16px] font-semibold text-gray-900">
              Domain Preferences
            </h2>
            <button
              onClick={openAddForm}
              className="bg-green-600 leading-none text-white px-2 py-1.5 rounded hover:bg-green-700 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              Add New
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {isLoading ? (
            <SkeletonLoader
              rows={6}
              columns={[
                "Domain",
                "Pref 1",
                "Pref 2",
                "Pref 3",
                "Pref 4",
                "Pref 5",
                "Pref 6",
                "Status",
                "Actions",
              ]}
            />
          ) : domains.length > 0 ? (
            <DataTable
              data={domains}
              columns={columns}
              className="table-auto w-full text-[12px] border border-gray-300 divide-y divide-gray-300 dataTable the-table-set border-b-0"
              options={tableOptions}
            />
          ) : (
            <div className="text-center text-gray-600">
              No domains available.
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Animated Side Form */}
      <AnimatePresence>
        {showAddForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-[#000000c2] bg-opacity-50 z-40"
              onClick={closeForm}
            />

            {/* Side Form */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.4,
              }}
              className="fixed top-0 right-0 h-full w-[25%] bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-0">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 border-b bg-[#224d68] text-white">
                  <h3 className="text-[15px] font-semibold">
                    {editId ? "Add Domain" : "Add New Domain"}
                  </h3>
                  <button
                    onClick={closeForm}
                    className="text-gray-100 hover:text-red-500 text-2xl cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Form Content */}
                <div className="space-y-6 p-4">
                  {/* Domain Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Domain Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter domain name"
                      value={formData.domain}
                      onChange={(e) =>
                        setFormData({ ...formData, domain: e.target.value })
                      }
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Consultant Preferences */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-800 pb-2">
                      Consultant Preferences
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preference {n}
                          </label>
                          <Select
                            className="react-select-container"
                            classNamePrefix="react-select"
                            options={allConsultants.map((consultant) => {
                              const trimmedName = consultant.fld_name.trim();
                              const isDisabled = [1, 2, 3, 4, 5, 6]
                                .map((i) =>
                                  (formData[`pref_${i}`] || "").trim()
                                )
                                .filter(
                                  (v) =>
                                    v &&
                                    v !== (formData[`pref_${n}`] || "").trim()
                                )
                                .includes(trimmedName);

                              return {
                                value: trimmedName,
                                label: trimmedName,
                                isDisabled,
                              };
                            })}
                            value={
                              allConsultants
                                .map((consultant) => ({
                                  value: consultant.fld_name.trim(),
                                  label: consultant.fld_name.trim(),
                                }))
                                .find(
                                  (option) =>
                                    option.value ===
                                    (formData[`pref_${n}`] || "").trim()
                                ) || null
                            }
                            onChange={(selected) =>
                              setFormData({
                                ...formData,
                                [`pref_${n}`]: selected
                                  ? selected.value.trim()
                                  : "",
                              })
                            }
                            placeholder="Select Consultant"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                    {/* Action Buttons */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleSave}
                      disabled={submitting}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      {submitting? "Saving...":"Save"}
                    </button>
                  </div>
                </div>
                </div>
                
                
            </motion.div>
          </>
        )}
        {showEditForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-[#000000c2] bg-opacity-50 z-40"
              onClick={closeForm}
            />

            {/* Side Form */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.4,
              }}
              className="fixed top-0 right-0 h-full w-[25%] bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-0">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 border-b bg-[#224d68] text-white">
                  <h3 className="text-[15px] font-semibold">
                    {editId ? "Edit Domain" : "Add New Domain"}
                  </h3>
                  <button
                    onClick={closeForm}
                    className="text-gray-100 hover:text-red-500 text-2xl cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Form Content */}
                <div className="space-y-6 p-4">
                  {/* Domain Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Domain Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter domain name"
                      value={formData.domain}
                      onChange={(e) =>
                        setFormData({ ...formData, domain: e.target.value })
                      }
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Consultant Preferences */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-800 pb-2">
                      Consultant Preferences
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preference {n}
                          </label>
                          <Select
                            className="react-select-container"
                            classNamePrefix="react-select"
                            options={allConsultants.map((consultant) => {
                              const trimmedName = consultant.fld_name.trim();
                              const isDisabled = [1, 2, 3, 4, 5, 6]
                                .map((i) =>
                                  (formData[`pref_${i}`] || "").trim()
                                )
                                .filter(
                                  (v) =>
                                    v &&
                                    v !== (formData[`pref_${n}`] || "").trim()
                                )
                                .includes(trimmedName);

                              return {
                                value: trimmedName,
                                label: trimmedName,
                                isDisabled,
                              };
                            })}
                            value={
                              allConsultants
                                .map((consultant) => ({
                                  value: consultant.fld_name.trim(),
                                  label: consultant.fld_name.trim(),
                                }))
                                .find(
                                  (option) =>
                                    option.value ===
                                    (formData[`pref_${n}`] || "").trim()
                                ) || null
                            }
                            onChange={(selected) =>
                              setFormData({
                                ...formData,
                                [`pref_${n}`]: selected
                                  ? selected.value.trim()
                                  : "",
                              })
                            }
                            placeholder="Select Consultant"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleUpdate}
                      disabled={submitting}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      {submitting?"Updating...":"Update"}
                    </button>
                  </div>
                </div>
                </div>

                
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
