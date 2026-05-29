"use client";

import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Circle,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Satellite, Map as MapIcon } from "lucide-react";
import type { LocationUpdate } from "@/hooks/use-location-sharing";
import type { GeofenceZoneData } from "./live-map";
import { haversineDistance, formatDistance } from "@/lib/location/haversine";

// ─── Fix default marker icon ──────────────────────────────────
// Leaflet's default icons break in bundlers; use a simple SVG-based approach
const createMarkerIcon = (color: string, pulse: boolean = false) =>
  L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: ${pulse ? 20 : 16}px;
        height: ${pulse ? 20 : 16}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ${pulse ? "animation: pulse-marker 1.5s infinite;" : ""}
      "/>
    `,
    iconSize: pulse ? [20, 20] : [16, 16],
    iconAnchor: pulse ? [10, 10] : [8, 8],
  });

// ─── Fit bounds helper ────────────────────────────────────────

function FitBounds({
  myLocation,
  partnerLocation,
}: {
  myLocation: { latitude: number; longitude: number } | null;
  partnerLocation: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    const points: [number, number][] = [];
    if (myLocation) points.push([myLocation.latitude, myLocation.longitude]);
    if (partnerLocation)
      points.push([partnerLocation.latitude, partnerLocation.longitude]);

    if (points.length >= 2 && !fitted.current) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      fitted.current = true;
    } else if (points.length === 1 && !fitted.current) {
      map.setView(points[0], 13);
      fitted.current = true;
    }
  }, [map, myLocation, partnerLocation]);

  return null;
}

// ─── Map Component ────────────────────────────────────────────

interface LiveMapInnerProps {
  myLocation: { latitude: number; longitude: number } | null;
  partnerLocation: LocationUpdate | null;
  partnerName?: string;
  userName?: string;
  /** Optional trail of partner's past locations (last 24h) */
  partnerHistory?: Array<{ latitude: number; longitude: number; createdAt: string }>;
  /** Geofence zones to display on the map */
  geofenceZones?: GeofenceZoneData[];
  /** Called when user clicks on the map to create a zone */
  onMapClick?: (lat: number, lng: number) => void;
}

export function LiveMapInner({
  myLocation,
  partnerLocation,
  partnerName = "Partner",
  userName = "You",
  partnerHistory = [],
  geofenceZones = [],
  onMapClick,
}: LiveMapInnerProps) {
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");

  const center = useMemo(() => {
    if (myLocation) return [myLocation.latitude, myLocation.longitude] as [number, number];
    if (partnerLocation)
      return [partnerLocation.latitude, partnerLocation.longitude] as [number, number];
    return [20.5937, 78.9629] as [number, number]; // Default: India center
  }, [myLocation, partnerLocation]);

  const distance = useMemo(() => {
    if (myLocation && partnerLocation) {
      return haversineDistance(
        myLocation.latitude,
        myLocation.longitude,
        partnerLocation.latitude,
        partnerLocation.longitude
      );
    }
    return null;
  }, [myLocation, partnerLocation]);

  const partnerColor = "#f43f5e"; // rose-500
  const userColor = "#3b82f6"; // blue-500

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-full w-full z-0"
      zoomControl={false}
      attributionControl={false}
    >
      {/* Tile Layer: Street (CartoDB Positron) or Satellite (ESRI) */}
      {mapStyle === "street" ? (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
      ) : (
        <TileLayer
          attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
      )}

      {/* Custom Zoom Control (relocated) */}
      <ZoomControl position="bottomright" />

      {/* Fit bounds to show both markers */}
      <FitBounds myLocation={myLocation} partnerLocation={partnerLocation} />

      {/* Map click handler for adding geofence zones */}
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

      {/* Partner Marker */}
      {partnerLocation && (
        <>
          <Marker
            position={[partnerLocation.latitude, partnerLocation.longitude]}
            icon={createMarkerIcon(partnerColor, true)}
          >
            <Popup>
              <div className="text-center min-w-[120px]">
                <p className="font-semibold text-sm">{partnerName} 💕</p>
                {distance !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistance(distance)} away
                  </p>
                )}
                {partnerLocation.accuracy && (
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    ±{Math.round(partnerLocation.accuracy)}m accuracy
                  </p>
                )}
                {partnerLocation.timestamp && (
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {new Date(partnerLocation.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
          {/* Accuracy circle */}
          {partnerLocation.accuracy && partnerLocation.accuracy > 0 && (
            <Circle
              center={[partnerLocation.latitude, partnerLocation.longitude]}
              radius={partnerLocation.accuracy}
              pathOptions={{
                color: partnerColor,
                fillColor: partnerColor,
                fillOpacity: 0.08,
                weight: 1,
              }}
            />
          )}
        </>
      )}

      {/* My Location Marker */}
      {myLocation && (
        <>
          <Marker
            position={[myLocation.latitude, myLocation.longitude]}
            icon={createMarkerIcon(userColor)}
          >
            <Popup>
              <div className="text-center min-w-[120px]">
                <p className="font-semibold text-sm">{userName} 📍</p>
                {distance !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistance(distance)} from partner
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
          {/* Accuracy circle */}
          {/* Note: accuracy for self is not passed in props yet; could add */}
        </>
      )}

      {/* Partner movement path (history trail) */}
      {partnerHistory.length >= 2 && (
        <MovementPath history={partnerHistory} />
      )}

      {/* Geofence Zones */}
      {geofenceZones.length > 0 && (
        <GeofenceZonesLayer zones={geofenceZones} />
      )}

      {/* Distance line between markers */}
      {myLocation && partnerLocation && distance !== null && (
        <DistanceLine
          from={[myLocation.latitude, myLocation.longitude]}
          to={[partnerLocation.latitude, partnerLocation.longitude]}
          distance={distance}
        />
      )}

      {/* Custom Map Controls */}
      <MapControls
        myLocation={myLocation}
        mapStyle={mapStyle}
        onStyleChange={setMapStyle}
      />

      {/* Custom Minimal Attribution */}
      <div className="leaflet-bottom leaflet-right">
        <div className="map-attribution">
          {mapStyle === "street" ? (
            <>
              ©{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
                OSM
              </a>
            </>
          ) : (
            <>© Esri</>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="leaflet-bottom leaflet-left">
        <div className="leaflet-control leaflet-bar bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-2 rounded-xl shadow-lg m-2 border border-border/30">
          <div className="flex items-center gap-2 text-xs">
            <span
              className="inline-block w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ background: partnerColor }}
            />
            <span>{partnerName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs mt-1">
            <span
              className="inline-block w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ background: userColor }}
            />
            <span>You</span>
          </div>
        </div>
      </div>
    </MapContainer>
  );
}

// ─── Movement Path Component ─────────────────────────────────

function MovementPath({
  history,
}: {
  history: Array<{ latitude: number; longitude: number; createdAt: string }>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || history.length < 2) return;

    const latlngs: [number, number][] = history.map((h) => [h.latitude, h.longitude]);

    // Main trail polyline (solid, semi-transparent)
    const trail = L.polyline(latlngs, {
      color: "#f43f5e",
      weight: 3,
      opacity: 0.5,
    }).addTo(map);

    // Glow effect (thicker, more transparent, underneath)
    const glow = L.polyline(latlngs, {
      color: "#f43f5e",
      weight: 7,
      opacity: 0.12,
    }).addTo(map);

    // Dotted overlay
    const dots = L.polyline(latlngs, {
      color: "#f43f5e",
      weight: 1,
      opacity: 0.3,
      dashArray: "4, 8",
    }).addTo(map);

    return () => {
      map.removeLayer(trail);
      map.removeLayer(glow);
      map.removeLayer(dots);
    };
  }, [map, history]);

  return null;
}

// ─── Geofence Zones Layer ─────────────────────────────────────

function GeofenceZonesLayer({
  zones,
}: {
  zones: GeofenceZoneData[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || zones.length === 0) return;

    const layers: L.Circle[] = [];

    for (const zone of zones) {
      if (!zone.enabled) continue;

      // Filled circle for the zone
      const circle = L.circle([zone.latitude, zone.longitude], {
        radius: zone.radius,
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.08,
        weight: 2,
        opacity: 0.5,
      }).addTo(map);

      // Label marker
      const label = L.marker([zone.latitude, zone.longitude], {
        icon: L.divIcon({
          className: "geofence-label",
          html: `<div style="
            background: ${zone.color};
            color: white;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            opacity: 0.85;
          ">${zone.name}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false,
      }).addTo(map);

      layers.push(circle);
    }

    return () => {
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [map, zones]);

  return null;
}

// ─── Map Click Handler Component ────────────────────────────────

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ─── Distance Line Component ──────────────────────────────────

function DistanceLine({
  from,
  to,
  distance,
}: {
  from: [number, number];
  to: [number, number];
  distance: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const polyline = L.polyline([from, to], {
      color: "#f43f5e",
      weight: 2,
      opacity: 0.6,
      dashArray: "8, 8",
    }).addTo(map);

    // Add midpoint label
    const mid: [number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2,
    ];
    const label = L.marker(mid, {
      icon: L.divIcon({
        className: "distance-label",
        html: `<div style="
          background: rgba(244,63,94,0.9);
          color: white;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        ">${formatDistance(distance)}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
      interactive: false,
    }).addTo(map);

    return () => {
      map.removeLayer(polyline);
      map.removeLayer(label);
    };
  }, [map, from, to, distance]);

  return null;
}

// ─── Map Controls (Locate + Layer Switcher) ────────────────────

function MapControls({
  myLocation,
  mapStyle,
  onStyleChange,
}: {
  myLocation: { latitude: number; longitude: number } | null;
  mapStyle: "street" | "satellite";
  onStyleChange: (style: "street" | "satellite") => void;
}) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = useCallback(() => {
    if (myLocation) {
      map.flyTo([myLocation.latitude, myLocation.longitude], 14, {
        duration: 1,
      });
    } else {
      // If no location prop, try browser geolocation directly
      setLocating(true);
      map.locate({ setView: true, maxZoom: 14, enableHighAccuracy: true });
      map.once("locationfound", () => setLocating(false));
      map.once("locationerror", () => setLocating(false));
    }
  }, [map, myLocation]);

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar flex flex-col gap-1.5 p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-lg border border-border/30">
        {/* Layer Switcher */}
        <div className="flex rounded-lg overflow-hidden border border-border/40">
          <button
            onClick={(e) => { e.stopPropagation(); onStyleChange("street"); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium transition-all ${
              mapStyle === "street"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            title="Street map"
          >
            <MapIcon className="h-3 w-3" />
            <span>Map</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onStyleChange("satellite"); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium transition-all ${
              mapStyle === "satellite"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            title="Satellite view"
          >
            <Satellite className="h-3 w-3" />
            <span>Sat</span>
          </button>
        </div>

        {/* Separator */}
        <div className="h-px bg-border/40 mx-1" />

        {/* My Location Button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleLocate(); }}
          disabled={locating}
          className={`flex items-center justify-center w-full gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
            locating
              ? "opacity-50 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95"
          }`}
          title="Center on my location"
        >
          <LocateFixed
            className={`h-3.5 w-3.5 ${locating ? "animate-spin" : ""}`}
          />
          <span>{locating ? "Locating..." : "My Location"}</span>
        </button>
      </div>
    </div>
  );
}
