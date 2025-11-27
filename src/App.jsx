import { useEffect } from "react";
import "./App.css";
import "./index.css";
import AppRouter from "./routes/AppRouter";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./utils/idb.jsx";
import { Tooltip } from "react-tooltip";
import { initSocket } from "./utils/Socket.jsx";

function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      initSocket(user.id);
    }
  }, [user?.id]);

  return (
    <>
      <AppRouter />
      <Tooltip id="my-tooltip" />
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className: "border",
          duration: 3000,
          removeDelay: 500,
          style: {
            background: "#161616FF",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "green",
              secondary: "black",
            },
          },
        }}
      />
    </>
  );
}

export default App;
