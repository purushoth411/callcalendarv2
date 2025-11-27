import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const SetAsConvertedModal = ({ isOpen, onClose, onConvert, isSubmitting }) => {
  const [rcCode, setRcCode] = useState("");
  const [projectId, setProjectId] = useState("");

  const handleSubmit = () => {
    onConvert(rcCode, projectId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-4">Set as Converted</h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="RC Code"
                value={rcCode}
                onChange={(e) => setRcCode(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-6 flex justify-end space-x-2">
             
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-2 py-1 bg-green-600 text-white rounded hover:bg-green-600 transition flex ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit"}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" class="ms-1 lucide lucide-chevrons-right-icon lucide-chevrons-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 17 5-5-5-5"></path><path d="m13 17 5-5-5-5"></path></svg>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SetAsConvertedModal;
