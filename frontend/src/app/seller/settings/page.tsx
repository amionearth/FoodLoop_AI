"use client";

import { useEffect, useState } from "react";
import SellerNav from "@/components/SellerNav";
import { apiRequest, UserProfile } from "@/lib/api";
import { Store, MapPin, Clock, ShieldCheck, Mail, Phone } from "lucide-react";

export default function SellerSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<UserProfile>("/auth/me")
      .then((data) => setProfile(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <SellerNav />
        <div className="py-12 text-center text-sm text-gray-500">Loading settings...</div>
      </div>
    );
  }

  const biz = profile?.business;

  return (
    <div className="space-y-6">
      <SellerNav />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Profile & Operational Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Verified tenant records used for algorithmic recipient matching and road routing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 border-b border-gray-100 pb-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-[#1b4332]">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{biz?.business_name}</h3>
              <p className="text-xs text-gray-500">{biz?.category} • Tenant ID: {profile?.id.slice(0, 8)}...</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-gray-700">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{profile?.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{biz?.phone} ({biz?.contact_person})</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Operating Hours: {biz?.operating_hours}</span>
            </div>
            <div className="flex items-start space-x-2 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span>{biz?.address}, {biz?.city}, {biz?.state} {biz?.postal_code}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Verified Routing GIS Coordinates
          </h3>
          <p className="text-xs text-gray-500">
            Coordinates stored in WGS84 for turn-by-turn road route generation via OSRM.
          </p>

          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-sans">Latitude</span>
              <p className="text-sm font-bold text-gray-900">{biz?.latitude?.toFixed(4)}</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-sans">Longitude</span>
              <p className="text-sm font-bold text-gray-900">{biz?.longitude?.toFixed(4)}</p>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-700 block mb-1">Handled Food Categories</span>
            <div className="flex flex-wrap gap-1.5">
              {(biz?.food_categories || "").split(",").map((cat: string) => (
                <span key={cat} className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium">
                  {cat.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
