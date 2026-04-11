import { useEffect, useState } from "react";
import api from "../lib/api";
import { MessageSquare, Loader2 } from "lucide-react";

interface Contact {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  message: string;
  created_at: string;
}

export default function Contacts() {
  const [rows, setRows] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/contacts").then((r) => setRows(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F172A]">Contact Submissions</h1>
        <p className="text-sm text-[#64748B]">View contact form submissions from the website</p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#94A3B8]">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
            <MessageSquare size={32} className="mb-2" />
            <p className="text-sm">No contact submissions yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">ID</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Name</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Company</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Phone</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Email</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Message</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.id} className={`border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors ${i % 2 === 1 ? "bg-[#FAFBFC]" : ""}`}>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{c.id}</td>
                  <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{c.name}</td>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{c.company}</td>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{c.phone}</td>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{c.email}</td>
                  <td className="px-5 py-3 text-sm text-[#64748B] max-w-xs truncate">{c.message}</td>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
