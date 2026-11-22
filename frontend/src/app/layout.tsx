import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FOODLOOP AI — Predict. Rescue. Redistribute. Prevent.",
  description: "Real end-to-end AI-powered food surplus demand forecasting, food safety review, and intelligent redistribution platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#f8f9fa] text-[#1a1a1a]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
          <p className="font-medium text-[#1b4332]">FOODLOOP AI — Hackathon Edition</p>
          <p className="mt-1">
            Predict. Rescue. Redistribute. Prevent. Built with Next.js, FastAPI, scikit-learn, Leaflet, and OSRM.
          </p>
        </footer>
      </body>
    </html>
  );
}
