import React, { use, useEffect } from "react";
import { motion } from "framer-motion";
import { XIcon } from "lucide-react";
import Select from "react-select";
import { set } from "idb-keyval";
import { useState } from "react";
import { toast } from "react-hot-toast";
import API_URL from "../../utils/constants";

const EditUser = ({
  setShowForm,
  formType,
  teams,
  editData,
  fetchAllUsers,
}) => {

  console.log(formType)
  const [isUpdating,setisUpdating]=useState(false);
  const [formData, setFormData] = useState({
    user_id: editData.id || null,
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

  useEffect(() => {
    if (editData) {
      const parsedPermissions = editData.fld_permission
        ? JSON.parse(editData.fld_permission)
        : [];

      setFormData({
        user_id: editData.id || null,
        team_id: (editData.fld_team_id || "").split(",").map((id) => parseInt(id)),
        username: editData.fld_username || "",
        name: editData.fld_name || "",
        email: editData.fld_email || "",
       
        password: "",
        confirmPassword: "",
        consultant_type: editData.fld_consultant_type || "",
        consultant_role: editData.fld_consultant_role || "",
        subadmin_type: editData.fld_subadmin_type || "",
        permissions: {
          reassign: parsedPermissions.includes("Reassign"),
          approve_call: parsedPermissions.includes("Approve_Add_Call_Request"),

          loop_tagging: parsedPermissions.includes("Loop_Tagging"),
          comment_received: parsedPermissions.includes("Comment_Received"),
          quote_shared: parsedPermissions.includes("Quote_Shared"),
        },
      });
    }
  }, [editData, formType]);

  const handleSave = async () => {
    const {
      user_id,
      team_id,
      username,
      name,
      email,
     
      consultant_type,
      consultant_role,
      subadmin_type,
      permissions,
    } = formData;

    if (!username || !name) {
      toast.error("Please fill all required fields");
      return;
    }

    if (((formType === "SUBADMIN" || formType === "CONSULTANT" || formType === "EXECUTIVE"  ) &&
          (!team_id || team_id.length === 0))) // empty array
     {
      toast.error("Please select Team.");
      return;
    }

     if(formType === "CONSULTANT" && !consultant_type){
          toast.error("Consultant Type is required")
    return;
        }
        if(formType === "CONSULTANT" && !consultant_role){
          toast.error("Consultant Role is required")
    return;
        }
    
        if(formType === "SUBADMIN" && !subadmin_type){
          toast.error("Subadmin Type is required")
    return;
        }

    const permissionArray = [];
    if (permissions.reassign) permissionArray.push("Reassign");
    if (permissions.approve_call)
      permissionArray.push("Approve_Add_Call_Request");

    if (permissions.loop_tagging)
      permissionArray.push("Loop_Tagging");

    if (permissions.comment_received)
      permissionArray.push("Comment_Received");

    if (permissions.quote_shared)
      permissionArray.push("Quote_Shared");

    const payload = {
      user_id,
      team_id: team_id.join(","),
      username,
      name,
      email,
     
      consultant_type,
      consultant_role,
      subadmin_type,
      permissions: permissionArray, // ✅ pass array to backend
    };

    try {
      setisUpdating(true);
      const res = await fetch(
        `${API_URL}/api/users/update/${user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.status) {
        toast.success("User updated successfully!");
        setShowForm(false);
        fetchAllUsers();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
      toast("Something went wrong");
    }finally{
      setisUpdating(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 bg-[#000000c2] flex items-center justify-center z-50">
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 w-[25%] h-full bg-white shadow z-50 overflow-y-auto"
    >
      <div className="flex justify-between items-center px-4 py-3 border-b bg-[#224d68] text-white">
        <h2 className="text-[15px] font-semibold">
          {formType === "EXECUTIVE" && "Edit CRM"}
          {formType === "CONSULTANT" && "Edit Consultant"}
          {formType === "SUBADMIN" && "Edit Subadmin"}
           {formType === "OPERATIONSADMIN" && "Edit OPS Admin"}
        </h2>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-100 hover:text-red-500 text-2xl cursor-pointer"
        >
          <XIcon size={17} />
        </button>
      </div>

      <div className="p-4 space-y-4 ">
        {(formType === "EXECUTIVE" ||
          formType === "CONSULTANT" ||
          formType === "SUBADMIN") && (
          <div className="">
            <label className="block mb-1">Select Team</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
                isMulti={true} 
              options={teams.map((team) => ({
                value: team.id,
                label: team.fld_title,
              }))}
              value={
               teams
                      .map((team) => ({
                        value: team.id,
                        label: team.fld_title,
                      }))
                      .filter((option) =>
                        (formData.team_id || [])
                          .map(String)
                          .includes(String(option.value))
                      )
              }
             
              onChange={(selected) => {
               
                  setFormData({
                    ...formData,
                    team_id: selected ? selected.map((s) => s.value) : [],
                  });
                
              }}
              placeholder="Select Team"
            />
          </div>
        )}

        <div className="">
          <label className="block mb-1">Username</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
        </div>

        <div className="">
          <label className="block mb-1">Name</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="">
          <label className="block mb-1">Email ID</label>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        {/* <div className="">
          <label className="block mb-1">Phone</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div> */}

        {/* Consultant Type */}
         {formType === "CONSULTANT" && (
          <div className="col-md-3">
            <label className="block mb-1">Consultant Type</label>
            <select
              className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
              value={formData.consultant_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  consultant_type: e.target.value,
                })
              }
            >
              <option value="">Select Type</option>
              <option value="Presales">Presales</option>
              <option value="Postsales">Postsales</option>
              <option value="Both">Both</option>
            </select>
          </div>
        )}

{formType === "CONSULTANT" && (
          <div className="col-md-3">
            <label className="block mb-1">Consultant Role</label>
            <select
              className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
              value={formData.consultant_role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  consultant_role: e.target.value,
                })
              }
            >
              <option value="">Select Type</option>
              <option value="SUB">SUB consultant</option>
              <option value="SENIOR">SENIOR consultant</option>
            </select>
          </div>
        )}

        {/* SubAdmin Type */}
        {formType === "SUBADMIN" && (
          <div className="col-md-3">
            <label className="block mb-1">Subadmin Type</label>
            <select
              className="w-full border px-3 py-2 rounded border-[#cccccc] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 active:border-blue-600"
              value={formData.subadmin_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subadmin_type: e.target.value,
                })
              }
            >
              <option value="">Select Type</option>
              <option value="consultant_sub">Consultant</option>
              <option value="crm_sub">CRM </option>
            </select>
          </div>
        )}

        {/* Permissions */}
        {(formType === "SUBADMIN" || formType === "CONSULTANT") && (
          <div className="space-y-2 ">
            <label className="block font-medium">Permissions</label>
            <div className="flex gap-4 flex-wrap">
              <label>
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={formData.permissions.reassign}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permissions: {
                        ...formData.permissions,
                        reassign: e.target.checked,
                      },
                    })
                  }
                />
                Reassign
              </label>
              {formType === "SUBADMIN" && (
                <label>
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={formData.permissions.approve_call}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          approve_call: e.target.checked,
                        },
                      })
                    }
                  />
                  Approve Add Call Request
                </label>
              )}

              {formType === "SUBADMIN" && (
                <label>
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={formData.permissions.loop_tagging}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          loop_tagging: e.target.checked,
                        },
                      })
                    }
                  />
                  Loop Tagging
                </label>
              )}

              {formType === "SUBADMIN" && (
                <label>
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={formData.permissions.comment_received}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          comment_received: e.target.checked,
                        },
                      })
                    }
                  />
                  Comment Received
                </label>
              )}

              {formType === "SUBADMIN" && (
                <label>
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={formData.permissions.quote_shared}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          quote_shared: e.target.checked,
                        },
                      })
                    }
                  />
                  Quote Shared
                </label>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-[11px] flex items-center gap-1 cursor-pointer"
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating...":"Update"}
          </button>
        </div>
      </div>
    </motion.div>
    </motion.div>
  );
};

export default EditUser;
