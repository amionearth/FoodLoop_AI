"use client";

import { useEffect, useState } from "react";
import RecipientNav from "@/components/RecipientNav";
import { apiRequest } from "@/lib/api";
import { History, CheckCircle2 } from "lucide-react";

export default function RecipientHistoryPage() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<any[]>("/donations/allocations")
      .then((data) => setAllocations(data.filter((a) => a.status === "DELIVERED")))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <RecipientNav />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Completed Delivery Receipts</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Verified chain of custody handoffs. Meals distributed to communities and shelters.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt Code</th>
                <th className="py-3 px-4">Item Delivered</th>
                <th className="py-3 px-4">Donor Business</th>
                <th className="py-3 px-4">Quantity Received</th>
                <th className="py-3 px-4">Delivery Timestamp</th>
                <th className="py-3 px-4">Confirmation Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No completed delivery receipts yet.
                  </td>
                </tr>
              ) : (
                allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">{a.allocation_code}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{a.offer_title}</td>
                    <td className="py-3 px-4 text-gray-700">{a.business_name}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-800">
                      {a.allocated_quantity} {a.unit}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {a.delivered_at ? new Date(a.delivered_at).toLocaleString() : new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600 italic">
                      {a.delivery_confirmation_notes || "Confirmed delivery receipt."}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
