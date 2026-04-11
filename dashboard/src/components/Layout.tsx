import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 ml-[240px] p-6">
        <Outlet />
      </main>
    </div>
  );
}
