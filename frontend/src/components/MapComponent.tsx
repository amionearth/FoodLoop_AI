"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// High-DPI Inline SVG Pins that never fail or depend on external CDN
const createPinIcon = (color: string, label: string) => {
  return L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="
        position: relative;
        width: 34px;
        height: 42px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      ">
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${color};
          color: #ffffff;
          font-weight: 800;
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
          box-shadow: 0 3px 8px rgba(0,0,0,0.35);
        ">
          ${label}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${color};
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -36],
  });
};

interface Stop {
  id: string;
  label: string;
  address: string;
  lat: number;
  lon: number;
  stop_type: "PICKUP" | "DELIVERY";
}

interface MapProps {
  stops: Stop[];
  routeGeometry?: any; // GeoJSON geometry from OSRM
  activeStopIndex?: number;
}

export default function MapComponent({ stops, routeGeometry }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map once on Mount (Centered on Kochi, Kerala)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset container if previously initialized by hot reload / StrictMode
    if ((mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    // Default coordinates: Kochi, Kerala [9.9816, 76.2799]
    const map = L.map(mapContainerRef.current, {
      center: [9.9816, 76.2799],
      zoom: 12,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  // Update Markers and Route Geometry whenever stops or route changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const bounds = L.latLngBounds([]);
    let deliveryIndex = 1;

    stops.forEach((stop) => {
      const isPickup = stop.stop_type === "PICKUP";
      const icon = isPickup
        ? createPinIcon("#1b4332", "P")
        : createPinIcon("#dc2626", `${deliveryIndex++}`);

      const marker = L.marker([stop.lat, stop.lon], { icon }).addTo(markersLayer);

      marker.bindPopup(`
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
          <div style="font-weight: 800; color: ${isPickup ? "#1b4332" : "#b91c1c"}; font-size: 13px; margin-bottom: 3px;">
            ${isPickup ? "📍 PICKUP (Donor / Seller)" : "🛑 RECIPIENT DELIVERY"}
          </div>
          <strong style="color: #111827; font-size: 13px;">${stop.label}</strong>
          <div style="color: #4b5563; margin-top: 2px;">${stop.address}</div>
          <div style="font-family: monospace; font-size: 10px; color: #6b7280; margin-top: 4px;">
            Coords: ${stop.lat.toFixed(4)}, ${stop.lon.toFixed(4)} (Kerala)
          </div>
        </div>
      `);

      bounds.extend([stop.lat, stop.lon]);
    });

    // Draw Real Road Route Geometry from OSRM
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeGeometry && routeGeometry.coordinates && routeGeometry.coordinates.length > 0) {
      const geoLayer = L.geoJSON(routeGeometry, {
        style: {
          color: "#2563eb", // Road Blue
          weight: 5,
          opacity: 0.85,
          lineJoin: "round",
          lineCap: "round",
        },
      }).addTo(map);

      routeLayerRef.current = geoLayer;
      map.fitBounds(geoLayer.getBounds(), { padding: [40, 40] });
    } else if (stops.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else {
      map.setView([9.9816, 76.2799], 12);
    }
  }, [stops, routeGeometry]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[540px] rounded-xl border border-gray-200 z-10 shadow-xs relative"
    />
  );
}
