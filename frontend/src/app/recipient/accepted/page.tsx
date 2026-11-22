"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RecipientNav from "@/components/RecipientNav";
import { apiRequest } from "@/lib/api";
import { 
  CheckSquare, Clock, MapPin, Truck, 
  CheckCircle2, XCircle, AlertCircle, ArrowRight 
} from "lucide-react";

export default function RecipientAcceptedPage() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAllocations = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any[]>("/donations/allocations");
      setAllocations(data);
    } catch (err: any) {
      setError(err.message || "Failed to load allocations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  const handleUpdateStatus = async (allocId: string, status: string) => {
    setUpdatingId(allocId);
    try {
      await apiRequest(`/donations/allocations/${allocId}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          notes: `Updated to ${status} via Recipient Portal.`,
        }),
      });
      loadAllocations();
    } catch (err: any) {
      alert("Status update failed: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <RecipientNav />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Allocations & Chain of Custody</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Confirm pickups, handoffs, and receipts. Canceling an allocation releases stock and recalculates road delivery routes.
          </p>
        </div>
        <Link
          href="/map"
          className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition flex items-center space-x-1.5 shadow-xs"
        >
          <MapPin className="w-4 h-4" />
          <span>View Active Road Route</span>
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Allocation Code</th>
                <th className="py-3 px-4">Item / Offer</th>
                <th className="py-3 px-4">Donor Business</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Chain-of-Custody Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No allocations on record. Browse available offers to accept donations.
                  </td>
                </tr>
              ) : (
                allocations.map((a) => {
                  const isPendingOrAccepted = a.status === "PENDING" || a.status === "ACCEPTED";
                  const isScheduled = a.status === "SCHEDULED";
                  const isCollected = a.status === "COLLECTED";
                  const isDelivered = a.status === "DELIVERED";
                  const isCancelled = a.status === "CANCELLED" || a.status === "REJECTED";

                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-mono font-semibold text-gray-900">{a.allocation_code}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{a.offer_title}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900 block">{a.business_name}</span>
                        <span className="text-[11px] text-gray-500">{a.business_address}</span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#1b4332]">
                        {a.allocated_quantity} {a.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDelivered
                              ? "bg-emerald-100 text-emerald-800"
                              : isCollected
                              ? "bg-blue-100 text-blue-800"
                              : isCancelled
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {isPendingOrAccepted && (
                          <>
                            <button
                              disabled={updatingId === a.id}
                              onClick={() => handleUpdateStatus(a.id, "COLLECTED")}
                              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                            >
                              Confirm Pickup
                            </button>
                            <button
                              disabled={updatingId === a.id}
                              onClick={() => handleUpdateStatus(a.id, "CANCELLED")}
                              className="px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-800 font-semibold transition"
                            >
                              Cancel Stop
                            </button>
                          </>
                        )}
                        {isCollected && (
                          <button
                            disabled={updatingId === a.id}
                            onClick={() => handleUpdateStatus(a.id, "DELIVERED")}
                            className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition"
                          >
                            Confirm Receipt at Facility
                          </button>
                        )}
                        {isDelivered && (
                          <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Received</span>
                          </span>
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
    </div>
  );
}
