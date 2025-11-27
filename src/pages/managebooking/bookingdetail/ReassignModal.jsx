import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";

const ReassignModal = ({ show, onClose, comment, setComment, onSubmit,isReassigning }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">Request for Reassign</h2>

            <form  className="space-y-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add Comments"
                className="w-full border border-gray-300 rounded px-3 py-2 min-h-[100px]"
                required
              />
              <div className="flex justify-end">
                <button
                  type="button"
onClick={onSubmit}
                  className={`${isReassigning?"bg-blue-500 hover:bg-blue-600":"bg-blue-500 hover:bg-blue-600"} text-white px-2 rounded-md flex items-center space-x-2`}                >
                  <ArrowRight size={16} />
                  <span>{isReassigning ? "Reassigning...":"Reassign"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReassignModal;
