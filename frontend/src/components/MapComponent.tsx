"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default marker icons in webpack / Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const sellerIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const recipientIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to central Bengaluru coordinates
      const map = L.map(mapContainerRef.current).setView([12.9352, 77.6245], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    const bounds = L.latLngBounds([]);

    // Add Stop Markers
    stops.forEach((stop, index) => {
      const isPickup = stop.stop_type === "PICKUP";
      const icon = isPickup ? sellerIcon : recipientIcon;
      const marker = L.marker([stop.lat, stop.lon], { icon }).addTo(markersLayerRef.current!);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: ${isPickup ? "#1b4332" : "#991b1b"}; font-size: 13px;">
            ${isPickup ? "📍 PICKUP (Donor)" : `🛑 STOP ${index}: DELIVERY`}
          </strong>
          <br/>
          <strong>${stop.label}</strong>
          <br/>
          <span style="color: #666;">${stop.address}</span>
          <br/>
          <span style="font-family: monospace; font-size: 10px; color: #888;">
            (${stop.lat.toFixed(4)}, ${stop.lon.toFixed(4)})
          </span>
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
    } else if (stops.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [stops, routeGeometry]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[520px] rounded-xl border border-gray-200 z-10 shadow-xs"
    />
  );
}
