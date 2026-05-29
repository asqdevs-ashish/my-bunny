"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Nav } from "@/components/nav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LiveMap } from "@/components/location/live-map";
import { LocationToggle } from "@/components/location/location-toggle";
import { DistanceBadge } from "@/components/location/distance-badge";
import { TrackingStatus } from "@/components/location/tracking-status";
import { LocationTimeline } from "@/components/location/location-timeline";
import { GeofenceManager } from "@/components/location/geofence-manager";
import { useLocationSharing } from "@/hooks/use-location-sharing";
import type { HistoryEntry } from "@/components/location/location-timeline";
import type { GeofenceZoneData } from "@/components/location/live-map";
import {
  ArrowLeft,
  MapPin,
  Loader2,
  History,
  Bell,
  Map as MapIcon,
  Check,
  X,
  Home,
  Briefcase,
  Dumbbell,
  Heart,
} from "lucide-react";

interface LocationClientProps {
  userName?: string;
}

export function LocationClient({ userName = "You" }: LocationClientProps) {
  const { data: session } = useSession();
  const myName = session?.user?.name || userName;
  const [partnerName, setPartnerName] = useState<string>("Partner");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerHistory, setPartnerHistory] = useState<HistoryEntry[]>([]);
  const [geofenceZones, setGeofenceZones] = useState<GeofenceZoneData[]>([]);
  const [geofenceAlerts, setGeofenceAlerts] = useState<
    Array<{
      id: string;
      zoneName: string;
      zoneColor: string;
      eventType: "ENTERED" | "EXITED";
      partnerUserId: string;
      createdAt: string;
    }>
  >([]);

  // Map click → zone creation state
  const [pendingZoneClick, setPendingZoneClick] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneRadius, setNewZoneRadius] = useState(200);
  const [newZoneColor, setNewZoneColor] = useState("#22c55e");
  const [creatingZone, setCreatingZone] = useState(false);

  const ZONE_PRESETS = [
    { name: "Home", color: "#22c55e", icon: Home },
    { name: "Office", color: "#3b82f6", icon: Briefcase },
    { name: "Gym", color: "#f97316", icon: Dumbbell },
    { name: "Fav Place", color: "#f43f5e", icon: Heart },
  ];

  const resetPendingZone = useCallback(() => {
    setPendingZoneClick(null);
    setNewZoneName("");
    setNewZoneRadius(200);
    setNewZoneColor("#22c55e");
    setCreatingZone(false);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingZoneClick({ lat, lng });
    setNewZoneName("");
    setNewZoneRadius(200);
    setNewZoneColor("#22c55e");
  }, []);

  const handleCreateZone = useCallback(async () => {
    if (!pendingZoneClick || !newZoneName.trim()) return;
    setCreatingZone(true);
    try {
      const res = await fetch("/api/location/geofence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newZoneName.trim(),
          latitude: pendingZoneClick.lat,
          longitude: pendingZoneClick.lng,
          radius: newZoneRadius,
          color: newZoneColor,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeofenceZones((prev) => [...prev, data.zone]);
        // Also add to geofenceAlerts display if needed
        resetPendingZone();
      }
    } catch {} finally {
      setCreatingZone(false);
    }
  }, [pendingZoneClick, newZoneName, newZoneRadius, newZoneColor, resetPendingZone]);

  const {
    isSharing,
    partnerIsSharing,
    myLocation,
    partnerLocation,
    distanceKm,
    distanceText,
    isSupported,
    error,
    wakeLockActive,
    loading,
    toggleSharing,
    refresh,
  } = useLocationSharing();

  // Fetch partner name & history
  useEffect(() => {
    fetch("/api/partner/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.linked && data.partner) {
          setPartnerName(data.partner.name);
          setPartnerId(data.partner.id);
        }
      })
      .catch(() => {});

    // Fetch partner's location history for trail visualization
    fetch("/api/location/history")
      .then((res) => res.json())
      .then((data) => {
        setPartnerHistory(data.history || []);
      })
      .catch(() => {});

    // Fetch geofence zones for map display
    fetch("/api/location/geofence")
      .then((res) => res.json())
      .then((data) => {
        setGeofenceZones(data.zones || []);
      })
      .catch(() => {});

    // Fetch recent geofence alerts
    fetch("/api/location/geofence/alerts")
      .then((res) => res.json())
      .then((data) => {
        setGeofenceAlerts(data.alerts || []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-500" />
                Live Location
              </h1>
              <p className="text-xs text-muted-foreground">
                Share your location in real-time with {partnerName}
              </p>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-3 text-xs text-red-700 dark:text-red-400 animate-slide-up">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Map — spans 2 cols */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-2 sm:p-3 h-full">
                {loading ? (
                  <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="h-[400px] sm:h-[500px]">
                    <LiveMap
                      myLocation={myLocation}
                      partnerLocation={partnerLocation}
                      partnerName={partnerName}
                      userName={myName}
                      partnerHistory={partnerHistory}
                      geofenceZones={geofenceZones}
                      onMapClick={handleMapClick}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Toggle Button */}
            <Card>
              <CardContent className="p-4">
                <LocationToggle
                  isSharing={isSharing}
                  isSupported={isSupported}
                  onToggle={toggleSharing}
                />
              </CardContent>
            </Card>

            {/* Tracking Status */}
            <Card>
              <CardContent className="p-4">
                <TrackingStatus
                  isSharing={isSharing}
                  partnerIsSharing={partnerIsSharing}
                  wakeLockActive={wakeLockActive}
                  partnerName={partnerName}
                  userName={myName}
                />
              </CardContent>
            </Card>

            {/* Distance */}
            <Card>
              <CardContent className="p-4">
                <DistanceBadge
                  distanceKm={distanceKm}
                  partnerIsSharing={partnerIsSharing}
                  partnerName={partnerName}
                />
              </CardContent>
            </Card>            
          </div>
        </div>

        {/* Location History Timeline */}
        {partnerId && (
          <section className="animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                {partnerName}&apos;s Location History
              </h2>
              <span className="text-[10px] text-muted-foreground">(Last 24 hours)</span>
            </div>
            <LocationTimeline
              partnerName={partnerName}
              autoRefresh={true}
            />
          </section>
        )}

        {/* Geofence Zones */}
        {partnerId && (
          <section className="animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <MapIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Geofence Zones
              </h2>
              <span className="text-[10px] text-muted-foreground">
                Get notified when {partnerName} enters or leaves an area
              </span>
            </div>
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <GeofenceManager
                partnerId={partnerId}
                initialZones={geofenceZones}
                onZonesChange={setGeofenceZones}
              />

              {/* Recent Alerts */}
              <div className="rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 p-3 border-b border-border/50">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Recent Alerts</span>
                </div>
                {geofenceAlerts.length === 0 ? (
                  <div className="py-6 text-center px-4">
                    <Bell className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      No geofence alerts yet. Add zones above and wait for your partner to enter or exit.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto">
                    {geofenceAlerts.slice(0, 20).map((alert) => {
                      const isEntered = alert.eventType === "ENTERED";
                      return (
                        <div
                          key={alert.id}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: isEntered
                                ? alert.zoneColor
                                : "transparent",
                              border: isEntered
                                ? "none"
                                : `2px solid ${alert.zoneColor}`,
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground">
                              {alert.partnerUserId === session?.user?.id
                                ? "You"
                                : partnerName}{" "}
                              {isEntered ? "entered" : "left"}{" "}
                              <span
                                className="font-medium"
                                style={{ color: alert.zoneColor }}
                              >
                                {alert.zoneName}
                              </span>
                            </p>
                            <p className="text-[10px] text-muted-foreground/60">
                              {new Date(alert.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Partner Link disclaimer */}
        {!partnerId && !loading && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 p-4 text-center">
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              Link with a partner first to share locations
            </p>
            <Link href="/dashboard">
              <Button variant="link" className="text-xs mt-1">
                Go to Dashboard →
              </Button>
            </Link>
          </div>
        )}

        {/* ─── Map Click → Create Zone Dialog ───────────────── */}
        {pendingZoneClick && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-3 overflow-hidden animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  <h3 className="text-sm font-semibold">Create Geofence Zone</h3>
                </div>
                <button
                  onClick={resetPendingZone}
                  className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Coordinates preview */}
                <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground">Selected Location</p>
                  <p className="text-xs font-mono font-medium mt-0.5">
                    {pendingZoneClick.lat.toFixed(6)}, {pendingZoneClick.lng.toFixed(6)}
                  </p>
                </div>

                {/* Name input */}
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
                    Zone Name
                  </label>
                  <input
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="e.g. Home, Office, Gym..."
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"
                    autoFocus
                  />
                  {/* Preset chips */}
                  <div className="flex gap-1.5 mt-2">
                    {ZONE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setNewZoneName(preset.name);
                          setNewZoneColor(preset.color);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                          newZoneName === preset.name
                            ? "border-foreground/40 bg-foreground/5"
                            : "border-border hover:border-foreground/30"
                        }`}
                      >
                        <preset.icon className="h-3 w-3" style={{ color: preset.color }} />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Radius slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-medium text-muted-foreground">
                      Radius
                    </label>
                    <span className="text-[10px] font-mono text-muted-foreground/70">
                      {newZoneRadius}m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    value={newZoneRadius}
                    onChange={(e) => setNewZoneRadius(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-rose-500 bg-muted"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-0.5">
                    <span>10m</span>
                    <span>500m</span>
                    <span>1000m</span>
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {["#22c55e", "#3b82f6", "#f97316", "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6", "#eab308"].map(
                      (color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewZoneColor(color)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            newZoneColor === color
                              ? "border-foreground scale-110"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 p-4 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs"
                  onClick={resetPendingZone}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-9 gap-1.5 text-xs"
                  disabled={creatingZone || !newZoneName.trim()}
                  onClick={handleCreateZone}
                >
                  {creatingZone ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  {creatingZone ? "Creating..." : "Create Zone"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
