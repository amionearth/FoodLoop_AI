"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SellerNav from "@/components/SellerNav";
import { apiRequest } from "@/lib/api";
import { 
  Gift, Users, MapPin, CheckCircle, Clock, 
  ArrowRight, Plus, AlertCircle, X, ShieldCheck 
} from "lucide-react";

export default function SellerDonationsPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [matchesModalOfferId, setMatchesModalOfferId] = useState<string | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    batch_id: "",
    product_id: "",
    title: "Surplus Evening Meals",
    quantity: 30.0,
    unit: "Portions",
    notes: "Packed in compliant thermal carriers at 4°C.",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [offData, bData] = await Promise.all([
        apiRequest<any[]>("/donations/offers"),
        apiRequest<any[]>("/inventory"),
      ]);
      setOffers(offData);
      setBatches(bData);
      if (bData.length > 0 && !form.batch_id) {
        setForm((f) => ({
          ...f,
          batch_id: bData[0].id,
          product_id: bData[0].product_id,
          unit: bData[0].unit,
        }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load donation offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBatchSelect = (batchId: string) => {
    const matched = batches.find((b) => b.id === batchId);
    if (matched) {
      setForm({
        ...form,
        batch_id: batchId,
        product_id: matched.product_id,
        unit: matched.unit,
        quantity: Math.min(30, matched.quantity - matched.reserved_quantity),
      });
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await apiRequest("/donations/offers", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          quantity: parseFloat(form.quantity as any) || 0,
        }),
      });
      setSuccess("Donation offer created and inventory reserved.");
      setShowOfferModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Offer creation failed");
    }
  };

  const viewMatches = async (offerId: string) => {
    setMatchesModalOfferId(offerId);
    setMatchesLoading(true);
    try {
      const data = await apiRequest<any[]>(`/donations/offers/${offerId}/matches`);
      setMatches(data);
    } catch (err: any) {
      alert("Failed to evaluate recipient matches: " + err.message);
    } finally {
      setMatchesLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SellerNav />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donation Offers & Recipient Matching</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create offers from verified surplus, view algorithmic matching scores, and coordinate multi-party allocations.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/map"
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition flex items-center space-x-1.5"
          >
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>View Road Routes</span>
          </Link>
          <button
            onClick={() => setShowOfferModal(true)}
            className="px-3 py-2 rounded-lg bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#2d6a4f] transition flex items-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Donation Offer</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Offers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Offer Code</th>
                <th className="py-3 px-4">Title / Item</th>
                <th className="py-3 px-4">Initial Qty</th>
                <th className="py-3 px-4">Remaining Qty</th>
                <th className="py-3 px-4">Storage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Intelligent Matching</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No active donation offers. Click "Create Donation Offer" to list verified surplus.
                  </td>
                </tr>
              ) : (
                offers.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">{o.offer_code}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900 block">{o.title}</span>
                      <span className="text-[11px] text-gray-500">{o.food_category}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {o.initial_quantity} {o.unit}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1b4332]">
                      {o.remaining_quantity} {o.unit}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[11px]">
                        {o.storage_method}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === "OFFERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : o.status === "PARTIALLY_ALLOCATED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => viewMatches(o.id)}
                        className="px-3 py-1 rounded bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold transition inline-flex items-center space-x-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Find Matching Recipients</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intelligent Matching Modal */}
      {matchesModalOfferId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Intelligent Recipient Matching Results</h3>
                <p className="text-xs text-gray-500">
                  Scored via multi-criteria algorithm: category compatibility, storage capabilities, capacity limits, and travel proximity.
                </p>
              </div>
              <button onClick={() => setMatchesModalOfferId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {matchesLoading ? (
              <div className="py-8 text-center text-xs text-gray-500">Evaluating candidate recipients...</div>
            ) : matches.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No registered recipients match the category and storage requirements of this offer within delivery range.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {matches.map((m) => (
                  <div key={m.recipient_id} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{m.org_name}</h4>
                        <p className="text-xs text-gray-500">{m.org_type} • {m.address}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#1b4332] font-bold text-xs">
                          Match Score: {m.match_score} / 100
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                          {m.distance_km} km • ~{m.estimated_travel_minutes} mins travel
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-700 bg-white p-2.5 rounded border border-gray-100 space-y-1">
                      <p className="font-semibold text-emerald-900">Algorithmic Recommendation Reason:</p>
                      <p className="text-[11px] leading-relaxed text-gray-600">{m.match_explanation}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                      <span>Available Daily Intake: <strong>{m.daily_capacity_meals} meals</strong></span>
                      <span className="font-semibold text-emerald-700">Verification: {m.verification_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Create Donation Offer</h3>
              <button onClick={() => setShowOfferModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Inventory Batch</label>
                <select
                  required
                  value={form.batch_id}
                  onChange={(e) => handleBatchSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.batch_number} - {b.product_name} ({b.quantity - b.reserved_quantity} {b.unit} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Offer Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Offer Quantity ({form.unit})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Packaging & Pickup Instructions</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Thermal packaging, pickup gate, or loading dock details"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1b4332] text-white font-semibold hover:bg-[#2d6a4f]"
                >
                  Lock Stock & Publish Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
