"use client";

import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

const statusColors: Record<string, string> = {
  SUBMITTED: "#EF4444",   // red
  IN_PROGRESS: "#F59E0B", // amber
  RESOLVED: "#10B981",    // green
  REJECTED: "#6B7280",    // gray
};

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

          const color = statusColors[g.status] || "#3B82F6";
          // Larger radius for more upvotes to create heatmap effect
          const radius = Math.min(8 + (g.upvote_count || 0) * 2, 20);

          return (
            <CircleMarker 
              key={g.id} 
              center={[g.latitude, g.longitude]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                color: color,
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.45,
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="text-xs font-semibold text-text-muted mb-1">{g.categories?.name || "Unknown"}</div>
                  <h3 className="font-bold text-sm leading-tight mb-2" style={{ color: '#1B2A4A' }}>{g.subject || "No Subject"}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span 
                      className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: color }}
                    >
                      {g.status ? g.status.replace(/_/g, ' ') : "UNKNOWN"}
                    </span>
                    <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#2563EB' }}>
                      👍 {g.upvote_count || 0}
                    </span>
                  </div>
                  <a 
                    href={`/track?id=${g.grievance_number}`} 
                    className="block w-full text-center text-xs text-white py-1.5 rounded transition-colors"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    View Details
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
