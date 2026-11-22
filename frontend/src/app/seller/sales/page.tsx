"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SellerNav from "@/components/SellerNav";
import { apiRequest } from "@/lib/api";
import { Receipt, Plus, FileSpreadsheet, AlertCircle } from "lucide-react";

export default function SellerSalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<any[]>("/sales")
      .then((data) => setSales(data))
      .catch((err) => setError(err.message || "Failed to load sales history"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <SellerNav />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historical Sales & Reconciliation Ledger</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit log of daily trading records feeding the AI demand forecasting pipeline.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/seller/import"
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Import Excel</span>
          </Link>
          <Link
            href="/seller/cashier"
            className="px-3 py-2 rounded-lg bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#2d6a4f] transition flex items-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Daily Entry</span>
          </Link>
        </div>
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
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Opening</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4">Sold (Gross)</th>
                <th className="py-3 px-4">Waste</th>
                <th className="py-3 px-4">Counted Closing</th>
                <th className="py-3 px-4">Expected Closing</th>
                <th className="py-3 px-4">Discrepancy</th>
                <th className="py-3 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-400">
                    No sales recorded yet. Use the Cashier or Excel Pipeline to add records.
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-medium text-gray-900">{s.business_date}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{s.product_name}</td>
                    <td className="py-3 px-4 text-gray-600">{s.opening_stock}</td>
                    <td className="py-3 px-4 text-gray-600">+{s.stock_received}</td>
                    <td className="py-3 px-4 font-bold text-[#1b4332]">{s.units_sold} {s.unit}</td>
                    <td className="py-3 px-4 text-red-600 font-medium">-{s.recorded_waste}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{s.closing_stock}</td>
                    <td className="py-3 px-4 text-gray-600">{s.expected_closing}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          s.discrepancy === 0
                            ? "text-emerald-700"
                            : s.discrepancy < 0
                            ? "text-amber-700"
                            : "text-blue-700"
                        }`}
                      >
                        {s.discrepancy > 0 ? `+${s.discrepancy}` : s.discrepancy}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {s.source}
                      </span>
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
