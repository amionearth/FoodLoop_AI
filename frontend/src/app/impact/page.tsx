"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { 
  BarChart3, Leaf, HeartHandshake, Store, 
  CheckCircle2, ArrowRight, ShieldCheck, Info 
} from "lucide-react";

export default function ImpactPage() {
  const [impact, setImpact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<any>("/impact/summary")
      .then((data) => setImpact(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-xs text-gray-400">Aggregating verified impact records...</div>;
  }

  return (
    <div className="space-y-8 py-4">
      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white p-8 sm:p-10 shadow-lg space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100/20 text-[#d8f3dc] text-xs font-semibold uppercase tracking-wider">
          <Leaf className="w-3.5 h-3.5 text-emerald-300" />
          <span>Measurable Sustainability Analytics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Verified Ecological & Community Impact
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
          Aggregated strictly from recorded handoff receipts. We distinguish between potential predicted surplus and food that was physically delivered and eaten.
        </p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Delivered Meal Portions</span>
          <p className="text-3xl font-extrabold text-[#1b4332]">
            {impact?.quantity_delivered_meals || 0}
          </p>
          <p className="text-[11px] text-gray-500">From confirmed delivery receipts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Actual Food Rescued</span>
          <p className="text-3xl font-extrabold text-emerald-700">
            {impact?.actual_rescued_kg || 0} kg
          </p>
          <p className="text-[11px] text-gray-500">Calculated at 0.45 kg / standard meal</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estimated CO₂e Diverted</span>
          <p className="text-3xl font-extrabold text-teal-800">
            {impact?.estimated_co2e_avoided_kg || 0} kg
          </p>
          <p className="text-[11px] text-gray-500">Landfill methane avoidance factor (UNEP)</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Donation Completion Rate</span>
          <p className="text-3xl font-extrabold text-gray-900">
            {impact?.completion_rate_percentage || 0}%
          </p>
          <p className="text-[11px] text-gray-500">Delivered vs. total offered surplus</p>
        </div>
      </div>

      {/* Funnel & Conversion Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Surplus-to-Redistribution Conversion Funnel</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real transactional chain: Potential Surplus Identified → Created Offers → Claimed Allocations → Confirmed Handover.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-gray-400">Step 1: Identified</span>
            <p className="text-xl font-bold text-gray-900">{impact?.potential_surplus_identified_kg || 0} kg</p>
            <p className="text-[11px] text-gray-500">Surplus predicted by ML engine</p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-gray-400">Step 2: Offered</span>
            <p className="text-xl font-bold text-gray-900">{impact?.quantity_offered_meals || 0} meals</p>
            <p className="text-[11px] text-gray-500">Across {impact?.offers_created_count || 0} safety-signed offers</p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-gray-400">Step 3: Accepted</span>
            <p className="text-xl font-bold text-gray-900">{impact?.quantity_accepted_meals || 0} meals</p>
            <p className="text-[11px] text-gray-500">Claimed by verified recipients</p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-emerald-800">Step 4: Delivered</span>
            <p className="text-xl font-bold text-emerald-900">{impact?.quantity_delivered_meals || 0} meals</p>
            <p className="text-[11px] text-emerald-700">Physical receipt verified</p>
          </div>
        </div>

        {/* Stakeholder Counts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 flex items-center space-x-3">
            <Store className="w-5 h-5 text-emerald-800" />
            <div>
              <p className="text-xs font-semibold text-gray-900">
                {impact?.participating_sellers_count || 0} Participating Food Businesses
              </p>
              <p className="text-[11px] text-gray-500">Restaurants, catering companies, and cafes</p>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 flex items-center space-x-3">
            <HeartHandshake className="w-5 h-5 text-emerald-800" />
            <div>
              <p className="text-xs font-semibold text-gray-900">
                {impact?.active_recipients_count || 0} Registered Recipient Organizations
              </p>
              <p className="text-[11px] text-gray-500">Community kitchens, shelters, and food banks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Methodology Disclosure */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
          <Info className="w-4 h-4 text-emerald-700" />
          <span>Carbon & Mass Calculation Methodology</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          {impact?.methodology_note}
        </p>
        <p className="text-[11px] text-gray-400 italic">
          Sources: United Nations Environment Programme (UNEP) Food Waste Index Report; Food and Agriculture Organization (FAO) Food Wastage Footprint Model.
        </p>
      </div>
    </div>
  );
}
