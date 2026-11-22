"use client";

import { useEffect, useState } from "react";
import SellerNav from "@/components/SellerNav";
import { apiRequest } from "@/lib/api";
import { Plus, Boxes, History, Check, AlertCircle, X, ShieldCheck } from "lucide-react";

export default function SellerInventoryPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBatchMovements, setSelectedBatchMovements] = useState<any[] | null>(null);
  const [selectedBatchNumber, setSelectedBatchNumber] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    product_id: "",
    batch_number: "",
    quantity: 50.0,
    unit: "Portions",
    received_or_prep_time: "",
    expiry_datetime: "",
    storage_method: "CHILLED",
    storage_temp_c: 4.0,
    food_condition: "EXCELLENT",
    notes: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const expiry = new Date(Date.now() + 18 * 3600 * 1000);
      setForm((f) => ({
        ...f,
        received_or_prep_time: now.toISOString().slice(0, 16),
        expiry_datetime: expiry.toISOString().slice(0, 16),
      }));
      const [bData, pData] = await Promise.all([
        apiRequest<any[]>("/inventory"),
        apiRequest<any[]>("/products"),
      ]);
      setBatches(bData);
      setProducts(pData);
      if (pData.length > 0 && !form.product_id) {
        setForm((f) => ({ ...f, product_id: pData[0].id, unit: pData[0].unit }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductChange = (productId: string) => {
    const matched = products.find((p) => p.id === productId);
    setForm({
      ...form,
      product_id: productId,
      unit: matched ? matched.unit : "Portions",
    });
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await apiRequest("/inventory", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          batch_number: form.batch_number || `BATCH-${Date.now().toString().slice(-6)}`,
          quantity: parseFloat(form.quantity as any) || 0,
          storage_temp_c: parseFloat(form.storage_temp_c as any) || null,
          received_or_prep_time: new Date(form.received_or_prep_time).toISOString(),
          expiry_datetime: new Date(form.expiry_datetime).toISOString(),
        }),
      });
      setSuccess("Inventory batch checked in and recorded in movement ledger.");
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create batch");
    }
  };

  const viewMovements = async (batchId: string, batchNumber: string) => {
    try {
      const data = await apiRequest<any[]>(`/inventory/${batchId}/movements`);
      setSelectedBatchMovements(data);
      setSelectedBatchNumber(batchNumber);
    } catch (err: any) {
      alert("Failed to load batch ledger history: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <SellerNav />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management & Audit Ledger</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Physical batch tracking with immutable movement ledger (STOCK_IN, SALES, WASTE, DONATION_RESERVED).
          </p>
        </div>
        <button
          onClick={() => {
            setForm((f) => ({
              ...f,
              batch_number: `BATCH-${Date.now().toString().slice(-6)}`,
            }));
            setShowModal(true);
          }}
          className="px-3 py-2 rounded-lg bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#2d6a4f] transition flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Check In New Batch</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Available Qty</th>
                <th className="py-3 px-4">Reserved (Offers)</th>
                <th className="py-3 px-4">Storage Method</th>
                <th className="py-3 px-4">Food Condition</th>
                <th className="py-3 px-4">Use-by Date</th>
                <th className="py-3 px-4 text-right">Audit History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No active inventory batches. Click "Check In New Batch" to add fresh stock.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">{b.batch_number}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{b.product_name}</td>
                    <td className="py-3 px-4 font-bold text-[#1b4332]">
                      {b.quantity - b.reserved_quantity} {b.unit}
                    </td>
                    <td className="py-3 px-4 text-amber-700 font-semibold">
                      {b.reserved_quantity > 0 ? `${b.reserved_quantity} ${b.unit}` : "0"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[11px]">
                        {b.storage_method} {b.storage_temp_c ? `(${b.storage_temp_c}°C)` : ""}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {b.food_condition}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(b.expiry_datetime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => viewMovements(b.id, b.batch_number)}
                        className="px-2.5 py-1 rounded border border-gray-300 hover:bg-gray-100 font-semibold text-gray-700 transition inline-flex items-center space-x-1"
                      >
                        <History className="w-3.5 h-3.5 text-gray-500" />
                        <span>Ledger</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Ledger Modal */}
      {selectedBatchMovements && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Batch Movement Ledger</h3>
                <p className="text-xs text-gray-500">Audit trail for #{selectedBatchNumber}</p>
              </div>
              <button onClick={() => setSelectedBatchMovements(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {selectedBatchMovements.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-xs">No movements logged.</div>
              ) : (
                selectedBatchMovements.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-gray-900">{m.movement_type}</span>
                      <p className="text-[11px] text-gray-500">{m.reason || "Standard movement"}</p>
                      <p className="text-[10px] text-gray-400">{new Date(m.created_at).toLocaleString()}</p>
                    </div>
                    <span
                      className={`font-mono font-bold ${
                        m.quantity >= 0 ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Check In Batch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Check In Inventory Batch</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Product</label>
                <select
                  required
                  value={form.product_id}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={form.batch_number}
                    onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Physical Quantity ({form.unit})</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Prepared / Received</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.received_or_prep_time}
                    onChange={(e) => setForm({ ...form, received_or_prep_time: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Use-by Expiry Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.expiry_datetime}
                    onChange={(e) => setForm({ ...form, expiry_datetime: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Storage Method</label>
                  <select
                    value={form.storage_method}
                    onChange={(e) => setForm({ ...form, storage_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="AMBIENT">Ambient</option>
                    <option value="CHILLED">Chilled</option>
                    <option value="FROZEN">Frozen</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.storage_temp_c}
                    onChange={(e) => setForm({ ...form, storage_temp_c: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Food Sensory Condition</label>
                <select
                  value={form.food_condition}
                  onChange={(e) => setForm({ ...form, food_condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="EXCELLENT">Excellent (Freshly prepared, sealed)</option>
                  <option value="GOOD">Good (Safe, standard packaging)</option>
                  <option value="ACCEPTABLE">Acceptable (Safe for prompt consumption)</option>
                  <option value="SPOILED">Spoiled (Unfit for distribution)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1b4332] text-white font-semibold hover:bg-[#2d6a4f]"
                >
                  Record Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
