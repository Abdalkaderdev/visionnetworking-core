import { useEffect, useState } from "react";
import api from "../lib/api";
import { Plus, Trash2, X, DollarSign, Loader2 } from "lucide-react";

interface Price {
  id: number;
  item_id: number;
  price: number;
  currency: string;
  created_at: string;
}

interface Item {
  id: number;
  name: string;
}

const empty = { item_id: 0, price: 0, currency: "USD" };

export default function Prices() {
  const [rows, setRows] = useState<Price[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [filterItem, setFilterItem] = useState<number | "">("" );

  useEffect(() => {
    api.get("/items").then((r) => setItems(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = filterItem ? { item_id: filterItem } : {};
    api.get("/prices", { params }).then((r) => setRows(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [filterItem]);

  function reload() {
    setLoading(true);
    const params = filterItem ? { item_id: filterItem } : {};
    api.get("/prices", { params }).then((r) => setRows(r.data)).catch(() => {}).finally(() => setLoading(false));
  }

  function openAdd() {
    setForm({ ...empty, item_id: items[0]?.id ?? 0 });
    setModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/prices", form);
      setModal(false);
      reload();
    } catch {
      /* handled by interceptor */
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this price entry?")) return;
    try {
      await api.delete(`/prices/${id}`);
      reload();
    } catch {
      /* handled by interceptor */
    }
  }

  const itemName = (id: number) => items.find((it) => it.id === id)?.name ?? `#${id}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A]">Prices</h1>
          <p className="text-sm text-[#64748B]">Manage price entries for items</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#1D4ED8] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1E40AF] transition-colors cursor-pointer">
          <Plus size={16} /> Add Price
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterItem}
          onChange={(e) => setFilterItem(e.target.value ? Number(e.target.value) : "")}
          className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none bg-white cursor-pointer"
        >
          <option value="">All Items</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>{it.name}</option>
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
            <DollarSign size={32} className="mb-2" />
            <p className="text-sm">No prices found. Add your first price entry.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">ID</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Item</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Price</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Currency</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Date</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.id} className={`border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors ${i % 2 === 1 ? "bg-[#FAFBFC]" : ""}`}>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{p.id}</td>
                  <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{itemName(p.item_id)}</td>
                  <td className="px-5 py-3 text-sm text-[#0F172A] font-medium">{p.price.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{p.currency}</td>
                  <td className="px-5 py-3 text-sm text-[#64748B]">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDelete(p.id)} className="text-[#64748B] hover:text-red-500 p-1 cursor-pointer"><Trash2 size={14} /></button>
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
              <h2 className="text-sm font-semibold text-[#0F172A]">Add Price</h2>
              <button onClick={() => setModal(false)} className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Item</label>
                <select value={form.item_id} onChange={(e) => setForm({ ...form, item_id: Number(e.target.value) })} required className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none bg-white cursor-pointer">
                  <option value={0} disabled>Select item</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Price</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} required className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Currency</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none bg-white cursor-pointer">
                  <option value="USD">USD</option>
                  <option value="IQD">IQD</option>
                  <option value="EUR">EUR</option>
                </select>
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
