"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RecipientNav from "@/components/RecipientNav";
import { apiRequest, UserProfile } from "@/lib/api";
import { 
  HeartHandshake, Gift, CheckSquare, Clock, 
  MapPin, ShieldCheck, ArrowRight, CheckCircle2 
} from "lucide-react";

export default function RecipientDashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prof, off, alc] = await Promise.all([
          apiRequest<UserProfile>("/auth/me"),
          apiRequest<any[]>("/donations/offers"),
          apiRequest<any[]>("/donations/allocations"),
        ]);
        setProfile(prof);
        setOffers(off);
        setAllocations(alc);
      } catch (err) {
        console.error("Recipient load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div>
        <RecipientNav />
        <div className="py-12 text-center text-sm text-gray-500">Loading recipient portal...</div>
      </div>
    );
  }

  const rec = profile?.recipient;
  const activeAllocations = allocations.filter((a) => a.status === "ACCEPTED" || a.status === "SCHEDULED" || a.status === "COLLECTED");
  const usedCapacity = activeAllocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
  const totalCapacity = rec?.daily_capacity_meals || 150;
  const remainingCapacity = Math.max(0, totalCapacity - usedCapacity);

  return (
    <div className="space-y-6">
      <RecipientNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">{rec?.org_name}</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {rec?.verification_status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {rec?.org_type} • Daily Intake Facility Capacity: {totalCapacity} meals
          </p>
        </div>

        <Link
          href="/recipient/offers"
          className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition flex items-center space-x-1.5 shadow-xs"
        >
          <Gift className="w-4 h-4" />
          <span>Browse Available Surplus</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Daily Capacity Available</span>
            <HeartHandshake className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{remainingCapacity}</p>
          <p className="text-[11px] text-gray-400">Meals can be safely received today</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Open Nearby Offers</span>
            <Gift className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{offers.length}</p>
          <p className="text-[11px] text-gray-400">Available food donations</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Active Allocations</span>
            <CheckSquare className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{activeAllocations.length}</p>
          <p className="text-[11px] text-gray-400">Pickups / deliveries in progress</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Completed Receipts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {allocations.filter((a) => a.status === "DELIVERED").length}
          </p>
          <p className="text-[11px] text-gray-400">Verified meals distributed</p>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Allocations */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Current In-Progress Allocations</h3>
              <p className="text-xs text-gray-500">Status updates synchronize dynamic routing engine</p>
            </div>
            <Link
              href="/recipient/accepted"
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center space-x-1"
            >
              <span>Manage Handoffs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeAllocations.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No active collections or deliveries scheduled right now. Browse available offers to accept donations.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activeAllocations.map((a) => (
                <div key={a.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{a.offer_title}</h4>
                    <p className="text-[11px] text-gray-500">
                      Donor: {a.business_name} ({a.business_address})
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">Code: {a.allocation_code}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-sm font-extrabold text-[#1b4332]">
                      {a.allocated_quantity} {a.unit}
                    </span>
                    <span className="block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Capacity Breakdown & Storage */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Facility Cold Chain Capabilities</h3>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-2 text-xs">
              <div>
                <span className="text-gray-500 block">Accepted Storage Types:</span>
                <span className="font-semibold text-gray-800">{rec?.storage_capabilities}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Accepted Food Categories:</span>
                <span className="font-semibold text-gray-800">{rec?.accepted_categories}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Operating Intake Hours:</span>
                <span className="font-semibold text-gray-800">{rec?.operating_hours}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-xl p-5 shadow-xs space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-200">Road Routing & Transit</h3>
            <p className="text-xs text-emerald-100 leading-relaxed">
              When an offer is accepted, the platform computes road driving routes between the donor and your facility using real coordinates.
            </p>
            <div className="pt-2">
              <Link
                href="/map"
                className="block text-center w-full py-2 px-3 rounded-lg bg-white text-emerald-900 font-semibold text-xs hover:bg-emerald-50 transition shadow-xs"
              >
                Open Road Routing Map
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
