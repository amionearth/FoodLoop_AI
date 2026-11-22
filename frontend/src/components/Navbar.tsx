"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, clearToken, apiRequest, UserProfile } from "@/lib/api";
import { 
  Leaf, Store, HeartHandshake, MapPin, BarChart3, 
  LogOut, UserCircle, ShieldAlert, Sparkles 
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    const t = getToken();
    setTokenState(t);
    if (t) {
      apiRequest<UserProfile>("/auth/me")
        .then((u) => setUser(u))
        .catch(() => {
          clearToken();
          setUser(null);
          setTokenState(null);
        });
    }
  }, [pathname]);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setTokenState(null);
    router.push("/");
  };

  const isSeller = user?.role === "SELLER";
  const isRecipient = user?.role === "RECIPIENT";

  return (
    <header className="sticky top-0 z-50 bg-[#1b4332] text-white shadow-md border-b border-[#2d6a4f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center font-bold">
            <Leaf className="w-5 h-5 text-[#1b4332]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">FOODLOOP</span>
            <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded bg-[#40916c] text-[#d8f3dc] font-semibold uppercase tracking-wider">
              AI
            </span>
          </div>
        </Link>

        {/* Primary Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {isSeller && (
            <>
              <Link
                href="/seller/dashboard"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  pathname.startsWith("/seller") ? "bg-[#2d6a4f] text-white" : "text-[#d8f3dc] hover:text-white"
                }`}
              >
                Seller Portal
              </Link>
              <Link
                href="/seller/cashier"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-[#d8f3dc] hover:text-white transition"
              >
                Cashier
              </Link>
              <Link
                href="/seller/forecast"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-[#d8f3dc] hover:text-white transition flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>AI Forecast</span>
              </Link>
              <Link
                href="/seller/surplus"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-[#d8f3dc] hover:text-white transition"
              >
                Surplus & Review
              </Link>
            </>
          )}

          {isRecipient && (
            <>
              <Link
                href="/recipient/dashboard"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  pathname.startsWith("/recipient") ? "bg-[#2d6a4f] text-white" : "text-[#d8f3dc] hover:text-white"
                }`}
              >
                Recipient Portal
              </Link>
              <Link
                href="/recipient/offers"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-[#d8f3dc] hover:text-white transition"
              >
                Available Offers
              </Link>
              <Link
                href="/recipient/accepted"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-[#d8f3dc] hover:text-white transition"
              >
                My Allocations
              </Link>
            </>
          )}

          <Link
            href="/map"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center space-x-1 ${
              pathname === "/map" ? "bg-[#2d6a4f] text-white" : "text-[#d8f3dc] hover:text-white"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map & Routing</span>
          </Link>

          <Link
            href="/impact"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center space-x-1 ${
              pathname === "/impact" ? "bg-[#2d6a4f] text-white" : "text-[#d8f3dc] hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Impact</span>
          </Link>
        </nav>

        {/* Auth / Account Controls */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white">
                  {user.business?.business_name || user.recipient?.org_name || user.email}
                </p>
                <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                  {user.role} {user.business?.is_test_account || user.recipient?.is_test_account ? "(Test)" : ""}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md bg-[#2d6a4f] hover:bg-[#40916c] text-[#d8f3dc] hover:text-white transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/seller/login"
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-[#2d6a4f] hover:bg-[#40916c] text-white transition flex items-center space-x-1"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Seller Login</span>
              </Link>
              <Link
                href="/recipient/login"
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-[#d8f3dc] hover:bg-emerald-100 text-[#1b4332] font-semibold transition flex items-center space-x-1"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Recipient Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
