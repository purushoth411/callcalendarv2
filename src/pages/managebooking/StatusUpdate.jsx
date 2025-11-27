import React, { useEffect, useState } from "react";
import {
  Activity,
  Clock,
  Pencil,
  Cog,
  CheckCircle,
  UserCheck,
  UserX,
  ArrowUpRightFromCircle,
  Lock,
  Mic,
} from "lucide-react";

const badgeMeta = {
  "Call Scheduled": {
    bg: "bg-slate-100",
    text: "text-slate-800",
    icon: <Activity size={13} />,
  },
  "Call Rescheduled": {
    bg: "bg-slate-100",
    text: "text-slate-800",
    icon: <Activity size={13} />,
  },
  "Consultant Assigned": {
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: <UserCheck size={13} />,
  },
  Pending: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    icon: <Clock size={13} />,
  },
  Accept: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: <CheckCircle size={13} />,
  },
  Accepted: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: <CheckCircle size={13} />,
  },
  Reject: {
    bg: "bg-rose-100",
    text: "text-rose-800",
    icon: <UserX size={13} />,
  },
  Rejected: {
    bg: "bg-rose-100",
    text: "text-rose-800",
    icon: <UserX size={13} />,
  },
  Completed: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: <CheckCircle size={13} />,
  },
  Converted: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: <ArrowUpRightFromCircle size={13} />,
  },
  Rescheduled: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    icon: <Clock size={13} />,
  },
  "Reassign Request": {
    bg: "bg-gray-100",
    text: "text-gray-800",
    icon: <Clock size={13} />,
  },
  "Client did not join": {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: <UserX size={13} />,
  },
  Cancelled: {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: <UserX size={13} />,
  },
  // Fallback
  _: { bg: "bg-gray-100", text: "text-gray-900", icon: <Activity size={13} /> },
};

const crmMeta = {
  Completed: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    icon: <UserCheck size={13} />,
  },
  "Not Join": {
    bg: "bg-rose-100",
    text: "text-rose-800",
    icon: <UserX size={13} />,
  },
};

const strikeout = (isDeleted) => (isDeleted ? "line-through opacity-60" : "");

function convertDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
const cutoffRecordingTime = 1749168000 * 1000;

const StatusUpdate = ({
  row,
  user,
  onCrmStatusChange,
  call_status_updation_pending = "",
  baseUrl = "/",
}) => {
  const admin_type = user?.fld_admin_type || "";
  const mainStatus =
    row.fld_call_request_sts === "Accept"
      ? "Accepted"
      : row.fld_call_request_sts === "Reject"
      ? "Rejected"
      : row.fld_call_request_sts;
  const isDeleted = row.delete_sts === "Yes";

  // Meta/color/icon detection
  const meta = badgeMeta[mainStatus] || badgeMeta["_"];
  // For CRM marking
  const crmCompleted = row.statusByCrm === "Completed";
  const crmNoShow = row.statusByCrm === "Not Join";
  const crmMetaToUse = crmCompleted
    ? crmMeta["Completed"]
    : crmNoShow
    ? crmMeta["Not Join"]
    : null;

  const canEditBooking =
    [
      "Pending",
      "Accept",
      "Reject",
      "Rescheduled",
      "Call Scheduled",
      "Call Rescheduled",
      "Client did not join",
    ].includes(row.fld_call_request_sts) && admin_type === "EXECUTIVE";

  const canShowOTP =
    admin_type === "EXECUTIVE" &&
    ["Accept", "Call Scheduled", "Call Rescheduled"].includes(
      row.fld_call_request_sts
    ) &&
    row.fld_call_confirmation_status !== "Call Confirmed by Client" &&
    row.fld_otp;

  const canScheduleCallExec =
    admin_type === "EXECUTIVE" &&
    ["Consultant Assigned", "Postponed"].includes(row.fld_call_request_sts);
  const canScheduleCallSubadmin =
    admin_type === "SUBADMIN" &&
    user?.fld_subadmin_type === "crm_sub" &&
    ["Consultant Assigned", "Postponed"].includes(row.fld_call_request_sts);

  const isConverted =
    row.fld_call_request_sts === "Completed" && row.fld_converted_sts === "Yes";
  const canConvertPresales =
    row.fld_call_request_sts === "Completed" &&
    row.fld_converted_sts === "No" &&
    row.fld_sale_type === "Presales";
  const isCancelled = row.fld_call_request_sts === "Cancelled";
  const isPresales = row.fld_sale_type === "Presales";
  const canCrmStatusDropdown =
    ["SUBADMIN", "EXECUTIVE"].includes(admin_type) &&
    !row.statusByCrm &&
    row.fld_call_request_sts === "Accept";

  const callAddedAt = new Date(row.fld_addedon).getTime();
  const showCallRecording =
    row.fld_call_request_sts === "Completed" &&
    callAddedAt > cutoffRecordingTime &&
    row.callRecordingSts;
  const callRecordingColor =
    row.callRecordingSts === "Call Recording Updated"
      ? "bg-green-100 text-green-800"
      : "bg-rose-100 text-rose-800";

  // Mocked mail status
  function getMailStatus() {
    return (
      <span className="block text-[12px] text-slate-500 mt-0.5">
        {/* You may use a badge here too */}
        <span className="inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 bg-orange-100 text-orange-800 rounded mr-1">
          <CheckCircle size={12} /> Mail Delivered
        </span>
        on {convertDate(new Date())} at{" "}
        {new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    );
  }

  return (
    <td className="n-cal-sts">
      {/* Main badge */}
      <span
        className={`inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] font-medium ${
          meta.bg
        } ${meta.text} ${strikeout(isDeleted)}`}
      >
        {meta.icon}
        {mainStatus}
      </span>

      {/* Edit Booking */}
      {canEditBooking && (
        <a
          className={`inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] ${
            meta.bg
          } ${meta.text} ${strikeout(isDeleted)} n-bdge`}
          href={`${baseUrl}schedulecall/${row.id}`}
          title="Edit Booking Timing"
        >
          <Pencil size={12} />
        </a>
      )}

      {/* Web Code/OTP */}
      {canShowOTP && (
        <span className="inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] bg-blue-100 text-blue-800 n-bdge">
          <Lock size={11} /> Web Code: {row.fld_otp}
        </span>
      )}

      {/* Schedule Call */}
      {(canScheduleCallExec || canScheduleCallSubadmin) && (
        <a
          className="inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] bg-blue-600 text-white"
          href={`${baseUrl}schedulecall/${row.id}`}
          title="Schedule Call"
        >
          <Clock size={12} /> Schedule Call
        </a>
      )}

      {/* Converted badge */}
      {isConverted && (
        <span className="inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] bg-green-100 text-green-800">
          <ArrowUpRightFromCircle size={12} /> Converted
        </span>
      )}

      {/* Convert pencil for presales */}
      {canConvertPresales && (
        <a
          className={`inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] ${
            meta.bg
          } ${meta.text} ${strikeout(isDeleted)} n-sts-slt`}
          href={`${baseUrl}admin/booking_detail/${row.id}/convert`}
          title="Set as Converted"
        >
          <Pencil size={12} />
        </a>
      )}

      {/* Cancelled actions */}
      {isCancelled && (
        <>
          <a
            className={`inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] ${
              meta.bg
            } ${meta.text} ${strikeout(isDeleted)} n-sts-slt`}
            href={`${baseUrl}admin/booking_detail/${row.id}`}
            title="Set as Converted"
          >
            <Cog size={12} />
          </a>
          {isPresales && (
            <a
              className={`inline-flex edit-sub-area  items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] ${
                meta.bg
              } ${meta.text} ${strikeout(isDeleted)} n-sts-slt cursor-pointer`}
              data-id={row.id}
              data-row={JSON.stringify(row)}
              title="Edit Subject Area"
            >
              <Pencil size={12} />
            </a>
          )}
        </>
      )}

      {/* Special Accept logic */}
      {row.fld_call_request_sts === "Accept" && (
        <>
          {/* Call status updation */}
          {call_status_updation_pending === "Call status updation pending" && (
            <span className="inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] bg-amber-100 text-amber-800">
              <Clock size={12} /> Call status updation pending
            </span>
          )}
          {/* Client confirmation */}
          {row.fld_call_confirmation_status ===
            "Call Confirmation Pending at Client End" && (
            <span className="inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] bg-blue-100 text-blue-800">
              <Clock size={12} /> {row.fld_call_confirmation_status}
            </span>
          )}
          {row.fld_call_confirmation_status === "Call Confirmed by Client" && (
            <span className="inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] bg-green-100 text-green-800">
              <CheckCircle size={12} /> {row.fld_call_confirmation_status}
            </span>
          )}
          {/* Mail status */}
          {row.fld_message_id ? getMailStatus() : null}
        </>
      )}

      {/* CRM status info */}
      {crmMetaToUse && (
        <span
          className={`inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] ${crmMetaToUse.bg} ${crmMetaToUse.text}`}
        >
          {crmMetaToUse.icon}
          CRM Marked As {crmCompleted ? "Completed" : "Client Did Not Join"}
        </span>
      )}

      {/* Call recording badge */}
      {showCallRecording && (
        <span
          className={`inline-flex items-center gap-1 py-[1px] px-[6px] ml-1 rounded text-[10px] ${callRecordingColor}`}
        >
          <Mic size={12} />
          {row.callRecordingSts}
        </span>
      )}

      {/* CRM Status Dropdown */}
      {canCrmStatusDropdown && (
        <select
          className={`ml-1 border border-gray-200 rounded-sm bg-gray-100 text-[10px] the_status statusByCrm${row.id}  px-1 `}
          style={{ width: "auto" }}
          onChange={(e) => onCrmStatusChange(row.id, e.target.value)}
          defaultValue=""
        >
          <option value="">Update Call Status</option>
          <option value="Completed">✔️ Completed</option>
          <option value="Not Join">❌ Client Did Not Join</option>
          <option value="Postponed">⏳ Postponed</option>
        </select>
      )}
    </td>
  );
};

export default StatusUpdate;
