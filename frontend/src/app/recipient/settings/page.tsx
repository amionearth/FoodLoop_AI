"use client";

import { useEffect, useState } from "react";
import RecipientNav from "@/components/RecipientNav";
import { apiRequest, UserProfile } from "@/lib/api";
import { HeartHandshake, MapPin, Clock, Mail, Phone, ShieldCheck } from "lucide-react";

export default function RecipientSettingsPage() {
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
        <RecipientNav />
        <div className="py-12 text-center text-sm text-gray-500">Loading settings...</div>
      </div>
    );
  }

  const rec = profile?.recipient;

  return (
    <div className="space-y-6">
      <RecipientNav />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings & Capacity Profile</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Verified facility coordinates and storage parameters used to route redistribution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 border-b border-gray-100 pb-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{rec?.org_name}</h3>
              <p className="text-xs text-gray-500">{rec?.org_type} • ID: {profile?.id.slice(0, 8)}...</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-gray-700">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{profile?.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{rec?.phone} ({rec?.contact_person})</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Intake Hours: {rec?.operating_hours}</span>
            </div>
            <div className="flex items-start space-x-2 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span>{rec?.address}, {rec?.city}, {rec?.state} {rec?.postal_code}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Facility Capacity & Storage Capabilities
          </h3>

          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Daily Intake Limit:</span>
              <span className="font-bold text-gray-900">{rec?.daily_capacity_meals} meals</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Storage Facilities:</span>
              <span className="font-semibold text-gray-800">{rec?.storage_capabilities}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Accepted Food Types:</span>
              <span className="font-semibold text-gray-800">{rec?.accepted_categories}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Verification Status:</span>
              <span className="font-bold text-emerald-800">{rec?.verification_status}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono">
            <span className="text-[10px] text-gray-400 uppercase font-sans block mb-1">GIS Road Routing Pin</span>
            <span>Lat: {rec?.latitude?.toFixed(4)}, Lon: {rec?.longitude?.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
