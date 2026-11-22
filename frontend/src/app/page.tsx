"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/api";
import { 
  Store, HeartHandshake, Sparkles, MapPin, BarChart3, 
  CheckCircle2, ArrowRight, ShieldCheck, Activity, AlertCircle 
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [health, setHealth] = useState<any>(null);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/health")
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch((e) => {
        setHealth({ status: "CONNECTING_OR_OFFLINE", error: e.message });
      });
  }, []);

  const handleQuickLogin = async (email: string, targetRole: string) => {
    setLoadingDemo(email);
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "FoodloopTest123!" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      
      setToken(data.access_token);
      if (data.role === "SELLER") {
        router.push("/seller/dashboard");
      } else {
        router.push("/recipient/dashboard");
      }
    } catch (err: any) {
      alert(`Could not login to test account: ${err.message}. Ensure backend is running.`);
    } finally {
      setLoadingDemo(null);
    }
  };

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white p-8 sm:p-12 shadow-xl overflow-hidden">
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#d8f3dc]/20 text-[#d8f3dc] text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>AI-Driven Surplus Redistribution Platform</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Predict. Rescue. <br className="hidden sm:inline" />
            Redistribute. Prevent.
          </h1>
          <p className="text-base sm:text-lg text-emerald-100 max-w-2xl font-normal leading-relaxed">
            FOODLOOP AI integrates real machine learning demand forecasts, inventory reconciliation, human food safety compliance gates, intelligent recipient matching, and dynamic road routing into a single verified supply chain.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/seller/dashboard"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-white text-[#1b4332] font-semibold text-sm hover:bg-emerald-50 shadow transition"
            >
              <Store className="w-4 h-4 text-[#1b4332]" />
              <span>Seller Portal</span>
            </Link>
            <Link
              href="/recipient/dashboard"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-[#d8f3dc] text-[#1b4332] font-semibold text-sm hover:bg-emerald-100 shadow transition"
            >
              <HeartHandshake className="w-4 h-4 text-[#1b4332]" />
              <span>Recipient Portal</span>
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-[#2d6a4f]/70 text-white font-medium text-sm hover:bg-[#2d6a4f] border border-white/20 transition"
            >
              <MapPin className="w-4 h-4 text-emerald-300" />
              <span>Live Map & OSRM Routes</span>
            </Link>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* System Status Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${health?.status === "OPERATIONAL" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <span>Backend Engine Status:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${health?.status === "OPERATIONAL" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {health?.status || "CHECKING..."}
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              ML Model: {health?.services?.ml_model_engine?.algorithm || "Trained"} ({health?.services?.ml_model_engine?.version || "Ready"}) • Road Routing: {health?.services?.road_routing_osrm?.status || "Active"}
            </p>
          </div>
        </div>
        <Link
          href="/impact"
          className="text-xs font-semibold text-[#1b4332] hover:text-[#2d6a4f] flex items-center space-x-1"
        >
          <span>View Verified Impact Analytics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 1-Click Hackathon Test Scenario Accounts */}
      <div className="bg-white rounded-xl border border-emerald-200/60 p-6 shadow-sm space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Hackathon Testing Sandbox
          </span>
          <h2 className="text-lg font-bold text-gray-900 mt-1">1-Click Test Personas</h2>
          <p className="text-xs text-gray-500">
            Use these pre-seeded, isolated test accounts to test the complete end-to-end flow. All sample records are labeled test activity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Seller Card */}
          <div className="rounded-lg border border-gray-200 p-4 hover:border-emerald-300 transition flex flex-col justify-between space-y-3 bg-gray-50/50">
            <div>
              <div className="flex items-center space-x-2 text-[#1b4332] font-semibold text-sm">
                <Store className="w-4 h-4" />
                <span>Test Seller Account</span>
              </div>
              <p className="text-xs font-medium text-gray-900 mt-1">Green Harvest Kitchen</p>
              <p className="text-[11px] text-gray-500">Restaurant • Koramangala (12.9352, 77.6245)</p>
              <div className="mt-2 text-[11px] text-gray-600 bg-white p-2 rounded border border-gray-100">
                Has 28 days of historical sales + active batch ready for ML demand prediction & safety review.
              </div>
            </div>
            <button
              onClick={() => handleQuickLogin("seller.test@foodloop.local", "SELLER")}
              disabled={loadingDemo !== null}
              className="w-full py-2 px-3 rounded-md bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-semibold transition"
            >
              {loadingDemo === "seller.test@foodloop.local" ? "Authenticating..." : "Login as Test Seller"}
            </button>
          </div>

          {/* Recipient 1 Card */}
          <div className="rounded-lg border border-gray-200 p-4 hover:border-emerald-300 transition flex flex-col justify-between space-y-3 bg-gray-50/50">
            <div>
              <div className="flex items-center space-x-2 text-emerald-700 font-semibold text-sm">
                <HeartHandshake className="w-4 h-4" />
                <span>Test Recipient #1</span>
              </div>
              <p className="text-xs font-medium text-gray-900 mt-1">Aashray Community Kitchen</p>
              <p className="text-[11px] text-gray-500">Kitchen • Indiranagar (Capacity: 150 meals)</p>
              <div className="mt-2 text-[11px] text-gray-600 bg-white p-2 rounded border border-gray-100">
                Storage: Chilled/Ambient. Accepts prepared meals. Ranked top match by allocation algorithm.
              </div>
            </div>
            <button
              onClick={() => handleQuickLogin("kitchen.test@foodloop.local", "RECIPIENT")}
              disabled={loadingDemo !== null}
              className="w-full py-2 px-3 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
            >
              {loadingDemo === "kitchen.test@foodloop.local" ? "Authenticating..." : "Login as Community Kitchen"}
            </button>
          </div>

          {/* Recipient 2 Card */}
          <div className="rounded-lg border border-gray-200 p-4 hover:border-emerald-300 transition flex flex-col justify-between space-y-3 bg-gray-50/50">
            <div>
              <div className="flex items-center space-x-2 text-teal-700 font-semibold text-sm">
                <HeartHandshake className="w-4 h-4" />
                <span>Test Recipient #2</span>
              </div>
              <p className="text-xs font-medium text-gray-900 mt-1">Annapoorna Food Bank</p>
              <p className="text-[11px] text-gray-500">Food Bank • HSR Layout (Capacity: 250 meals)</p>
              <div className="mt-2 text-[11px] text-gray-600 bg-white p-2 rounded border border-gray-100">
                Storage: Frozen/Chilled/Ambient. High bulk intake capability.
              </div>
            </div>
            <button
              onClick={() => handleQuickLogin("foodbank.test@foodloop.local", "RECIPIENT")}
              disabled={loadingDemo !== null}
              className="w-full py-2 px-3 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition"
            >
              {loadingDemo === "foodbank.test@foodloop.local" ? "Authenticating..." : "Login as Food Bank"}
            </button>
          </div>
        </div>
      </div>

      {/* The 10-Step Workflow Explained */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">The Closed-Loop Methodology</h2>
          <p className="text-sm text-gray-500 mt-1">
            Every step is backed by real mathematical modeling, database transactions, and cryptographic authentication.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { step: "01", title: "Sales Ingestion", desc: "Universal cashier stock reconciliation & multi-sheet Excel parser." },
            { step: "02", title: "ML Forecasting", desc: "HistGradientBoostingRegressor with strict chronological anti-leakage." },
            { step: "03", title: "Surplus Calculation", desc: "Surplus = max(0, Available Batch Stock - Predicted Demand)." },
            { step: "04", title: "Food Safety Gate", desc: "Human review compliance gate: temperature, shelf-life, condition rating." },
            { step: "05", title: "Smart Matching", desc: "Category, cold-storage, daily capacity constraints & transparent scoring." },
            { step: "06", title: "Atomic Allocation", desc: "Offer partition locking preventing concurrent double-claiming." },
            { step: "07", title: "OSRM Road Route", desc: "Road distance (km), duration (mins), and decoded GeoJSON road geometry." },
            { step: "08", title: "Event Reroute", desc: "Automatic route recalculation upon recipient rejection or cancellation." },
            { step: "09", title: "Chain of Custody", desc: "Timestamped handoff receipts from scheduled to collected & delivered." },
            { step: "10", title: "Verified Impact", desc: "Rescued kg and CO2e emissions avoided from confirmed delivery records only." },
          ].map((item) => (
            <div key={item.step} className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/70 space-y-1.5">
              <span className="text-xs font-extrabold text-[#2d6a4f]">{item.step}</span>
              <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
