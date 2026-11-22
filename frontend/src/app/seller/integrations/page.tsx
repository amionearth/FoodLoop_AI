"use client";

import { useEffect, useState } from "react";
import SellerNav from "@/components/SellerNav";
import { apiRequest } from "@/lib/api";
import { Network, CheckCircle2, AlertCircle, Key, Lock, ArrowRight } from "lucide-react";

export default function SellerIntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectProvider, setConnectProvider] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any[]>("/integrations/status");
      setIntegrations(data);
    } catch (err: any) {
      setError(err.message || "Failed to load integrations status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectProvider) return;
    setConnecting(true);
    setError("");

    try {
      const res = await apiRequest<any>(`/integrations/connect?provider=${connectProvider}`, {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      if (!res.success) {
        alert(res.message);
      } else {
        alert("Connection successful!");
        setConnectProvider(null);
        setCredentials({});
        loadStatus();
      }
    } catch (err: any) {
      setError(err.message || "Connection attempt failed");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SellerNav />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">POS & Cashier API Integrations</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Provider-neutral POS sync architecture. When credentials are not configured, the platform safely informs you rather than fabricating data.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {integrations.map((item) => (
          <div
            key={item.provider}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">{item.provider}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.is_connected
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{item.message}</p>
            </div>

            <div>
              {!item.is_connected && item.status !== "CONNECTED" ? (
                <button
                  onClick={() => {
                    setConnectProvider(item.provider.includes("GoFrugal") ? "GOFRUGAL" : "SQUARE");
                    setCredentials({});
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs font-semibold text-gray-800 transition flex items-center justify-center space-x-1"
                >
                  <Key className="w-3.5 h-3.5 text-gray-500" />
                  <span>Configure API Credentials</span>
                </button>
              ) : (
                <div className="text-[11px] font-semibold text-emerald-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pipeline Active</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Connect Modal */}
      {connectProvider && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900">
              Configure {connectProvider} Credentials
            </h3>
            <p className="text-xs text-gray-500">
              Enter merchant API keys or OAuth access token. Credentials are cryptographically encrypted.
            </p>

            <form onSubmit={handleConnect} className="space-y-3 text-xs">
              {connectProvider === "GOFRUGAL" ? (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">License Key</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GF-LIC-XXXX-YYYY"
                      value={credentials.license_key || ""}
                      onChange={(e) => setCredentials({ ...credentials, license_key: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Auth Token</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••••••"
                      value={credentials.auth_token || ""}
                      onChange={(e) => setCredentials({ ...credentials, auth_token: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Square OAuth Access Token</label>
                    <input
                      type="password"
                      required
                      placeholder="EAAA..."
                      value={credentials.access_token || ""}
                      onChange={(e) => setCredentials({ ...credentials, access_token: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Location ID</label>
                    <input
                      type="text"
                      required
                      placeholder="L..."
                      value={credentials.location_id || ""}
                      onChange={(e) => setCredentials({ ...credentials, location_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setConnectProvider(null)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="px-4 py-2 rounded-lg bg-[#1b4332] text-white font-semibold hover:bg-[#2d6a4f]"
                >
                  {connecting ? "Testing Connection..." : "Save & Verify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
