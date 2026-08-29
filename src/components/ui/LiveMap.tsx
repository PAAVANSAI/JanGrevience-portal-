"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").default?.src || "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: require("leaflet/dist/images/marker-icon.png").default?.src || "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default?.src || "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface Grievance {
  id: string;
  grievance_number: string;
  subject: string;
  status: string;
  upvote_count: number;
  latitude: number;
  longitude: number;
  categories: { name: string } | null;
}

export default function LiveMap({ grievances }: { grievances: Grievance[] }) {
  const center: [number, number] = [20.5937, 78.9629];

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer center={center} zoom={5} scrollWheelZoom={true} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {grievances.map((g) => {
          if (
            typeof g.latitude !== 'number' || 
            typeof g.longitude !== 'number' || 
            isNaN(g.latitude) || 
            isNaN(g.longitude)
          ) return null;

          return (
            <Marker key={g.id} position={[g.latitude, g.longitude]}>
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="text-xs font-semibold text-text-muted mb-1">{g.categories?.name || "Unknown"}</div>
                  <h3 className="font-bold text-navy text-sm leading-tight mb-2">{g.subject || "No Subject"}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      {g.status ? g.status.replace(/_/g, ' ') : "UNKNOWN"}
                    </span>
                    <span className="text-xs font-bold text-blue flex items-center gap-1">
                      👍 {g.upvote_count || 0}
                    </span>
                  </div>
                  <a 
                    href={`/track?id=${g.grievance_number}`} 
                    className="block w-full text-center text-xs bg-blue text-white py-1.5 rounded hover:bg-blue-hover transition-colors"
                  >
                    View Details
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
