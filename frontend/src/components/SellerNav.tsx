"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, ShoppingBag, Boxes, Calculator, 
  Receipt, FileSpreadsheet, Sparkles, AlertTriangle, 
  Gift, Network, Settings 
} from "lucide-react";

const SELLER_NAV_ITEMS = [
  { href: "/seller/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/seller/products", label: "Products", icon: ShoppingBag },
  { href: "/seller/inventory", label: "Inventory", icon: Boxes },
  { href: "/seller/cashier", label: "Cashier", icon: Calculator },
  { href: "/seller/sales", label: "Sales History", icon: Receipt },
  { href: "/seller/import", label: "Excel Pipeline", icon: FileSpreadsheet },
  { href: "/seller/forecast", label: "AI Forecast", icon: Sparkles },
  { href: "/seller/surplus", label: "Surplus & Review", icon: AlertTriangle },
  { href: "/seller/donations", label: "Donation Offers", icon: Gift },
  { href: "/seller/integrations", label: "POS Integrations", icon: Network },
  { href: "/seller/settings", label: "Settings", icon: Settings },
];

export default function SellerNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-gray-200 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6 shadow-xs sticky top-16 z-40">
      <div className="flex space-x-1 overflow-x-auto py-2.5 no-scrollbar">
        {SELLER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? "bg-[#1b4332] text-white shadow-xs"
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
