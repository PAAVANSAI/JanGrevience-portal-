"use client";

import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import react-leaflet components since they require window
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const LocationMarker = dynamic(() => import("./LocationMarker"), { ssr: false });

export default function LocationPicker() {
  const { register, setValue, watch, formState: { errors } } = useFormContext();
  const [isClient, setIsClient] = useState(false);

  const lat = watch("latitude");
  const lng = watch("longitude");

  useEffect(() => {
    setIsClient(true);
    register("latitude");
    register("longitude");
    
    // Fix for Leaflet default icon issues in React
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").default?.src || "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: require("leaflet/dist/images/marker-icon.png").default?.src || "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: require("leaflet/dist/images/marker-shadow.png").default?.src || "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }, [register]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue("latitude", position.coords.latitude, { shouldValidate: true });
          setValue("longitude", position.coords.longitude, { shouldValidate: true });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. Please click on the map to drop a pin.");
        }
      );
    }
  };

  if (!isClient) {
    return <div className="h-64 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-text-muted">Loading map...</div>;
  }

  // Default to a central location in India if no lat/lng is set
  const center: [number, number] = lat && lng ? [lat, lng] : [20.5937, 78.9629];
  const zoom = lat && lng ? 15 : 4;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-text-primary">
          Exact Location (Optional)
        </label>
        <button
          type="button"
          onClick={handleGetLocation}
          className="text-xs font-semibold text-blue bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
          Use Current Location
        </button>
      </div>
      
      <p className="text-xs text-text-secondary">Click on the map to drop a pin at the exact location of the issue.</p>

      <div className="h-64 rounded-xl overflow-hidden border border-border shadow-sm z-0 relative">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%", zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
      </div>

    </div>
  );
}
