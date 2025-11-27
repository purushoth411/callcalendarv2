import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, X } from "lucide-react";
import API_URL from "../../../utils/constants";

const ViewCommentModal = ({ user, bookingData }) => {
  const [showModal, setShowModal] = useState(false);

  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  return (
    <>
      {user.fld_admin_type === "SUPERADMIN" &&
        bookingData.fld_consultation_sts === "Completed" &&
        bookingData.fld_comment && (
          <button
            className="bg-yellow-600 hover:bg-yellow-700 text-[12px] text-white px-2 py-1 rounded flex items-center space-x-2 transition-colors cursor-pointer"
            onClick={handleOpen}
          >
            <Eye size={12} />
            <span>View Comments</span>
          </button>
        )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative z-50"
              initial={{ scale: 0.9, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()} // prevent closing on inner click
            >
              {/* Close Icon at Top Right */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
              >
                <X size={20} />
              </button>

              <h2 className="text-lg font-semibold mb-4">Consultation Completed Details</h2>
              <p className="text-sm text-gray-800 whitespace-pre-line mb-4">
                {bookingData.fld_comment}
              </p>

              {bookingData.fld_booking_call_file && (
                <video width="100%" height="240" controls className="mb-4">
                  <source
                    src={`${API_URL}/assets/upload_doc/${bookingData.fld_booking_call_file}`}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ViewCommentModal;
