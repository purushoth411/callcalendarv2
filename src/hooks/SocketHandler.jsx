// SocketHandler.jsx
import { useEffect } from "react";
import { getSocket } from "../utils/Socket";
import { useAuth } from "../utils/idb";
import {
  createAttendanceListener,
  createUserStatusListener
} from "./SocketListeners";

export default function SocketHandler({ setAllUsers, otherSetters = [] }) {
  const { user,priceDiscoutUsernames  } = useAuth();
 
  useEffect(() => {
    if (!user?.id) return;
     const socket = getSocket();

    const attendanceHandler = createAttendanceListener(setAllUsers, otherSetters,priceDiscoutUsernames );
    const statusHandler = createUserStatusListener(setAllUsers, otherSetters,priceDiscoutUsernames );

    socket.on("updatedAttendance", attendanceHandler);
    socket.on("updatedUserStatus", statusHandler);

    return () => {
      socket.off("updatedAttendance", attendanceHandler);
      socket.off("updatedUserStatus", statusHandler);
    };
  }, [user?.id, setAllUsers, otherSetters]);

  return null;
}
