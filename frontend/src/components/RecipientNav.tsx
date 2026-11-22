"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Gift, CheckSquare, History, 
  MapPin, Settings 
} from "lucide-react";

const RECIPIENT_NAV_ITEMS = [
  { href: "/recipient/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recipient/offers", label: "Browse Available Offers", icon: Gift },
  { href: "/recipient/accepted", label: "My Allocations & Handoffs", icon: CheckSquare },
  { href: "/recipient/history", label: "Delivery History", icon: History },
  { href: "/map", label: "Map & Routes", icon: MapPin },
  { href: "/recipient/settings", label: "Settings", icon: Settings },
];

export default function RecipientNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-gray-200 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6 shadow-xs sticky top-16 z-40">
      <div className="flex space-x-1 overflow-x-auto py-2.5 no-scrollbar">
        {RECIPIENT_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
