"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SellerNav from "@/components/SellerNav";
import { apiRequest } from "@/lib/api";
import { 
  AlertTriangle, ShieldCheck, Check, X, 
  Gift, ArrowRight, UserCheck, AlertCircle, Info 
} from "lucide-react";

export default function SellerSurplusPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewBatchId, setReviewBatchId] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState("Rohan Sharma");
  const [reviewReason, setReviewReason] = useState("Commercial chiller temperature logged at 4°C. Visual check passed.");
  const [reviewActionLoading, setReviewActionLoading] = useState(false);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any[]>("/surplus/predictions");
      setPredictions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load surplus predictions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  const handleSafetyReview = async (batchId: string, approved: boolean) => {
    setReviewActionLoading(true);
    try {
      await apiRequest(`/surplus/${batchId}/review`, {
        method: "POST",
        body: JSON.stringify({
          approved,
          reason: reviewReason,
          reviewer_name: reviewerName,
        }),
      });
      setReviewBatchId(null);
      loadPredictions();
    } catch (err: any) {
      alert("Safety review sign-off failed: " + err.message);
    } finally {
      setReviewActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SellerNav />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surplus Prediction & Food Safety Review</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Surplus = Net Available Stock - Predicted Demand. Food safety compliance requires mandatory human review.
          </p>
        </div>
        <Link
          href="/seller/donations"
          className="px-3 py-2 rounded-lg bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#2d6a4f] transition flex items-center space-x-1.5 shadow-xs"
        >
          <Gift className="w-4 h-4" />
          <span>Go to Donation Offers</span>
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Safety Compliance Alert */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold">Human Verification Required by Law & Protocol</h4>
          <p className="leading-relaxed">
            FOODLOOP AI isolates statistical surplus, but <strong>never</strong> independently certifies food as safe to consume. An authorized food safety officer must verify cold-chain storage and sensory condition before an offer is made active.
          </p>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Forecast Demand</th>
                <th className="py-3 px-4">Potential Surplus</th>
                <th className="py-3 px-4">Safety Status</th>
                <th className="py-3 px-4">Human Approval</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {predictions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No batches evaluated yet. Ensure you have products and active inventory batches.
                  </td>
                </tr>
              ) : (
                predictions.map((p) => {
                  const isApproved = p.review_status === "APPROVED";
                  const isExpired = p.review_status === "EXPIRED";
                  const isRejected = p.review_status === "REJECTED";

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-mono font-medium text-gray-900">{p.batch_number}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{p.product_name}</td>
                      <td className="py-3 px-4 font-medium text-gray-700">
                        {p.available_quantity} {p.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">
                        {p.predicted_demand} {p.unit}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#1b4332] text-sm">
                        {p.potential_surplus} {p.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : isExpired || isRejected
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {p.review_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {p.human_approved ? (
                          <span className="flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                            <Check className="w-3.5 h-3.5" />
                            <span>Signed Off</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">Pending Inspection</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {!isApproved && !isExpired && (
                          <button
                            onClick={() => setReviewBatchId(p.batch_id)}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold transition"
                          >
                            Review & Sign-Off
                          </button>
                        )}
                        {isApproved && p.potential_surplus > 0 && (
                          <Link
                            href="/seller/donations"
                            className="inline-block px-2.5 py-1 rounded bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-semibold transition"
                          >
                            Create Offer
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Sign-Off Modal */}
      {reviewBatchId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-gray-900">Food Safety Verification Gate</h3>
              </div>
              <button onClick={() => setReviewBatchId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              By confirming approval, you certify that food storage temperatures have been physically verified and the batch condition is safe for human consumption.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Inspector / Authorized Staff Name</label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Inspection Notes & Temperature Logs</label>
                <textarea
                  rows={2}
                  required
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="pt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={reviewActionLoading}
                  onClick={() => handleSafetyReview(reviewBatchId, false)}
                  className="py-2 px-3 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 font-semibold"
                >
                  Reject Batch (Unsafe)
                </button>
                <button
                  type="button"
                  disabled={reviewActionLoading}
                  onClick={() => handleSafetyReview(reviewBatchId, true)}
                  className="py-2 px-3 rounded-lg bg-[#1b4332] text-white hover:bg-[#2d6a4f] font-semibold"
                >
                  Approve for Donation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
