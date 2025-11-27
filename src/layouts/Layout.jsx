import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/Header"

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col text-[12px]">
      <Header />

      <main
        className="flex-1 flex flex-col overflow-y-auto"
        id="scroll-container"
      >
        <div className="flex-1 flex my-4">
          <div className=" max-w-[85rem] mx-auto flex-1 px-3 flex">
            <div className="bg-gray-100 p-4 flex-1 flex flex-col">
              <Outlet />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#224d680d] to-[#9fd4f6a3] text-[#092e46] px-4 py-2 flex items-center justify-center">
          <p className="text-[#092e46] mb-0">
            Copyright © {new Date().getFullYear()}{" "}
            <span className="font-semibold">Rapid Collaborate</span>. All Rights
            Reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
