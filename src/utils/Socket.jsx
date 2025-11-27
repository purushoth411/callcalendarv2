// socket.jsx
import { io } from "socket.io-client";
import API_URL from "./constants";

let socket;
let currentUserId = null;

// Initialize or return existing socket
export const initSocket = (userId) => {
  if (!socket) {
    socket = io(`${API_URL}`, {
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      if (userId) {
        socket.emit("registerUser", userId);
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn("❌ Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("🚫 Socket connection error:", err.message);
    });
  } else if (userId && userId !== currentUserId) {
    // If userId changed, update registration
    socket.emit("registerUser", userId);
  }

  currentUserId = userId;
  return socket;
};

// Always returns socket instance — if not initialized, initialize without userId
export const getSocket = () => {
  if (!socket) {
    // initialize socket without userId - you can later emit registerUser separately
    socket = io(`${API_URL}`);
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }
};
