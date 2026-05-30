"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { LocationUpdate } from "@/hooks/use-location-sharing";

// Dynamic import with ssr:false — CRITICAL for Leaflet (uses window)
const MapInner = dynamic(
  () => import("./map-inner").then((mod) => mod.LiveMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/30 rounded-xl">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading map...</span>
        </div>
      </div>
    ),
  }
);

interface HistoryPoint {
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface GeofenceZoneData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  color: string;
  enabled: boolean;
  createdAt?: string;
}

interface LiveMapProps {
  myLocation: { latitude: number; longitude: number } | null;
  partnerLocation: LocationUpdate | null;
  partnerName?: string;
  userName?: string;
  partnerHistory?: HistoryPoint[];
  geofenceZones?: GeofenceZoneData[];
  onMapClick?: (lat: number, lng: number) => void;
  partnerStale?: boolean;
  autoCenter?: boolean;
  onAutoCenterChange?: (v: boolean) => void;
}

export function LiveMap({
  myLocation,
  partnerLocation,
  partnerName,
  userName,
  partnerHistory = [],
  geofenceZones = [],
  onMapClick,
  partnerStale = false,
  autoCenter = false,
  onAutoCenterChange,
}: LiveMapProps) {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-border">
      <MapInner
        myLocation={myLocation}
        partnerLocation={partnerLocation}
        partnerName={partnerName}
        userName={userName}
        partnerHistory={partnerHistory}
        geofenceZones={geofenceZones}
        onMapClick={onMapClick}
        partnerStale={partnerStale}
        autoCenter={autoCenter}
        onAutoCenterChange={onAutoCenterChange}
      />
    </div>
  );
}
