"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken, apiRequest } from "@/lib/api";
import { HeartHandshake, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function RecipientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest<{ access_token: string; role: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data.role !== "RECIPIENT") {
        throw new Error("This account is registered as a Seller. Please use the Seller portal.");
      }

      setToken(data.access_token);
      router.push("/recipient/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Recipient Portal Login</h1>
          <p className="text-xs text-gray-500">
            NGOs, community kitchens, food banks, shelters & charitable trusts
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Organization Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@ngo.org"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition flex items-center justify-center space-x-2 shadow"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Recipient Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>New organization?</span>
          <Link href="/recipient/register" className="font-semibold text-emerald-700 hover:underline">
            Register Organization
          </Link>
        </div>

        {/* Demo shortcuts */}
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-center space-y-1.5">
          <p className="text-[11px] text-gray-500 font-medium">Test Recipient Accounts:</p>
          <div className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => {
                setEmail("kitchen.test@foodloop.local");
                setPassword("FoodloopTest123!");
              }}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Fill: kitchen.test@foodloop.local (Community Kitchen)
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("foodbank.test@foodloop.local");
                setPassword("FoodloopTest123!");
              }}
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              Fill: foodbank.test@foodloop.local (Food Bank)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
