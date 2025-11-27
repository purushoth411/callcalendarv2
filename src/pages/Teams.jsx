import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import $ from "jquery";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { toast } from "react-hot-toast";
import { PlusIcon, X, XIcon } from "lucide-react";
import Select from "react-select";
import SkeletonLoader from "../components/SkeletonLoader";
import { getSocket } from "../utils/Socket";
import { useAuth } from "../utils/idb";
import { formatDate } from "../helpers/CommonHelper";
import API_URL from "../utils/constants";

DataTable.use(DT);

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    team: "",
  });

  const { user } = useAuth();

  /// socket ////////
  const socket = getSocket();

  useEffect(() => {
    const handleTeamAdded = (newTeam) => {
      console.log("Socket Called - Team Added");
      setTeams((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some((team) => team.id == newTeam.id)) {
          return list;
        }
        return [...list, newTeam];
      });
    };

    const handleTeamUpdated = (updatedTeam) => {
      console.log("Socket Called - Team Updated");
      setTeams((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map((team) =>
          team.id == updatedTeam.id ? updatedTeam : team
        );
      });
    };

    socket.on("teamAdded", handleTeamAdded);
    socket.on("teamUpdated", handleTeamUpdated);

    return () => {
      socket.off("teamAdded", handleTeamAdded);
      socket.off("teamUpdated", handleTeamUpdated);
    };
  }, [user.id]);
  useEffect(() => {
    const handleTeamDeleted = ({ id }) => {
      console.log("Socket Called - Team Deleted");
      setTeams((prev) => prev.filter((team) => team.id != id));
    };

    const handleTeamStatusUpdated = (updatedTeam) => {
      console.log("Socket Called - Team Status Updated");
      setTeams((prev) =>
        prev.map((team) => (team.id == updatedTeam.id ? updatedTeam : team))
      );
    };

    socket.on("teamDeleted", handleTeamDeleted);
    socket.on("teamStatusUpdated", handleTeamStatusUpdated);

    return () => {
      socket.off("teamDeleted", handleTeamDeleted);
      socket.off("teamStatusUpdated", handleTeamStatusUpdated);
    };
  }, [user.id]);

  /// socket ////////

  useEffect(() => {
    getAllTeams();
  }, []);

  const getAllTeams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/api/helpers/getAllTeams`
      );
      const result = await response.json();
      if (result.status) {
        setTeams(result.data);
      } else {
        toast.error("Failed to fetch teams");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error fetching teams");
    } finally {
      setIsLoading(false);
    }
  };

  const updateTeamStatus = async (teamId, status) => {
    try {
      const res = await fetch(
        `${API_URL}/api/helpers/update-team-status/${teamId}`,
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

  const handleSave = async () => {
    const { team } = formData;
    if (!team) {
      toast.error("Team name is required");
      return;
    }

    try {
      const method = "POST";
      const url = `${API_URL}/api/helpers/addTeam`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.status) {
        toast.success(`Team added successfully`);
        setFormData({
          team: "",
        });

        setShowAddForm(false);
        getAllTeams();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save");
    }
  };

  const handleUpdate = async () => {
    const { team } = formData;
    if (!team) {
      toast.error("Team name is required");
      return;
    }

    try {
      const method = "PUT";
      const url = `${API_URL}/api/helpers/updateTeam/${editId}`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.status) {
        toast.success(`Team updated successfully`);
        setFormData({
          team: "",
        });
        setEditId(null);
        setShowEditForm(false);
        getAllTeams();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save");
    }
  };

  const handleEdit = (item) => {
    setFormData({
      team: item.fld_title,
    });
    setEditId(item.id);
    setShowEditForm(true);
  };

  const columns = [
    {
      title: "Team Name",
      data: "fld_title",
    },
    {
      title: "Members",
      data: "users",
      orderable: false,
      render: function (users, type, row) {
        const count = users?.length || 0;

        // Build list items
        const userList = users
          .map((u) => `<li class="px-2 py-1 text-sm text-gray-700">${u.fld_name}</li>`)
          .join("");

        return `
        <div class="accordion">
          <button 
            class="accordion-toggle text-blue-600 hover:underline text-sm"
            data-id="${row.id}"
          >
            ${count} Member${count !== 1 ? "s" : ""}
          </button>
          <ul class="accordion-content hidden border rounded mt-2 bg-gray-50">${userList}</ul>
        </div>
      `;
      },
    },
    {
      title: "Added On",
      data: "fld_addedon",
      orderable: false,
      render: (data) => `<div class="text-gray-500 ">${formatDate(data)}</div>`,
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
     
    `,
    },
  ];

  useEffect(() => {
    // Handle edit button
    $(document).on("click", ".edit-btn", function () {
      const id = $(this).data("id");
      const selected = teams.find((d) => d.id === id);
      handleEdit(selected);
    });

    // Accordion toggle
    $(document).on("click", ".accordion-toggle", function () {
      const content = $(this).closest(".accordion").find(".accordion-content");
      content.toggleClass("hidden");
    });

    return () => {
      $(document).off("click", ".edit-btn");
      $(document).off("click", ".accordion-toggle");
    };
  }, [teams]);


  const tableOptions = {
    responsive: true,
    pageLength: 25,
    lengthMenu: [5, 10, 25, 50, 100],
    order: false,
    ordering: false,
    dom: '<"flex justify-between items-center mb-4"lf>rt<"flex justify-between items-center mt-4"ip>',
    language: {
      search: "",
      searchPlaceholder: "Search teams...",
      lengthMenu: "Show _MENU_ entries",
      info: "Showing _START_ to _END_ of _TOTAL_ entries",
      infoEmpty: "No entries available",
      infoFiltered: "(filtered from _MAX_ total entries)",
    },
    createdRow: (row, data) => {
      $(row)
        .find(".custom-checkbox")
        .on("change", function () {
          const teamId = $(this).data("id");
          const newStatus = this.checked ? "ACTIVE" : "INACTIVE";
          updateTeamStatus(teamId, newStatus);
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
      <div className="">
        <div className="">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-semibold text-gray-900">
              Team Management
            </h2>
            <button
              onClick={openAddForm}
              className="bg-green-600 leading-none text-white px-2 py-1.5 rounded hover:bg-green-700 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <PlusIcon size={11} className="leading-none" /> Add New
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {isLoading ? (
              <SkeletonLoader
                rows={6}
                columns={["Team Name", "Added On", "Status", "Actions"]}
              />
            ) : (
              <DataTable
                data={teams}
                columns={columns}
                className="table-auto w-full text-[12px] border border-gray-300 divide-y divide-gray-300 dataTable the-table-set border-b-0"
                options={tableOptions}
              />
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {/* ADD TEAM FORM */}
        {showAddForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-[#000000c2] flex items-center justify-center z-50"
              onClick={closeForm}
            />

            {/* Slide-In Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 w-[25%] h-full bg-white shadow z-50 overflow-y-auto"
            >
              <div className="">
                <div className="flex justify-between items-center px-4 py-3 border-b bg-[#224d68] text-white">
                  <h3 className="text-[15px] font-semibold">Add New Team</h3>
                  <button
                    onClick={closeForm}
                    className="text-gray-100 hover:text-red-500 text-2xl cursor-pointer"
                  >
                    <XIcon size={17} />
                  </button>
                </div>

                <div className="p-4 space-y-4 ">
                  {/* Team Name */}
                  <div>
                    <label className="block mb-1">Team Name *</label>
                    <input
                      type="text"
                      placeholder="Enter team name"
                      value={formData.team}
                      onChange={(e) =>
                        setFormData({ ...formData, team: e.target.value })
                      }
                      className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleSave}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* EDIT TEAM FORM */}
        {showEditForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-[#000000c2] flex items-center justify-center z-50"
              onClick={closeForm}
            />

            {/* Slide-In Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 w-[25%] h-full bg-white shadow z-50 overflow-y-auto"
            >
              <div className="">
                <div className="flex justify-between items-center px-4 py-3 border-b bg-[#224d68] text-white">
                  <h3 className="text-[15px] font-semibold">Edit Team</h3>
                  <button
                    onClick={closeForm}
                    className="text-gray-100 hover:text-red-500 text-2xl cursor-pointer"
                  >
                    <XIcon size={17} />
                  </button>
                </div>

                <div className="p-4 space-y-4 ">
                  {/* Team Name */}
                  <div>
                    <label className="block mb-1">Team Name *</label>
                    <input
                      type="text"
                      placeholder="Enter team name"
                      value={formData.team}
                      onChange={(e) =>
                        setFormData({ ...formData, team: e.target.value })
                      }
                      className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
                    />
                  </div>

                  {/* Update Button */}
                  <div className="flex justify-end gap-3 ">
                    <button
                      onClick={handleUpdate}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      Update
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
