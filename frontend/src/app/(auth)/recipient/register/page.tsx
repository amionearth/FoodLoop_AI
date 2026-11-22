"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken, apiRequest } from "@/lib/api";
import { HeartHandshake, ArrowRight, AlertCircle, MapPin } from "lucide-react";

export default function RecipientRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    org_name: "",
    org_type: "NGO",
    contact_person: "",
    phone: "",
    email: "",
    password: "",
    address: "",
    city: "Kochi",
    state: "Kerala",
    country: "India",
    postal_code: "682030",
    latitude: 10.0159,
    longitude: 76.3419,
    daily_capacity_meals: 150,
    storage_capabilities: "AMBIENT,CHILLED",
    accepted_categories: "Prepared Meals, Bakery, Rice & Curry",
    operating_hours: "08:00 - 18:00",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest<{ access_token: string; role: string }>("/auth/recipient/register", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          latitude: parseFloat(form.latitude as any),
          longitude: parseFloat(form.longitude as any),
          daily_capacity_meals: parseInt(form.daily_capacity_meals as any, 10),
          is_test_account: false,
        }),
      });

      setToken(data.access_token);
      router.push("/recipient/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Register as a Recipient Organization</h1>
          <p className="text-xs text-gray-500">
            Connect your NGO, shelter, food bank, or community kitchen to receive surplus food donations.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Organization Name</label>
              <input
                type="text"
                required
                value={form.org_name}
                onChange={(e) => setForm({ ...form, org_name: e.target.value })}
                placeholder="e.g. Seva Feeding Trust"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Organization Type</label>
              <select
                value={form.org_type}
                onChange={(e) => setForm({ ...form, org_type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
              >
                <option value="NGO">NGO</option>
                <option value="Community Kitchen">Community Kitchen</option>
                <option value="Food Bank">Food Bank</option>
                <option value="Shelter">Shelter</option>
                <option value="Charitable Trust">Charitable Trust</option>
                <option value="Other">Other eligible organisation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Authorized Representative</label>
              <input
                type="text"
                required
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                placeholder="Director / Coordinator Name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98111 22334"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Official Email</label>
              <input
                type="text"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@charity.org"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery / Intake Facility Address</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Plot 42, Service Road"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
              <input
                type="text"
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                required
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                placeholder="560038"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Real Coordinates */}
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
            <div className="flex items-center space-x-1 text-xs font-bold text-gray-800">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Real Geographic Coordinates (Required for OSRM Route Calculation)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-600">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white"
                />
              </div>
            </div>
          </div>

          {/* Operational Capacities & Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Daily Capacity (Meals)</label>
              <input
                type="number"
                min="1"
                required
                value={form.daily_capacity_meals}
                onChange={(e) => setForm({ ...form, daily_capacity_meals: parseInt(e.target.value, 10) || 100 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Storage Capabilities</label>
              <select
                value={form.storage_capabilities}
                onChange={(e) => setForm({ ...form, storage_capabilities: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="AMBIENT">Ambient Only</option>
                <option value="AMBIENT,CHILLED">Ambient & Chilled</option>
                <option value="AMBIENT,CHILLED,FROZEN">Ambient, Chilled & Frozen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Intake Hours</label>
              <input
                type="text"
                value={form.operating_hours}
                onChange={(e) => setForm({ ...form, operating_hours: e.target.value })}
                placeholder="09:00 - 18:00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Accepted Food Categories</label>
            <input
              type="text"
              value={form.accepted_categories}
              onChange={(e) => setForm({ ...form, accepted_categories: e.target.value })}
              placeholder="Prepared Meals, Bakery, Dairy, Produce"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <strong>Verification Note:</strong> Registration status will be listed as <strong>Pending Verification</strong> until documentation review is completed. Test organizations are allowed to test redistribution immediately with clear test labels.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition flex items-center justify-center space-x-2 shadow"
          >
            <span>{loading ? "Registering Organization..." : "Complete Recipient Registration"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          Already registered?{" "}
          <Link href="/recipient/login" className="font-semibold text-emerald-700 hover:underline">
            Sign In to Recipient Account
          </Link>
        </div>
      </div>
    </div>
  );
}
