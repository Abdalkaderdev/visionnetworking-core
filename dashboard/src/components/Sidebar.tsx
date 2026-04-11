import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList, FileText, Building2,
  Factory, Tags, Package, DollarSign, Users, MessageSquare,
  LogOut,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "BOQs", to: "/boqs", icon: ClipboardList },
  { label: "Quotations", to: "/quotations", icon: FileText },
  { divider: true },
  { label: "Buildings", to: "/buildings", icon: Building2 },
  { label: "Companies", to: "/companies", icon: Factory },
  { label: "Brands", to: "/brands", icon: Tags },
  { label: "Items", to: "/items", icon: Package },
  { label: "Prices", to: "/prices", icon: DollarSign },
  { divider: true },
  { label: "Clients", to: "/clients", icon: Users },
  { label: "Contacts", to: "/contacts", icon: MessageSquare },
];

export default function Sidebar() {
  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <aside className="w-[240px] h-screen bg-[#0F172A] flex flex-col fixed left-0 top-0 z-40">
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1D4ED8] flex items-center justify-center text-white text-[10px] font-bold">
            VN
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-tight">VisionNet</div>
            <div className="text-[#64748B] text-[10px]">Internal System</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {NAV.map((item, i) =>
          "divider" in item ? (
            <div key={i} className="h-px bg-white/5 my-2 mx-2" />
          ) : (
            <NavLink
              key={item.to}
              to={item.to!}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer mb-0.5 ${
                  isActive
                    ? "bg-[#1D4ED8]/10 text-[#60A5FA]"
                    : "text-[#94A3B8] hover:text-white hover:bg-white/5"
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      <div className="px-3 py-3 border-t border-white/5">
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#94A3B8] hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
