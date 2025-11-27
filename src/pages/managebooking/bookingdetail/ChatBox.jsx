import { useState } from "react";
import { MessageCircle, Send, SendIcon } from "lucide-react";
import toast from "react-hot-toast";

const ChatBox = ({ bookingId, user, messageData, onSend,isMsgSending }) => {
  const [newMsg, setNewMsg] = useState("");
  const maxMessages = 5;

  const formatDateTime = (datetime) => {
    if (!datetime) return "";
    const date = new Date(datetime);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  

  const handleSend = () => {
    
   
       if (!newMsg || newMsg.trim() === "") {
    toast.error("Enter a message before sending");
    return;
  }if (messageData.length > maxMessages) {
    toast.error("Maximum message limit reached");
    return;
  }
   if (newMsg.trim() && messageData.length < maxMessages) {
      onSend(newMsg.trim(), bookingId);
      setNewMsg("");
    }
  };

  const isAllowedUser =
    user?.fld_admin_type === "SUBADMIN" ||
    user?.fld_admin_type === "CONSULTANT" ||
    user?.fld_admin_type === "EXECUTIVE";

  return (
    <div className="bg-white  border border-gray-200  rounded-md p-3 ">
      
      <h2 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-3 mb-3">
          <MessageCircle size={16} className="mr-2" />
          Chat
        </h2>

      <div className="max-h-64 overflow-y-auto space-y-4 bg-white px-2" id="messagebox">
        {messageData.length === 0 ? (
          <p className="text-red-700 text-[12px] bg-red-50 p-2 rounded">No messages yet.</p>
        ) : (
          messageData.map((msg, idx) => {
            const isSender = msg.fld_sender_id === user.id;

            return (
              <div
                key={idx}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[300px] px-2 py-2 rounded-lg text-sm  ${
                    isSender
                      ? "bg-blue-600 text-white rounded-br-none text-right"
                      : "bg-gray-50 border border-gray-400 text-gray-800 rounded-bl-none text-left"
                  }`}
                >
                  {!isSender && (
                    <div className="text-[12px] font-semibold text-orange-500 mb-1">
                      {msg.sender_name}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-[12px]">{msg.fld_message}</div>
                  <div className={`text-[9px] mt-2  ${
                  isSender
                      ? "text-right text-white"
                      : "text-left"
                  }`}>
                    {formatDateTime(msg.fld_addedon)}
                    {msg.fld_read_time && (
                      <div className="italic mt-1">
                        Read Time: {formatDateTime(msg.fld_read_time)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isAllowedUser && (
        <div className="mt-3 border-t pt-2 border-gray-300">
          {messageData.length < maxMessages ? (
            <div className="flex gap-2 items-end">
              <textarea
                rows={1}
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded p-1 px-2 text-[12px] resize "
              />
              <button
                onClick={handleSend}
                disabled={isMsgSending}
                className={`${isMsgSending? "bg-[#ff6800]" : "bg-[#ff6800]"} text-white px-3 py-1  rounded flex flex gap-1 items-center text-[11px]`}
              >
                {isMsgSending ?"Sending...":"Send"} <SendIcon className="mt-0.5" size={10}/>
              </button>
            </div>
          ) : (
            <div className="text-sm text-red-600">
              Total 5 messages can be shared
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBox;
