import { useEffect, useState } from "react";
import api from "../lib/api";
import { Plus, Pencil, Trash2, X, Package, Loader2 } from "lucide-react";

interface Item {
  id: number;
  name: string;
  description: string;
  brand_id: number;
}

interface Brand {
  id: number;
  name: string;
}

const empty: Omit<Item, "id"> = { name: "", description: "", brand_id: 0 };

export default function Items() {
  const [rows, setRows] = useState<Item[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterBrand, setFilterBrand] = useState<number | "">("" );

  useEffect(() => {
    api.get("/brands").then((r) => setBrands(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = filterBrand ? { brand_id: filterBrand } : {};
    api.get("/items", { params }).then((r) => setRows(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [filterBrand]);

  function reload() {
    setLoading(true);
    const params = filterBrand ? { brand_id: filterBrand } : {};
    api.get("/items", { params }).then((r) => setRows(r.data)).catch(() => {}).finally(() => setLoading(false));
  }

  function openAdd() {
    setForm({ ...empty, brand_id: brands[0]?.id ?? 0 });
    setEditId(null);
    setModal(true);
  }

  function openEdit(item: Item) {
    setForm({ name: item.name, description: item.description, brand_id: item.brand_id });
    setEditId(item.id);
    setModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/items/${editId}`, form);
      } else {
        await api.post("/items", form);
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
    if (!confirm("Delete this item?")) return;
    try {
      await api.delete(`/items/${id}`);
      reload();
    } catch {
      /* handled by interceptor */
    }
  }

  const brandName = (id: number) => brands.find((b) => b.id === id)?.name ?? `#${id}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A]">Items</h1>
          <p className="text-sm text-[#64748B]">Manage items by brand</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#1D4ED8] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1E40AF] transition-colors cursor-pointer">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value ? Number(e.target.value) : "")}
          className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none bg-white cursor-pointer"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
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
            <Package size={32} className="mb-2" />
            <p className="text-sm">No items found. Add your first item.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">ID</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Name</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Description</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Brand</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, i) => (
                <tr key={item.id} className={`border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors ${i % 2 === 1 ? "bg-[#FAFBFC]" : ""}`}>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{item.id}</td>
                  <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{item.name}</td>
                  <td className="px-5 py-3 text-sm text-[#64748B] max-w-xs truncate">{item.description}</td>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{brandName(item.brand_id)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(item)} className="text-[#64748B] hover:text-[#1D4ED8] p-1 cursor-pointer"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-[#64748B] hover:text-red-500 p-1 ml-1 cursor-pointer"><Trash2 size={14} /></button>
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
              <h2 className="text-sm font-semibold text-[#0F172A]">{editId ? "Edit Item" : "Add Item"}</h2>
              <button onClick={() => setModal(false)} className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Brand</label>
                <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: Number(e.target.value) })} required className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none bg-white cursor-pointer">
                  <option value={0} disabled>Select brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
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
