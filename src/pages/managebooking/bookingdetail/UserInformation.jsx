import { User } from "lucide-react";
import React from "react";

const UserInformation = ({ data, user, bgColor,externalCallInfo}) => {
  const isConsultant = user.fld_admin_type === "CONSULTANT";

  const formatText = (text) =>
    text?.replace(/_/g, " ")?.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
    <div className="grid grid-cols-1 gap-4">
    <div className="p-3 rounded bg-[#f1efff] border border-gray-200"  style={{ backgroundColor: bgColor }}>
      <h5 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-3 mb-3">User Information</h5>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Code / Ref Id */}
        <div className="flex items-start gap-2">
          <i className="fa fa-user mt-1" aria-hidden="true"></i>
          <div>
            <div className="text-[12px] font-semibold text-gray-700 !mb-2">
              {data.fld_sale_type === "Presales" ? "Instacrm Ref Id" : "Client Code"}
            </div>
            <p className="text-gray-900">
              {data.fld_client_id}
            </p>
          </div>
        </div>
        

        {/* Name */}
        <div className="flex items-start gap-2">
          <i className="fa fa-user mt-1" aria-hidden="true"></i>
          <div>
            <div className="text-[12px] font-semibold text-gray-700 !mb-2">
              Name
            </div>
            <p className="text-gray-900">
              {data.user_name}
            </p>
          </div>
        </div>
        

        {/* Email & Phone - only for non-consultants */}
        {!isConsultant && (
          <>
            
            <div className="flex items-start gap-2">
              <i className="fa fa-envelope-o mt-1" aria-hidden="true"></i>
              <div>
                <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                  Email
                </div>
                <p className="text-gray-900">
                  {data.user_email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <i className="fa fa-phone mt-1" aria-hidden="true"></i>
              <div>
                <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                  Phone
                </div>
                <p className="text-gray-900">
                  {data.user_phone}
                </p>
              </div>
            </div>
            

          </>
        )}

        {/* Sale Type */}
        <div className="flex items-start gap-2">
          <i className="fa fa-key mt-1" aria-hidden="true"></i>
          <div>
            <div className="text-[12px] font-semibold text-gray-700 !mb-2">
              Call Type
            </div>
            <p className="text-gray-900">
              {data.fld_sale_type}
            </p>
          </div>
        </div>
        

        {/* Topic of Research */}
        <div className="flex items-start gap-2">
          <i className="fa fa-key mt-1" aria-hidden="true"></i>
          <div>
            <div className="text-[12px] font-semibold text-gray-700 !mb-2">
              Topic of Research
            </div>
            <p className="text-gray-900 break-all">
              {data.fld_topic_of_research}
            </p>
          </div>
        </div>
        

        {/* Call Regarding */}
        <div className="flex items-start gap-2">
          <i className="fa fa-key mt-1" aria-hidden="true"></i>
          <div>
            <div className="text-[12px] font-semibold text-gray-700 !mb-2">
              Call Regarding
            </div>
            <p className="text-gray-900">
              {data.fld_call_regarding}
            </p>
          </div>
        </div>
        
        {/* Call Joining Link */}
        <div className="flex items-start gap-2">
          <i className="fa fa-key mt-1" aria-hidden="true"></i>
          <div className="truncate ">
            <div className="text-[12px] font-semibold text-gray-700 !mb-2">
              Call Joining Link
            </div>
            <p className="text-gray-900 truncate w-full">
              {["NA", "na"].includes(data.fld_call_joining_link) ? (
                data.fld_call_joining_link
              ) : (
                <a title={data.fld_call_joining_link} href={data.fld_call_joining_link} target="_blank" rel="noreferrer" className="text-blue-600 underline ">
                  {data.fld_call_joining_link}
                </a>
              )}
            </p>
          </div>
        </div>
        

        {/* Duration */}
        {data.fld_durations && (
          <div className="flex items-start gap-2">
            <i className="fa fa-clock-o mt-1" aria-hidden="true"></i>
            <div>
              <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                Duration
              </div>
              <p className="text-gray-900">
                {data.fld_durations}
              </p>
            </div>
          </div>
        )}

        {/* Call Type */}
        {data.fld_call_type && (
          <div className="flex items-start gap-2">
            <i className="fa fa-key mt-1" aria-hidden="true"></i>
            <div>
              <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                Call Type
              </div>
              <p className="text-gray-900">
                {data.fld_call_type}
              </p>
            </div>
          </div>
          
        )}

        {/* Call Related To */}
        {data.fld_call_related_to && (
          <div className="flex items-start gap-2">
            <i className="fa fa-key mt-1" aria-hidden="true"></i>
            <div>
              <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                Call Related To
              </div>
              <p className="text-gray-900">
                {data.fld_call_related_to}
              </p>
            </div>
          </div>
          
        )}

        {/* Consultant Sub Option */}
        {data.fld_consultant_another_option && (
          <div className="flex items-start gap-2">
            <i className="fa fa-key mt-1" aria-hidden="true"></i>
            <div>
              <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                Consultant Sub Option
              </div>
              <p className="text-gray-900">
                {data.fld_consultant_another_option === "TEAM"
                ? "Assign Call to Team Member"
                : `Assign Call to Consultant`}
              </p>
            </div>
          </div>
          
        )}

        {/* Asana Link */}
        {data.fld_asana_link && (
          <div className="flex items-start gap-2">
            <i className="fa fa-link mt-1" aria-hidden="true"></i>
            <div className="truncate ">
              <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                Asana Link / Quote Id
              </div>
              <p className="text-gray-900 truncate w-full">
                {data.fld_asana_link}
              </p>
            </div>
          </div>
          
        )}

        {/* Subject Area */}
        {data.fld_subject_area && (
          <div className="flex items-start gap-2">
            <i className="fa fa-book mt-1" aria-hidden="true"></i>
            <div>
              <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                Subject Area
              </div>
              <p className="text-gray-900">
                {data.fld_subject_area}
              </p>
            </div>
          </div>
          
          
        )}

        {/* RC Project Id */}
        {data.fld_rc_projectid && (
          <div className="flex items-start gap-2">
            <i className="fa fa-key mt-1" aria-hidden="true"></i>
            <div>
              <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                RC Project Id
              </div>
              <p className="text-gray-900">
                {data.fld_rc_projectid}
              </p>
            </div>
          </div>
          
        )}

        {/* RC Milestone Name */}
        {data.fld_rc_milestone_name && (
          <div className="flex items-start gap-2">
            <i className="fa fa-flag mt-1" aria-hidden="true"></i>
            <div>
              <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                RC Milestone Name
              </div>
              <p className="text-gray-900">
                {data.fld_rc_milestone_name}
              </p>
            </div>
          </div>
          
        )}
        {/* Internal Comments */}
        {data.fld_internal_comments && (
          <div className="flex items-start gap-2 col-span-3">
            <i className="fa fa-comment mt-1" aria-hidden="true"></i>
            <div>
              <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                Internal Comments
              </div>
              <p className="text-gray-900">
                {data.fld_internal_comments}
              </p>
            </div>
          </div>
          
        )}
      </div>

      
    </div>



{/* Booking Information */}
{data.fld_booking_date && data.fld_booking_slot && (
  <div className={`p-3 rounded bg-[#f1efff] border border-gray-200`} style={{ backgroundColor: bgColor }} 

  >
    <h5 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-3 mb-3">Booking Information</h5>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* Booking Date & Slot */}
      <div className="flex items-start gap-2">
          <i className="fa fa-calendar mt-1" aria-hidden="true"></i>
          <div>
            <div className="text-[12px] font-semibold text-gray-700 !mb-2">
              Booking Date & Time
            </div>
            <p className="text-gray-900">
              {new Date(`${data.fld_booking_date} ${data.fld_booking_slot}`).toLocaleString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
            </p>
          </div>
        </div>
     

      {/* No. of Hours for Call */}
      {/* <div className="flex items-start gap-2">
        <i className="fa fa-clock-o mt-1" aria-hidden="true"></i>
        <div>
          <div className="text-[12px] font-semibold text-gray-700 !mb-2">
            No. of Hours for Call
          </div>
          <p className="text-gray-900">
            {data.fld_no_of_hours_for_call}
          </p>
        </div>
      </div>
       */}

      {/* Timezone */}
      <div className="flex items-start gap-2">
        <i className="fa fa-clock-o mt-1" aria-hidden="true"></i>
        <div>
          <div className="text-[12px] font-semibold text-gray-700 !mb-2">
            Timezone
          </div>
          <p className="text-gray-900">
            {data.fld_timezone}
          </p>
        </div>
      </div>
      

      {/* Booking ID */}
      <div className="flex items-start gap-2">
        <i className="fa fa-list mt-1" aria-hidden="true"></i>
        <div>
          <div className="text-[12px] font-semibold text-gray-700 !mb-2">
            Booking ID
          </div>
          <p className="text-gray-900">
            {data.fld_bookingcode}
          </p>
        </div>
      </div>
      

      {/* Current Status */}
      <div className="flex items-start gap-2">
        <i className="fa fa-list mt-1" aria-hidden="true"></i>
        <div>
          <div className="text-[12px] font-semibold text-gray-700 !mb-2">
            Current Status
          </div>
          <p className="text-gray-900">
            {data.fld_call_request_sts === "Accept"
            ? "Accepted"
            : data.fld_call_request_sts === "Reject"
            ? "Rejected"
            : data.fld_call_request_sts}
          </p>
        </div>
      </div>
      

      {/* Client Status Details */}
      {data.fld_call_confirmation_status && (
        <div className="flex items-start gap-2">
        <i className="fa fa-key mt-1" aria-hidden="true"></i>
        <div>
          <div className="text-[12px] font-semibold text-gray-700 !mb-2">
            Client Status Details
          </div>
          <p className="text-gray-900">
            {data.fld_call_confirmation_status}
          </p>
        </div>
      </div>
        
      )}

      {/* Consultant Name */}
      {externalCallInfo?.fld_consultant_name && (
        <div className="flex items-start gap-2">
        <i className="fa fa-user mt-1" aria-hidden="true"></i>
        <div>
          <div className="text-[12px] font-semibold text-gray-700 !mb-2">
            Consultant Name
          </div>
          <p className="text-gray-900">
            {externalCallInfo.fld_consultant_name}
          </p>
        </div>
      </div>
      )}
    </div>
  </div>
)}
</div>
</>

    
  );
};

export default UserInformation;
