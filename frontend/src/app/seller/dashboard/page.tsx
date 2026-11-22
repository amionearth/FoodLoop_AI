"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SellerNav from "@/components/SellerNav";
import { apiRequest } from "@/lib/api";
import { 
  ShoppingBag, Boxes, Receipt, AlertTriangle, Gift, 
  ArrowRight, Sparkles, PlusCircle, CheckCircle, ShieldAlert 
} from "lucide-react";

export default function SellerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [surplus, setSurplus] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [p, inv, s, surp, off] = await Promise.all([
          apiRequest<any[]>("/products"),
          apiRequest<any[]>("/inventory"),
          apiRequest<any[]>("/sales"),
          apiRequest<any[]>("/surplus/predictions"),
          apiRequest<any[]>("/donations/offers"),
        ]);
        setProducts(p);
        setInventory(inv);
        setSales(s);
        setSurplus(surp);
        setOffers(off);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div>
        <SellerNav />
        <div className="py-12 text-center text-sm text-gray-500">Loading business workspace...</div>
      </div>
    );
  }

  // Real calculations
  const totalAvailableStock = inventory.reduce((sum, item) => sum + (item.quantity - item.reserved_quantity), 0);
  const totalUnitsSold = sales.reduce((sum, item) => sum + item.units_sold, 0);
  const totalPotentialSurplus = surplus.reduce((sum, item) => sum + item.potential_surplus, 0);
  const activeOffersCount = offers.filter((o) => o.status === "OFFERED" || o.status === "PARTIALLY_ALLOCATED").length;

  return (
    <div className="space-y-6">
      <SellerNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Business Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time analytics aggregated strictly from your verified database records.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/seller/cashier"
            className="px-3 py-2 rounded-lg bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#2d6a4f] transition flex items-center space-x-1.5 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Open Cashier</span>
          </Link>
          <Link
            href="/seller/forecast"
            className="px-3 py-2 rounded-lg bg-emerald-50 text-[#1b4332] border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Forecast Demand</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Catalog Products</span>
            <ShoppingBag className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          <p className="text-[11px] text-gray-400">Active menu items</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Physical Stock</span>
            <Boxes className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalAvailableStock}</p>
          <p className="text-[11px] text-gray-400">Available unreserved units</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Recorded Sales</span>
            <Receipt className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalUnitsSold}</p>
          <p className="text-[11px] text-gray-400">Units rung through cashier</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Potential Surplus</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{totalPotentialSurplus}</p>
          <p className="text-[11px] text-gray-400">Units above predicted demand</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Active Offers</span>
            <Gift className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeOffersCount}</p>
          <p className="text-[11px] text-gray-400">Live redistribution offers</p>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Batches & Safety Review */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Active Inventory Batches & Safety State</h2>
              <p className="text-xs text-gray-500">Tracked in physical double-entry ledger</p>
            </div>
            <Link
              href="/seller/inventory"
              className="text-xs font-semibold text-[#1b4332] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {inventory.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200 space-y-2">
              <Boxes className="w-8 h-8 mx-auto text-gray-400" />
              <p className="text-xs font-semibold text-gray-700">No active inventory batches</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Add an initial batch or import sales history using the Excel pipeline to track inventory.
              </p>
              <Link
                href="/seller/inventory"
                className="inline-block mt-2 px-3 py-1.5 rounded bg-[#1b4332] text-white text-xs font-semibold"
              >
                Add First Batch
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {inventory.slice(0, 5).map((batch) => (
                <div key={batch.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{batch.product_name}</h4>
                    <p className="text-[11px] text-gray-500">
                      Batch #{batch.batch_number} • {batch.quantity} {batch.unit} ({batch.storage_method} @ {batch.storage_temp_c || "Ambient"}°C)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Condition: {batch.food_condition}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Expires: {new Date(batch.expiry_datetime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Forecasting Quick Card & Live Actions */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-900 to-[#1b4332] text-white rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                AI Demand Forecasting Engine
              </h3>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Trained tabular regressor evaluates your historical sales, day-of-week trends, and seasonality to predict tomorrow's demand and isolate true surplus.
            </p>
            <div className="pt-2">
              <Link
                href="/seller/forecast"
                className="block text-center w-full py-2 px-3 rounded-lg bg-white text-[#1b4332] font-semibold text-xs hover:bg-emerald-50 transition shadow-xs"
              >
                Launch Forecast Workbench
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Quick Handoff Actions</h3>
            <div className="space-y-2">
              <Link
                href="/seller/cashier"
                className="block p-2.5 rounded-lg border border-gray-100 hover:border-emerald-300 hover:bg-gray-50 transition text-xs font-medium text-gray-700"
              >
                1. Universal Cashier Reconciler
              </Link>
              <Link
                href="/seller/import"
                className="block p-2.5 rounded-lg border border-gray-100 hover:border-emerald-300 hover:bg-gray-50 transition text-xs font-medium text-gray-700"
              >
                2. Bulk Excel Workbook Ingest
              </Link>
              <Link
                href="/seller/surplus"
                className="block p-2.5 rounded-lg border border-gray-100 hover:border-emerald-300 hover:bg-gray-50 transition text-xs font-medium text-gray-700"
              >
                3. Human Food Safety Inspection
              </Link>
              <Link
                href="/seller/donations"
                className="block p-2.5 rounded-lg border border-gray-100 hover:border-emerald-300 hover:bg-gray-50 transition text-xs font-medium text-gray-700"
              >
                4. Recipient Matching & Allocation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
