"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken, apiRequest } from "@/lib/api";
import { Store, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function SellerLoginPage() {
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

      if (data.role !== "SELLER") {
        throw new Error("This account is registered as a Recipient. Please use the Recipient portal.");
      }

      setToken(data.access_token);
      router.push("/seller/dashboard");
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
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 text-[#1b4332] flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Portal Login</h1>
          <p className="text-xs text-gray-500">
            Restaurants, bakeries, cafes, caterers and food merchants
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Business Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seller@restaurant.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
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
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-sm font-semibold transition flex items-center justify-center space-x-2 shadow"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Seller Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Don't have a seller account?</span>
          <Link href="/seller/register" className="font-semibold text-[#1b4332] hover:underline">
            Register Business
          </Link>
        </div>

        {/* Demo shortcut */}
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-center space-y-1">
          <p className="text-[11px] text-gray-500 font-medium">Test Seller Account:</p>
          <button
            type="button"
            onClick={() => {
              setEmail("seller.test@foodloop.local");
              setPassword("FoodloopTest123!");
            }}
            className="text-xs font-semibold text-[#2d6a4f] hover:underline"
          >
            Auto-fill: seller.test@foodloop.local
          </button>
        </div>
      </div>
    </div>
  );
}
