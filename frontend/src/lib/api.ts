// API Client for FOODLOOP AI
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export interface UserProfile {
  id: string;
  email: string;
  role: "SELLER" | "RECIPIENT" | "ADMIN";
  business?: {
    id: string;
    business_name: string;
    category: string;
    contact_person: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    latitude: number;
    longitude: number;
    operating_hours: string;
    food_categories: string;
    is_test_account: boolean;
  };
  recipient?: {
    id: string;
    org_name: string;
    org_type: string;
    contact_person: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    latitude: number;
    longitude: number;
    verification_status: string;
    daily_capacity_meals: number;
    storage_capabilities: string;
    accepted_categories: string;
    operating_hours: string;
    is_test_account: boolean;
  };
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("foodloop_token");
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("foodloop_token", token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("foodloop_token");
    localStorage.removeItem("foodloop_user");
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = "API request failed";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}
