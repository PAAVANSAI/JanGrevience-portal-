"use client";

import { useState, useEffect } from "react";
import { Marker, useMapEvents } from "react-leaflet";
import { useFormContext } from "react-hook-form";

export default function LocationMarker() {
  const { setValue, watch } = useFormContext();
  const lat = watch("latitude");
  const lng = watch("longitude");
  
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  );

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setValue("latitude", e.latlng.lat, { shouldValidate: true });
      setValue("longitude", e.latlng.lng, { shouldValidate: true });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // If the form values change externally (e.g. "Use Current Location"), update the marker
  useEffect(() => {
    if (lat && lng && (!position || position.lat !== lat || position.lng !== lng)) {
      setPosition({ lat, lng });
      map.flyTo({ lat, lng }, 15);
    }
  }, [lat, lng, position, map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}
