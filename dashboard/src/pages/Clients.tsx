import { useEffect, useState } from "react";
import api from "../lib/api";
import { Plus, Pencil, X, Users, Loader2 } from "lucide-react";

interface Client {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
}

const empty: Omit<Client, "id"> = { name: "", company: "", phone: "", email: "", city: "" };

export default function Clients() {
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/clients").then((r) => setRows(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  function openAdd() {
    setForm(empty);
    setEditId(null);
    setModal(true);
  }

  function openEdit(c: Client) {
    setForm({ name: c.name, company: c.company, phone: c.phone, email: c.email, city: c.city });
    setEditId(c.id);
    setModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/clients/${editId}`, form);
      } else {
        await api.post("/clients", form);
      }
      setModal(false);
      load();
    } catch {
      /* handled by interceptor */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A]">Clients</h1>
          <p className="text-sm text-[#64748B]">Manage your client database</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#1D4ED8] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1E40AF] transition-colors cursor-pointer">
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#94A3B8]">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
            <Users size={32} className="mb-2" />
            <p className="text-sm">No clients yet. Add your first client.</p>
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
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">City</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Actions</th>
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
                  <td className="px-5 py-3 text-sm text-[#64748B]">{c.city}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(c)} className="text-[#64748B] hover:text-[#1D4ED8] p-1 cursor-pointer"><Pencil size={14} /></button>
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
              <h2 className="text-sm font-semibold text-[#0F172A]">{editId ? "Edit Client" : "Add Client"}</h2>
              <button onClick={() => setModal(false)} className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Company</label>
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] disabled:opacity-50 cursor-pointer">
                  {saving ? "Saving..." : editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
