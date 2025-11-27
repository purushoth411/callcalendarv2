import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import $ from "jquery";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { toast } from "react-hot-toast";
import { PlusIcon, X, XIcon } from "lucide-react";
import Select from "react-select";
import SkeletonLoader from "../components/SkeletonLoader";
import { useAuth } from "../utils/idb";
import { getSocket } from "../utils/Socket";
import { formatDate } from "../helpers/CommonHelper";
import API_URL from "../utils/constants";

DataTable.use(DT);

export default function Approveaddcallrequests() {
  const {user} =useAuth();
  const [approveaddcallrequests, setApproveaddcallrequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    approveaddcallrequest: "",
  });

  useEffect(() => {
    getAllApproveaddcallrequests();
  }, []);

  ///socket ////////

useEffect(() => {
  const socket = getSocket();

  const handleAddCallRequestAdded = (addCall) => {
  console.log("Socket Called - Add Call Request Added");

  setApproveaddcallrequests((prev) => {
    const list = Array.isArray(prev) ? prev : [];

    // prevent duplicates
    if (list.some((req) => req.id == addCall.id)) {
      return list;
    }

    return [...list, addCall];
  });
};

  const handleUpdatedCallRequestStatus = ({ id, status }) => {
    console.log("Socket Called - Approved Call Request");
    setApproveaddcallrequests((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((call) =>
        String(call.id) === String(id)
          ? { ...call, followstatus: status }
          : call
      );
    });
  };

  socket.on("addCallAdded", handleAddCallRequestAdded);
  socket.on("updatedCallRequestStatus", handleUpdatedCallRequestStatus);

  return () => {
    socket.off("addCallAdded", handleAddCallRequestAdded);
    socket.off("updatedCallRequestStatus", handleUpdatedCallRequestStatus);
  };
}, [user.id]);


  ///socket

  const getAllApproveaddcallrequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/api/approveaddcallrequests/getAllApproveaddcallrequests`
      );
      const result = await response.json();
      
      if (result.status) {
        setApproveaddcallrequests(result.data);
      } else {
        toast.error("Failed to fetch approveaddcallrequests");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error fetching approveaddcallrequests");
    } finally {
      setIsLoading(false);
    }
  };

  const updateApproveaddcallrequestStatus = async (approveData, approveaddcallrequestId, status) => {
    try {
      const res = await fetch(
        `${API_URL}/api/approveaddcallrequests/update-approveaddcallrequest-status/${approveaddcallrequestId}`,
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
        getAllApproveaddcallrequests();
      } else {
        toast.error(data.message || "Status update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating status");
    }
  };

  const columns = [
    {
      title: "Request By",
      data: "crm_name",
    },
    {
      title: "Consultant",
      data: "admin_name",
    },
    {
      title: "Plan Name",
      data: "planName",
    },
    {
      title: "Client Info.",
      data: null,
      render: (data, type, row) => `${row.client_name} ${row.client_code}`
    },
    {
      title: "Request Message",
      data: "requestMessage",
    },
    {
      title: "Requested On",
      data: "addedon",
      render: function (data) {
    return formatDate(data);
  }
    },
    {
      title: "Action",
      data: "status",
      orderable: false,
      render: function (data, type, row) {
        if (data === "Pending") {
          return `
            <div class="flex gap-2">
            <button 
              class="edit-btn bg-green-500 hover:bg-green-600 text-white text-[11px] px-[6px] py-[4px] rounded whitespace-nowrap leading-none" 
              data-id="${row.id}" data-status="Approved">
              Approve <i class="fa fa-check" aria-hidden="true"></i>
            </button>
            <button 
              class="edit-btn bg-red-500 hover:bg-red-600 text-white text-[11px] px-[6px] py-[4px] rounded whitespace-nowrap leading-none" 
              data-id="${row.id}" data-status="Rejected">
              Reject <i class="fa fa-times" aria-hidden="true"></i>
            </button>
            </div>
          `;
        } else {
          const color = data === "Approved" ? "green" : "red";
          return `<span class="inline-block px-2 py-1 text-[10px] font-medium rounded bg-${color}-100 text-${color}-800">${data}</span>`;
        }
      },
    }

  ];

  useEffect(() => {
    $(document).on("click", ".edit-btn", function () {
      const id = $(this).data("id");
      const status = $(this).data("status");
      const selected = approveaddcallrequests.find((d) => d.id === id);
      console.log(selected);
      
      updateApproveaddcallrequestStatus(selected,id,status);
    });

    return () => {
      $(document).off("click", ".edit-btn");
    };
  }, [approveaddcallrequests]);

  const tableOptions = {
    responsive: true,
    pageLength: 25,
    lengthMenu: [5, 10, 25, 50, 100],
    ordering: false, // Disable ordering globally
    dom: '<"flex justify-between items-center mb-4"lf>rt<"flex justify-between items-center mt-4"ip>',
    language: {
      search: "",
      searchPlaceholder: "Search ...",
      lengthMenu: "Show _MENU_ entries",
      info: "Showing _START_ to _END_ of _TOTAL_ entries",
      infoEmpty: "No entries available",
      infoFiltered: "(filtered from _MAX_ total entries)",
    },
    createdRow: (row, data) => {
      $(row)
        .find(".custom-checkbox")
        .on("change", function () {
          const approveaddcallrequestId = $(this).data("id");
          const newStatus = this.checked ? "ACTIVE" : "INACTIVE";
          updateApproveaddcallrequestStatus(approveaddcallrequestId, newStatus);
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
      <div className="">
        <div className="">
          <div className="flex gap-2 items-center mb-4">
            <h2 className="text-[16px] font-semibold text-gray-900">Manage Approve Add Call Request</h2>
            <div>
                   
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {isLoading ? "..." : approveaddcallrequests.length}
                    </span>
                  </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {isLoading ? (
            <SkeletonLoader
              rows={6}
              columns={["Request By", "Consultant", "Plan Name", "Client Info.","Request Message","Requested On","Action"]}
            />
          ) : (
            <DataTable
              data={approveaddcallrequests}
              columns={columns}
              className="table-auto w-full text-[12px] border border-gray-300 divide-y divide-gray-300 dataTable the-table-set border-b-0"
              options={tableOptions}
            />
          )}
          </div>
        </div>
      </div>
     
    </div>
  );
}
