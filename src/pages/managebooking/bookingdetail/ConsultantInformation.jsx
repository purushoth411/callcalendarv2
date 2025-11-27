import React from "react";
import { User, Mail } from "lucide-react"; // Assuming you're using lucide-react icons

const ConsultantInformation = ({ bookingData, user, bgColor }) => {
  const isSuperAdminOrExecutive =
    user?.fld_admin_type === "SUPERADMIN" ||
    user?.fld_admin_type === "EXECUTIVE";

  return (
    <>
      
      {/* Consultant Information */}
      {isSuperAdminOrExecutive && bookingData.fld_call_related_to != "I_am_not_sure" && (
        <div
          className="p-3 rounded bg-[#f1efff] border border-gray-200"
          style={{ backgroundColor: bgColor }}
        >
          <h5 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-3 mb-3">
            Consultant Information
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <User size={14} className="mt-0.5" />
              <div>
                <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                  Consultant Id
                </div>
                <p className="text-gray-900">
                  {bookingData?.consultant_client_code || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User size={14} className="mt-0.5" />
              <div>
                <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                  Name
                </div>
                <p className="text-gray-900">
                  {bookingData?.consultant_name || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail size={14} className="mt-0.5" />
              <div>
                <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                  Email
                </div>
                <p className="text-gray-900">
                  {bookingData?.consultant_email || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Consultant Information */}
      {isSuperAdminOrExecutive &&
        bookingData?.fld_secondary_consultant_id > 0 && (
          <div
            className="p-3 rounded-lg bg-[#f1efff] border border-gray-200"
             style={{ backgroundColor: bgColor }}
          >
            <h5 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-3 mb-3">
              Secondary Consultant Information
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <User size={14} className="mt-0.5" />
                <div>
                  <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                    Consultant Id
                  </div>
                  <p className="text-gray-900">
                    {bookingData?.sec_consultant_client_code || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User size={14} className="mt-0.5" />
                <div>
                  <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                    Name
                  </div>
                  <p className="text-gray-900">
                    {bookingData?.sec_consultant_name || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={14} className="mt-0.5" />
                <div>
                  <div className="text-[12px] font-semibold text-gray-700 !mb-2">
                    Email
                  </div>
                  <p className="text-gray-900">
                    {bookingData?.sec_consultant_email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
    </>
  );
};

export default ConsultantInformation;
