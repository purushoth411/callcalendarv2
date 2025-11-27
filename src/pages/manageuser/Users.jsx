import React, { useEffect, useState, useRef } from "react";
import $ from "jquery";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { useAuth } from "../../utils/idb.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import AddUser from "./AddUser.jsx";
import EditUser from "./EditUser.jsx";
import { formatDate } from "../../helpers/CommonHelper.jsx";
import SkeletonLoader from "../../components/SkeletonLoader.jsx";
import { PlusIcon } from "lucide-react";
import { getSocket } from "../../utils/Socket.jsx";
import SocketHandler from "../../hooks/SocketHandler.jsx";
import API_URL from "../../utils/constants.jsx";

export default function Users() {
  const { user, logout,setUserArray } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  DataTable.use(DT);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUserType, setSelectedUserType] = useState("EXECUTIVE");
  const [userCount, setUserCount] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("");
  const [teams, setTeams] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tableRef = useRef(null);
  const [formData, setFormData] = useState({
    team_id:  [],
    username: "",
    name: "",
    email: "",

    password: "",
    confirmPassword: "",
    consultant_type: "",
    consultant_role: "",
    subadmin_type: "",
    permissions: [],
  });

  ///socket ////////

  useEffect(() => {
    const socket = getSocket();
    const handleUserAdded = (newUser) => {
      console.log("Socket Called - User Added");
      setAllUsers((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some((user) => user.id == newUser.id)) {
          return list;
        }
        return [...list, newUser];
      });
    };



  const handleUserUpdated = (updatedUser) => {
    console.log("Socket Called - User Updated");

    // Update allUsers
    setAllUsers((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    });

    
     if (user?.id === updatedUser.id) {
      setUserArray(updatedUser); 
    }
  };

    socket.on("userAdded", handleUserAdded);
    socket.on("userUpdated", handleUserUpdated);

    return () => {
      socket.off("userAdded", handleUserAdded);
      socket.off("userUpdated", handleUserUpdated);
    };
  }, [user.id]);

  ////////socket////////

  useEffect(() => {
    fetchAllUsers();
    getAllTeams();
    getUserCount();
  }, []);

  useEffect(() => {
    // Filter users based on selected type
    const filtered = allUsers.filter(
      (user) => user.fld_admin_type === selectedUserType
    );
    setFilteredUsers(filtered);
  }, [selectedUserType, allUsers]);

  const fetchAllUsers = async () => {
    try {
      setIsLoading(true);
      const filters = {
        usertype: [], // Fetch all user types
        keyword: "",
      };

      const response = await fetch(
        `${API_URL}/api/users/getallusers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters }),
        }
      );

      const result = await response.json();
      if (result.status) {
        setAllUsers(result.data);
      } else {
        setAllUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllTeams = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/helpers/getAllActiveTeams`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const result = await response.json();
      if (result.status) {
        setTeams(result.data);
        console.log("Teams fetched successfully:", result.data);
      } else {
        setTeams([]);
        console.error("Failed to fetch teams:", result.message);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleSave = async () => {
    // Validation
     if (((formType === "SUBADMIN" || formType === "EXECUTIVE"  ) &&
              (!formData.team_id || formData.team_id.length === 0))) // empty array
         {
          toast.error("Please select Team.");
          return;
        }

    if (
      !formData.username ||
      !formData.name ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      toast.error("Please fill all mandatory fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (formType === "CONSULTANT" && !formData.consultant_type) {
      toast.error("Consultant Type is required");
      return;
    }
    if (formType === "CONSULTANT" && !formData.consultant_role) {
      toast.error("Consultant Role is required");
      return;
    }

    if (formType === "SUBADMIN" && !formData.subadmin_type) {
      toast.error("Subadmin Type is required");
      return;
    }

    const payload = {
      ...formData,
      usertype: formType,
    };

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_URL}/api/users/addUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.status) {
        toast.success("User added successfully");
        setShowForm(false);
        fetchAllUsers(); // reload users
      } else {
        toast.error(
          result.message || "User alreday Exits or Something went wrong"
        );
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Server error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserCount = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/users/getusercount`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const result = await response.json();
      if (result.status) {
        setUserCount(result.data);
        console.log("User count fetched successfully:", result.data);
      } else {
        console.error("Failed to fetch user count:", result.message);
      }
    } catch (error) {
      console.error("Error fetching user count:", error);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      const res = await fetch(
        `${API_URL}/api/users/update-status/${userId}`,
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

  const updateUserAttendance = async (userId, attendance) => {
    try {
      const res = await fetch(
        `${API_URL}/api/users/updateAttendance/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ attendance }),
        }
      );

      const data = await res.json();
      if (data.status) {
        toast.success("Attendance updated");
      } else {
        toast.error(data.message || "Attendance update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating Attendance");
    }
  };

  const [editData, setEditData] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const handleEditButtonClick = (data) => {
    setFormType(data.fld_admin_type);
    setEditData(data);
    setShowEditForm(true);
  };

  const getColumns = (selectedUserType) => {
    const baseColumns = [
      {
        title: "Name",
        data: "fld_name",
        orderable: false,
        render: (data) =>
          `<div class="font-medium text-gray-900">${data || ""}</div>`,
      },
      {
        title: "Username",
        data: "fld_username",
        orderable: false,
        render: (data) => `<div class="text-gray-600">${data || ""}</div>`,
      },
      {
        title: "Password",
        data: "fld_decrypt_password",
        orderable: false,
        render: (data) => `<div class="text-gray-600">${data || ""}</div>`,
      },
      {
        title: "Email",
        data: "fld_email",
        orderable: false,
        render: (data) => `<div class="text-blue-600">${data || ""}</div>`,
      },

      {
        title: "Added On",
        data: "fld_addedon",
        orderable: false,
        render: (data) =>
          `<div class="text-gray-500 ">${formatDate(data)}</div>`,
      },
      {
        title: "Status",
        data: "status",
        orderable: false,
        render: function (data, type, row) {
          const checked = data === "Active" ? "checked" : "";
          return `
          <label class="custom-switch">
            <input type="checkbox" class="custom-checkbox custom-checkbox2" data-id="${row.id}" ${checked}>
            <div class="custom-slider"></div>
          </label>
        `;
        },
      },
    ];

    // Only add attendance column for CONSULTANT users
    if (selectedUserType === "CONSULTANT") {
      baseColumns.push({
        title: "Attendance",
        data: "attendance",
        orderable: false,
        render: function (data, type, row) {
          const checked = data === "PRESENT" ? "checked" : "";
          return `
          <label class="custom-switch">
            <input type="checkbox" class="custom-checkbox attendance-toggle" data-id="${row.id}" ${checked}>
            <div class="custom-slider"></div>
          </label>
        `;
        },
      });
    }

    // Add Actions column at the end
    baseColumns.push({
      title: "Actions",
      data: null,
      orderable: false,
      render: (data) => `
      <button class="edit-btn bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-white leading-none text-[11px] cursor-pointer" data-id="${data.id}">
        Edit
      </button>
    `,
    });

    return baseColumns;
  };

  const userTabs = [
    {
      key: "EXECUTIVE",
      label: "CRM",
      count: userCount.EXECUTIVE || 0,
      color: "blue",
    },
    {
      key: "SUBADMIN",
      label: "SUBADMIN",
      count: userCount.SUBADMIN || 0,
      color: "purple",
    },
    {
      key: "CONSULTANT",
      label: "CONSULTANT",
      count: userCount.CONSULTANT || 0,
      color: "green",
    },
    {
      key: "OPERATIONSADMIN",
      label: "OPS ADMIN",
      count: userCount.OPERATIONSADMIN || 0,
      color: "orange",
    },
  ];

  const handleTabClick = (userType) => {
    setSelectedUserType(userType);
  };

  const executiveUsers = allUsers.filter(
    (u) => u.fld_admin_type === "EXECUTIVE"
  );
  const subadminUsers = allUsers.filter((u) => u.fld_admin_type === "SUBADMIN");
  const consultantUsers = allUsers.filter(
    (u) => u.fld_admin_type === "CONSULTANT"
  );
  const opsAdminUsers = allUsers.filter(
    (u) => u.fld_admin_type === "OPERATIONSADMIN"
  );
  const tableOptions = {
    responsive: true,
    pageLength: 25,
    lengthMenu: [5, 10, 25, 50, 100],
    order: false,
    ordering: false,
    dom: '<"flex justify-between items-center mb-4 text-[13px]"lf>rt<"flex justify-between items-center mt-4"ip>',
    language: {
      search: "",
      searchPlaceholder: "Search users...",
      lengthMenu: "Show _MENU_ entries",
      info: "Showing _START_ to _END_ of _TOTAL_ entries",
      infoEmpty: "No entries available",
      infoFiltered: "(filtered from _MAX_ total entries)",
    },
    createdRow: (row, data) => {
      $(row)
        .find(".edit-btn")
        .on("click", () => handleEditButtonClick(data));
      $(row)
        .find(".custom-checkbox2")
        .on("change", function () {
          const userId = $(this).data("id");
          const newStatus = this.checked ? "ACTIVE" : "INACTIVE";
          updateUserStatus(userId, newStatus);
        });
      $(row)
        .find(".attendance-toggle")
        .on("change", function () {
          const userId = $(this).data("id");
          const attendance = this.checked ? "PRESENT" : "ABSENT";
          updateUserAttendance(userId, attendance);
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

  return (
    <div className="">
      <SocketHandler setAllUsers={setAllUsers} />
      <div className="">
        <div className="">
          {/* Header */}
          <div className="mb-4 flex items-center gap-3 justify-between">
            <h4 className="text-[16px] font-semibold text-gray-900">
              User Management
            </h4>
            {/* Navigation Tabs */}
            <div className="">
              <div className="bg-white rounded border border-gray-200 p-1">
                <nav className="flex space-x-1">
                  {userTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => handleTabClick(tab.key)}
                      className={`flex-1 px-2 py-1 rounded transition-all duration-200 cursor-pointer ${
                        selectedUserType === tab.key
                          ? "prime-bg text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-orange-100 bg-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2 whitespace-nowrap">
                        <span className="text-[12px]">{tab.label}</span>
                        <span
                          className={`inline-flex items-center leading-none px-2 py-1 rounded text-[11px] ${
                            selectedUserType === tab.key
                              ? "secondary-bg text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {tab.count}
                        </span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="px-3 py-2 bg-[#d7efff7d]">
              <div className="flex justify-between items-center">
                <h2 className="text-[14px] font-semibold text-gray-900">
                  {userTabs.find((tab) => tab.key === selectedUserType)?.label}{" "}
                  
                </h2>
                {/* <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {isLoading ? "..." : filteredUsers.length}
                </span>
              </div> */}
                <div className="flex justify-end gap-2">
                  {selectedUserType === "EXECUTIVE" && (
                    <button
                      onClick={() => {
                        setFormType("EXECUTIVE");
                        setShowForm(true);
                      }}
                      className="bg-green-600 leading-none text-white px-2 py-1.5 rounded hover:bg-green-700 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <PlusIcon size={11} className="leading-none" /> Add CRM
                    </button>
                  )}
                  {selectedUserType === "SUBADMIN" && (
                    <button
                      onClick={() => {
                        setFormType("SUBADMIN");
                        setShowForm(true);
                      }}
                      className="bg-green-600 leading-none text-white px-2 py-1.5 rounded hover:bg-green-700 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <PlusIcon size={11} className="leading-none" /> Add
                      Subadmin
                    </button>
                  )}
                  {selectedUserType === "CONSULTANT" && (
                    <button
                      onClick={() => {
                        setFormType("CONSULTANT");
                        setShowForm(true);
                      }}
                      className="bg-green-600 leading-none text-white px-2 py-1.5 rounded hover:bg-green-700 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <PlusIcon size={11} className="leading-none" /> Add
                      Consultant
                    </button>
                  )}
                  {selectedUserType === "OPERATIONSADMIN" && (
                    <button
                      onClick={() => {
                        setFormType("OPSADMIN");
                        setShowForm(true);
                      }}
                      className="bg-green-600 leading-none text-white px-2 py-1.5 rounded hover:bg-green-700 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <PlusIcon size={11} className="leading-none" /> Add OPS
                      Admin
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table Content */}
            {/* Table Content */}
            <div className="p-4">
              {isLoading ? (
                <SkeletonLoader
                  rows={6}
                  columns={[
                    "Name",
                    "Username",
                    "Email",
                    "Type",
                    "Added On",
                    "Status",
                    "Actions",
                  ]}
                />
              ) : (
                <div className="overflow-hidden">
                  {selectedUserType === "EXECUTIVE" && (
                    <DataTable
                      data={executiveUsers}
                      columns={getColumns(selectedUserType)}
                      className="table-auto w-full text-[12px] border border-gray-300 divide-y divide-gray-300 dataTable the-table-set border-b-0"
                      options={tableOptions}
                    />
                  )}
                  {selectedUserType === "SUBADMIN" && (
                    <DataTable
                      data={subadminUsers}
                      columns={getColumns(selectedUserType)}
                      className="table-auto w-full text-[12px] border border-gray-300 divide-y divide-gray-300 dataTable the-table-set border-b-0"
                      options={tableOptions}
                    />
                  )}
                  {selectedUserType === "CONSULTANT" && (
                    <DataTable
                      data={consultantUsers}
                      columns={getColumns(selectedUserType)}
                      className="table-auto w-full text-[12px] border border-gray-300 divide-y divide-gray-300 dataTable the-table-set border-b-0"
                      options={tableOptions}
                    />
                  )}
                  {selectedUserType === "OPERATIONSADMIN" && (
                    <DataTable
                      data={opsAdminUsers}
                      columns={getColumns(selectedUserType)}
                      className="table-auto w-full text-[12px] border border-gray-300 divide-y divide-gray-300 dataTable the-table-set border-b-0"
                      options={tableOptions}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          <AnimatePresence>
            {showForm && (
              <AddUser
                setShowForm={setShowForm}
                formData={formData}
                setFormData={setFormData}
                teams={teams}
                formType={formType}
                handleSave={handleSave}
                isSubmitting={isSubmitting}
              />
            )}

            {showEditForm && (
              <EditUser
                setShowForm={setShowEditForm}
                teams={teams}
                formType={formType}
                editData={editData}
                fetchAllUsers={fetchAllUsers}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Custom Styles */}
    </div>
  );
}
