"use client";

import { useEffect, useState } from "react";
import RecipientNav from "@/components/RecipientNav";
import { apiRequest } from "@/lib/api";
import { 
  Gift, Check, AlertCircle, Clock, 
  MapPin, ShieldAlert, ArrowRight, X 
} from "lucide-react";

export default function RecipientOffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [requestQty, setRequestQty] = useState<number>(20);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOffers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any[]>("/donations/offers");
      setOffers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load donation offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleAcceptOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;
    setError("");
    setSuccess("");
    setAccepting(true);

    try {
      const res = await apiRequest<any>(`/donations/offers/${selectedOffer.id}/accept`, {
        method: "POST",
        body: JSON.stringify({
          requested_quantity: parseFloat(requestQty as any) || 0,
        }),
      });
      setSuccess(`Accepted ${res.allocated_quantity} ${res.unit} of "${selectedOffer.title}". Allocation Code: ${res.allocation_code}`);
      setSelectedOffer(null);
      loadOffers();
    } catch (err: any) {
      setError(err.message || "Acceptance failed");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="space-y-6">
      <RecipientNav />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Available Surplus Donation Offers</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Real perishable food surplus offered by inspected local restaurants, caterers, and food businesses.
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            No active surplus donation offers available in your area right now.
          </div>
        ) : (
          offers.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {o.offer_code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {o.storage_method}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-gray-900">{o.title}</h3>
                <p className="text-xs text-gray-500">{o.food_category} • Donor: <strong>{o.business_name}</strong></p>

                <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Available:</span>
                    <span className="font-extrabold text-[#1b4332]">
                      {o.remaining_quantity} / {o.initial_quantity} {o.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Safe until:</span>
                    <span>{new Date(o.expiry_datetime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-600 flex items-start space-x-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <span>{o.pickup_address}</span>
                </div>
              </div>

              <div>
                <button
                  onClick={() => {
                    setSelectedOffer(o);
                    setRequestQty(Math.min(o.remaining_quantity, 25));
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Accept Donation Quantity</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Acceptance Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Accept Donation Allocation</h3>
              <button onClick={() => setSelectedOffer(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              You are claiming food from <strong>{selectedOffer.business_name}</strong>. You may accept full or partial portions up to the remaining quantity.
            </p>

            <form onSubmit={handleAcceptOffer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Quantity to Accept ({selectedOffer.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedOffer.remaining_quantity}
                  required
                  value={requestQty}
                  onChange={(e) => setRequestQty(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Remaining available: {selectedOffer.remaining_quantity} {selectedOffer.unit}
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedOffer(null)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={accepting}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  {accepting ? "Confirming Allocation..." : "Confirm Acceptance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
