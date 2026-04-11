import { useEffect, useState } from "react";
import api from "../lib/api";
import { Building2, Tags, Users, ClipboardList, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Stats {
  buildings: number;
  brands: number;
  clients: number;
  boqs: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ buildings: 0, brands: 0, clients: 0, boqs: 0 });
  const [recentBoqs, setRecentBoqs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/buildings"),
      api.get("/brands"),
      api.get("/clients"),
      api.get("/boqs"),
      api.get("/contacts"),
    ]).then(([b, br, c, bq, ct]) => {
      setStats({
        buildings: b.data.length,
        brands: br.data.length,
        clients: c.data.length,
        boqs: bq.data.length,
      });
      setRecentBoqs(bq.data.slice(0, 5));
      setContacts(ct.data.slice(0, 5));
    }).catch(() => {});
  }, []);

  const cards = [
    { label: "Buildings", value: stats.buildings, icon: Building2, to: "/buildings", color: "bg-blue-50 text-blue-600" },
    { label: "Brands", value: stats.brands, icon: Tags, to: "/brands", color: "bg-purple-50 text-purple-600" },
    { label: "Clients", value: stats.clients, icon: Users, to: "/clients", color: "bg-green-50 text-green-600" },
    { label: "BOQs", value: stats.boqs, icon: ClipboardList, to: "/boqs", color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F172A]">Dashboard</h1>
        <p className="text-sm text-[#64748B]">Welcome to VisionNetworking internal system</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:shadow-sm transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.color}`}>
                <c.icon size={16} />
              </div>
              <ArrowUpRight size={14} className="text-[#CBD5E1]" />
            </div>
            <div className="text-2xl font-bold text-[#0F172A]">{c.value}</div>
            <div className="text-xs text-[#94A3B8] mt-0.5">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Recent BOQs */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0F172A]">Recent BOQs</h2>
            <Link to="/boqs" className="text-xs text-[#1D4ED8] font-medium cursor-pointer">View all</Link>
          </div>
          {recentBoqs.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">No BOQs yet. Create your first one.</p>
          ) : (
            <div className="space-y-2">
              {recentBoqs.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                  <div>
                    <span className="text-sm font-medium text-[#0F172A]">BOQ #{b.id}</span>
                    <span className="text-xs text-[#94A3B8] ml-2">Client #{b.client_id}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    b.status === "approved" ? "bg-green-50 text-green-600" :
                    b.status === "pending" ? "bg-yellow-50 text-yellow-600" :
                    b.status === "processing" ? "bg-blue-50 text-blue-600" :
                    "bg-gray-50 text-gray-600"
                  }`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Contacts */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0F172A]">Contact Submissions</h2>
            <Link to="/contacts" className="text-xs text-[#1D4ED8] font-medium cursor-pointer">View all</Link>
          </div>
          {contacts.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">No contact submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {contacts.map((c: any) => (
                <div key={c.id} className="py-2 border-b border-[#F1F5F9] last:border-0">
                  <div className="text-sm font-medium text-[#0F172A]">{c.name}</div>
                  <div className="text-xs text-[#94A3B8]">{c.email || c.phone} &middot; {c.company}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
