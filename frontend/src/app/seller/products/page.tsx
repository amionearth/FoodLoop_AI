"use client";

import { useEffect, useState } from "react";
import SellerNav from "@/components/SellerNav";
import { apiRequest } from "@/lib/api";
import { Plus, ShoppingBag, Check, X, AlertCircle } from "lucide-react";

const ALLOWED_UNITS = ["Portions", "Meals", "Kg", "Grams", "Litres", "Boxes", "Packs", "Pieces"];

export default function SellerProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "Prepared Meals",
    unit: "Portions",
    unit_price: 100.0,
    active: true,
    description: "",
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any[]>("/products");
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          unit_price: parseFloat(form.unit_price as any) || 0,
        }),
      });
      setSuccess(`Product "${form.name}" created successfully.`);
      setShowModal(false);
      setForm({
        name: "",
        category: "Prepared Meals",
        unit: "Portions",
        unit_price: 100.0,
        active: true,
        description: "",
      });
      loadProducts();
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    }
  };

  return (
    <div className="space-y-6">
      <SellerNav />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Catalogue</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Standardized menu items with strict units of measurement to prevent incompatible conversions.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-2 rounded-lg bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#2d6a4f] transition flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit of Measure</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No products in catalogue yet. Click "Add New Product" to start.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-semibold text-gray-900">{p.name}</td>
                    <td className="py-3 px-4 text-gray-600">{p.category}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px]">
                        {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">₹{p.unit_price?.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Add Catalogue Product</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Paneer Butter Masala Thali"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="Prepared Meals">Prepared Meals</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Unit of Measurement</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {ALLOWED_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Unit Sales Price (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description / Ingredients (Optional)</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Notes on ingredients or packaging"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
