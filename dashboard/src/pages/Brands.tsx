import { useEffect, useState } from "react";
import api from "../lib/api";
import { Plus, Pencil, Trash2, X, Tags, Loader2 } from "lucide-react";

interface Brand {
  id: number;
  name: string;
  company_id: number;
}

interface Company {
  id: number;
  name: string;
}

const empty: Omit<Brand, "id"> = { name: "", company_id: 0 };

export default function Brands() {
  const [rows, setRows] = useState<Brand[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCompany, setFilterCompany] = useState<number | "">("" );

  useEffect(() => {
    api.get("/companies").then((r) => setCompanies(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = filterCompany ? { company_id: filterCompany } : {};
    api.get("/brands", { params }).then((r) => setRows(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [filterCompany]);

  function reload() {
    setLoading(true);
    const params = filterCompany ? { company_id: filterCompany } : {};
    api.get("/brands", { params }).then((r) => setRows(r.data)).catch(() => {}).finally(() => setLoading(false));
  }

  function openAdd() {
    setForm({ ...empty, company_id: companies[0]?.id ?? 0 });
    setEditId(null);
    setModal(true);
  }

  function openEdit(b: Brand) {
    setForm({ name: b.name, company_id: b.company_id });
    setEditId(b.id);
    setModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/brands/${editId}`, form);
      } else {
        await api.post("/brands", form);
      }
      setModal(false);
      reload();
    } catch {
      /* handled by interceptor */
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this brand?")) return;
    try {
      await api.delete(`/brands/${id}`);
      reload();
    } catch {
      /* handled by interceptor */
    }
  }

  const companyName = (id: number) => companies.find((c) => c.id === id)?.name ?? `#${id}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A]">Brands</h1>
          <p className="text-sm text-[#64748B]">Manage brands by company</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#1D4ED8] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1E40AF] transition-colors cursor-pointer">
          <Plus size={16} /> Add Brand
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value ? Number(e.target.value) : "")}
          className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none bg-white cursor-pointer"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#94A3B8]">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
            <Tags size={32} className="mb-2" />
            <p className="text-sm">No brands found. Add your first brand.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">ID</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Name</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Company</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b, i) => (
                <tr key={b.id} className={`border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors ${i % 2 === 1 ? "bg-[#FAFBFC]" : ""}`}>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{b.id}</td>
                  <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{b.name}</td>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{companyName(b.company_id)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(b)} className="text-[#64748B] hover:text-[#1D4ED8] p-1 cursor-pointer"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(b.id)} className="text-[#64748B] hover:text-red-500 p-1 ml-1 cursor-pointer"><Trash2 size={14} /></button>
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
              <h2 className="text-sm font-semibold text-[#0F172A]">{editId ? "Edit Brand" : "Add Brand"}</h2>
              <button onClick={() => setModal(false)} className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Company</label>
                <select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: Number(e.target.value) })} required className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none bg-white cursor-pointer">
                  <option value={0} disabled>Select company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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
