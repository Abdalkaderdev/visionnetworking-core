import { useEffect, useState } from "react";
import api from "../lib/api";
import { Plus, X, ClipboardList, Loader2, ChevronDown } from "lucide-react";

interface Boq {
  id: number;
  client_id: number;
  status: string;
  notes: string;
  created_at: string;
}

interface Client {
  id: number;
  name: string;
}

const STATUSES = ["draft", "processing", "pending", "approved", "rejected", "connected"] as const;

const statusStyle: Record<string, string> = {
  draft: "bg-gray-50 text-gray-600",
  processing: "bg-blue-50 text-blue-600",
  pending: "bg-yellow-50 text-yellow-600",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
  connected: "bg-purple-50 text-purple-600",
};

const empty = { client_id: 0, notes: "" };

export default function Boqs() {
  const [rows, setRows] = useState<Boq[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState<number | null>(null);

  useEffect(() => {
    api.get("/clients").then((r) => setClients(r.data)).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    api.get("/boqs").then((r) => setRows(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  function openAdd() {
    setForm({ ...empty, client_id: clients[0]?.id ?? 0 });
    setModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/boqs", form);
      setModal(false);
      load();
    } catch {
      /* handled by interceptor */
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await api.patch(`/boqs/${id}/status`, { status });
      setStatusDropdown(null);
      load();
    } catch {
      /* handled by interceptor */
    }
  }

  const clientName = (id: number) => clients.find((c) => c.id === id)?.name ?? `#${id}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A]">BOQs</h1>
          <p className="text-sm text-[#64748B]">Manage bills of quantities and their statuses</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#1D4ED8] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1E40AF] transition-colors cursor-pointer">
          <Plus size={16} /> Add BOQ
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#94A3B8]">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
            <ClipboardList size={32} className="mb-2" />
            <p className="text-sm">No BOQs yet. Create your first BOQ.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">ID</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Client</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Status</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Notes</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Date</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b, i) => (
                <tr key={b.id} className={`border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors ${i % 2 === 1 ? "bg-[#FAFBFC]" : ""}`}>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{b.id}</td>
                  <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{clientName(b.client_id)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[b.status] ?? "bg-gray-50 text-gray-600"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-[#64748B] max-w-xs truncate">{b.notes}</td>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3 text-right relative">
                    <button
                      onClick={() => setStatusDropdown(statusDropdown === b.id ? null : b.id)}
                      className="inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#1D4ED8] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 cursor-pointer"
                    >
                      Change <ChevronDown size={12} />
                    </button>
                    {statusDropdown === b.id && (
                      <div className="absolute right-5 top-full mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(b.id, s)}
                            className={`block w-full text-left text-xs px-3 py-1.5 hover:bg-[#F8FAFC] cursor-pointer ${b.status === s ? "font-semibold text-[#1D4ED8]" : "text-[#64748B]"}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-semibold text-[#0F172A]">Add BOQ</h2>
              <button onClick={() => setModal(false)} className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Client</label>
                <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })} required className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none bg-white cursor-pointer">
                  <option value={0} disabled>Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] disabled:opacity-50 cursor-pointer">
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
