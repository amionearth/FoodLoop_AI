"use client";

import { useEffect, useState } from "react";
import SellerNav from "@/components/SellerNav";
import { apiRequest } from "@/lib/api";
import { Calculator, Check, AlertCircle, ArrowRight, HelpCircle, Save } from "lucide-react";

export default function SellerCashierPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [entry, setEntry] = useState({
    product_id: "",
    business_date: "",
    opening_stock: 100,
    stock_received: 10,
    units_sold: 70,
    cancelled_units: 2,
    refunded_units: 0,
    recorded_waste: 5,
    closing_stock: 33, // Physically counted
    unit: "Portions",
    selling_price: 120.0,
    promotion: false,
    notes: "",
  });

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setEntry((e) => ({ ...e, business_date: today }));

    apiRequest<any[]>("/products")
      .then((data) => {
        setProducts(data);
        if (data.length > 0) {
          setEntry((e) => ({
            ...e,
            business_date: today,
            product_id: data[0].id,
            unit: data[0].unit,
            selling_price: data[0].unit_price,
          }));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleProductChange = (pId: string) => {
    const matched = products.find((p) => p.id === pId);
    setEntry({
      ...entry,
      product_id: pId,
      unit: matched ? matched.unit : "Portions",
      selling_price: matched ? matched.unit_price : 0,
    });
  };

  // Real-time reconciliation calculation
  const netSales = Math.max(0, entry.units_sold - entry.cancelled_units - entry.refunded_units);
  const expectedClosing = entry.opening_stock + entry.stock_received - netSales - entry.recorded_waste;
  const discrepancy = entry.closing_stock - expectedClosing;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await apiRequest<any>("/sales/cashier", {
        method: "POST",
        body: JSON.stringify({
          ...entry,
          opening_stock: parseFloat(entry.opening_stock as any) || 0,
          stock_received: parseFloat(entry.stock_received as any) || 0,
          units_sold: parseFloat(entry.units_sold as any) || 0,
          cancelled_units: parseFloat(entry.cancelled_units as any) || 0,
          refunded_units: parseFloat(entry.refunded_units as any) || 0,
          recorded_waste: parseFloat(entry.recorded_waste as any) || 0,
          closing_stock: parseFloat(entry.closing_stock as any) || 0,
          selling_price: parseFloat(entry.selling_price as any) || 0,
        }),
      });

      setSuccess(
        `Daily sales record for ${entry.business_date} saved. Expected closing: ${res.expected_closing} ${entry.unit}, Discrepancy: ${res.discrepancy} ${entry.unit}.`
      );
    } catch (err: any) {
      setError(err.message || "Failed to save daily cashier reconciliation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SellerNav />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Universal Cashier & Daily Sales Entry</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          For small merchants and independent kitchens without an API POS. Reconciles physical count against cashier movements.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Product</label>
                <select
                  required
                  value={entry.product_id}
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

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Business Date</label>
                <input
                  type="date"
                  required
                  value={entry.business_date}
                  onChange={(e) => setEntry({ ...entry, business_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Opening Stock</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={entry.opening_stock}
                  onChange={(e) => setEntry({ ...entry, opening_stock: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Stock Received / Prep</label>
                <input
                  type="number"
                  min="0"
                  value={entry.stock_received}
                  onChange={(e) => setEntry({ ...entry, stock_received: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Gross Units Sold</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={entry.units_sold}
                  onChange={(e) => setEntry({ ...entry, units_sold: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Recorded Waste (Kitchen)</label>
                <input
                  type="number"
                  min="0"
                  value={entry.recorded_waste}
                  onChange={(e) => setEntry({ ...entry, recorded_waste: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Cancelled Orders</label>
                <input
                  type="number"
                  min="0"
                  value={entry.cancelled_units}
                  onChange={(e) => setEntry({ ...entry, cancelled_units: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Refunded Units</label>
                <input
                  type="number"
                  min="0"
                  value={entry.refunded_units}
                  onChange={(e) => setEntry({ ...entry, refunded_units: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-800 mb-1">Counted Closing Stock</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={entry.closing_stock}
                  onChange={(e) => setEntry({ ...entry, closing_stock: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border-2 border-emerald-500 rounded-lg text-sm font-bold bg-emerald-50/30"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Daily Operating Notes (Optional)</label>
              <textarea
                rows={2}
                value={entry.notes}
                onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
                placeholder="Weather, local events, or kitchen incidents affecting sales"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Reconciling and Saving..." : "Save Daily Cashier Reconciliation"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Reconciliation Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Calculator className="w-4 h-4 text-[#1b4332]" />
              <span>Live Reconciliation Math</span>
            </h3>

            <div className="space-y-2 text-xs border-y border-gray-100 py-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Opening Stock:</span>
                <span className="font-semibold">{entry.opening_stock} {entry.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">+ Stock Received:</span>
                <span className="font-semibold">+{entry.stock_received}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">- Net Units Sold:</span>
                <span className="font-semibold text-red-600">
                  -{netSales} (Gross {entry.units_sold} - Canc {entry.cancelled_units} - Ref {entry.refunded_units})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">- Recorded Waste:</span>
                <span className="font-semibold text-red-600">-{entry.recorded_waste}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-medium">Expected Closing:</span>
                <span className="text-base font-bold text-gray-900">{expectedClosing} {entry.unit}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-medium">Counted Physical Stock:</span>
                <span className="text-base font-bold text-gray-900">{entry.closing_stock} {entry.unit}</span>
              </div>
            </div>

            {/* Discrepancy Alert */}
            <div
              className={`p-3 rounded-lg border text-xs font-medium ${
                discrepancy === 0
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : discrepancy < 0
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-blue-50 border-blue-200 text-blue-900"
              }`}
            >
              <div className="flex items-center space-x-1.5 font-bold mb-1">
                {discrepancy === 0 ? (
                  <Check className="w-4 h-4 text-emerald-700" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>
                  {discrepancy === 0
                    ? "Perfect Reconciliation"
                    : `Discrepancy: ${discrepancy > 0 ? "+" : ""}${discrepancy} ${entry.unit}`}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {discrepancy === 0
                  ? "Physically counted stock perfectly matches calculated ledger movements."
                  : discrepancy < 0
                  ? "Physical count is lower than expected. Unrecorded kitchen loss, theft, or portion over-serving."
                  : "Physical count is higher than expected. Unrecorded batch production or cashier under-ringing."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
