"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Home,
  Briefcase,
  Dumbbell,
  Heart,
  AlertTriangle,
  X,
  Check,
  Crosshair,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

import type { GeofenceZoneData } from "./live-map";

interface GeofenceManagerProps {
  partnerId: string | null;
  /** Initial zones from parent (avoids redundant fetch) */
  initialZones?: GeofenceZoneData[];
  /** Called when zones are created/updated/deleted so parent can sync */
  onZonesChange?: (zones: GeofenceZoneData[]) => void;
}

// ─── Preset zone suggestions ──────────────────────────────────

const PRESETS = [
  { name: "Home", icon: Home, color: "#22c55e" },
  { name: "Office", icon: Briefcase, color: "#3b82f6" },
  { name: "Gym", icon: Dumbbell, color: "#f97316" },
  { name: "Fav Place", icon: Heart, color: "#f43f5e" },
];

// ─── Component ────────────────────────────────────────────────

export function GeofenceManager({ partnerId, initialZones = [], onZonesChange }: GeofenceManagerProps) {
  const [zones, setZones] = useState<GeofenceZoneData[]>(initialZones);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // New zone form state
  const [newName, setNewName] = useState("");
  const [newLat, setNewLat] = useState("");
  const [newLng, setNewLng] = useState("");
  const [newRadius, setNewRadius] = useState("200");
  const [newColor, setNewColor] = useState("#22c55e");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // ─── Edit zone state ─────────────────────────────────────

  const [editingZone, setEditingZone] = useState<GeofenceZoneData | null>(null);
  const [editName, setEditName] = useState("");
  const [editRadius, setEditRadius] = useState(200);
  const [editColor, setEditColor] = useState("#22c55e");
  const [editSaving, setEditSaving] = useState(false);

  // ─── Delete confirmation state ───────────────────────────

  const [deletingZone, setDeletingZone] = useState<GeofenceZoneData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openEditDialog = useCallback((zone: GeofenceZoneData) => {
    setEditingZone(zone);
    setEditName(zone.name);
    setEditRadius(zone.radius);
    setEditColor(zone.color);
    setEditSaving(false);
  }, []);

  const closeEditDialog = useCallback(() => {
    setEditingZone(null);
    setEditName("");
    setEditRadius(200);
    setEditColor("#22c55e");
    setEditSaving(false);
  }, []);

  const saveEditZone = useCallback(async () => {
    if (!editingZone || !editName.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/location/geofence/${editingZone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          radius: editRadius,
          color: editColor,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedZones = zones.map((z) =>
          z.id === editingZone.id ? { ...z, ...data.zone } : z
        );
        setZones(updatedZones);
        onZonesChange?.(updatedZones);
        closeEditDialog();
      }
    } catch {} finally {
      setEditSaving(false);
    }
  }, [editingZone, editName, editRadius, editColor, zones, onZonesChange, closeEditDialog]);

  // Sync initialZones when parent re-fetches
  useEffect(() => {
    if (initialZones.length > 0 || loading) {
      setZones(initialZones);
      setLoading(false);
    }
  }, [initialZones]);

  // ─── Use current location (with high accuracy fallback) ──

  const useCurrentLocation = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setFormError("Geolocation is not supported in your browser");
      return;
    }

    setLocating(true);
    setFormError(null);

    const handleSuccess = (pos: GeolocationPosition) => {
      setNewLat(pos.coords.latitude.toFixed(6));
      setNewLng(pos.coords.longitude.toFixed(6));
      setLocating(false);
    };

    const handleError = (err: GeolocationPositionError) => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setFormError("Location permission denied. Allow location access in your browser settings.");
          setLocating(false);
          break;
        case err.POSITION_UNAVAILABLE:
          setFormError("Location unavailable. Try again or enter coordinates manually.");
          setLocating(false);
          break;
        case err.TIMEOUT:
          // Timeout — retry with low accuracy (faster, uses WiFi/cell towers)
          setLocating(true);
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            (retryErr) => {
              if (retryErr.code === retryErr.TIMEOUT) {
                setFormError("Location request timed out. Make sure GPS/WiFi is enabled.");
              } else {
                setFormError("Failed to get location.");
              }
              setLocating(false);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
          );
          break;
        default:
          setFormError("Failed to get location.");
          setLocating(false);
      }
    };

    // First try: high accuracy GPS
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  // ─── Toggle zone enabled ──────────────────────────────────

  const toggleZone = async (zone: GeofenceZoneData) => {
    try {
      const res = await fetch(`/api/location/geofence/${zone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !zone.enabled }),
      });
      if (res.ok) {
        const updatedZones = zones.map((z) =>
          z.id === zone.id ? { ...z, enabled: !z.enabled } : z
        );
        setZones(updatedZones);
        onZonesChange?.(updatedZones);
      }
    } catch {
      setError("Failed to update zone");
    }
  };

  // ─── Delete zone (with confirmation) ─────────────────────

  const confirmDelete = useCallback((zone: GeofenceZoneData) => {
    setDeletingZone(zone);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeletingZone(null);
    setDeleteLoading(false);
  }, []);

  const executeDelete = useCallback(async () => {
    if (!deletingZone) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/location/geofence/${deletingZone.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updatedZones = zones.filter((z) => z.id !== deletingZone.id);
        setZones(updatedZones);
        onZonesChange?.(updatedZones);
        cancelDelete();
      } else {
        setError("Failed to delete zone");
        cancelDelete();
      }
    } catch {
      setError("Failed to delete zone");
      cancelDelete();
    }
  }, [deletingZone, zones, onZonesChange, cancelDelete]);

  // ─── Create zone ──────────────────────────────────────────

  const createZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);
    const radius = parseInt(newRadius, 10);

    if (!newName.trim()) {
      setFormError("Zone name is required");
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError("Invalid latitude (-90 to 90)");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setFormError("Invalid longitude (-180 to 180)");
      return;
    }
    if (isNaN(radius) || radius < 10) {
      setFormError("Radius must be at least 10 meters");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/location/geofence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          latitude: lat,
          longitude: lng,
          radius,
          color: newColor,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedZones = [...zones, data.zone];
        setZones(updatedZones);
        onZonesChange?.(updatedZones);
        setShowForm(false);
        setNewName("");
        setNewLat("");
        setNewLng("");
        setNewRadius("200");
        setNewColor("#22c55e");
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || "Failed to create zone");
      }
    } catch {
      setFormError("Network error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Apply preset ─────────────────────────────────────────

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setNewName(preset.name);
    setNewColor(preset.color);
  };

  if (!partnerId) return null;

  return (
    <>
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Geofence Zones</span>
          {!loading && (
            <span className="text-[10px] text-muted-foreground">
              ({zones.length})
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            <X className="h-3 w-3" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          {showForm ? "Cancel" : "Add Zone"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mt-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-2 text-[10px] text-red-700 dark:text-red-400 flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Add Zone Form */}
      {showForm && (
        <form onSubmit={createZone} className="p-3 space-y-3 border-b border-border/50 bg-muted/20">
          {/* Name + Presets */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Zone Name
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Home, Office..."
              className="h-8 text-xs"
            />
            <div className="flex gap-1.5 mt-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border transition-colors",
                    newName === preset.name
                      ? "border-foreground/40 bg-foreground/5"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  <preset.icon className="h-3 w-3" style={{ color: preset.color }} />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinates */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                Coordinates
              </label>
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                {locating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Crosshair className="h-3 w-3" />
                )}
                {locating ? "Getting location..." : "Use my current location"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  value={newLat}
                  onChange={(e) => setNewLat(e.target.value)}
                  placeholder="e.g. 28.6139"
                  className="h-8 text-xs"
                  type="number"
                  step="any"
                />
              </div>
              <div>
                <Input
                  value={newLng}
                  onChange={(e) => setNewLng(e.target.value)}
                  placeholder="e.g. 77.2090"
                  className="h-8 text-xs"
                  type="number"
                  step="any"
                />
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground/50 mt-1">
              Or click "Use my current location" to auto-fill
            </p>
          </div>

          {/* Radius + Color */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Radius (meters)
              </label>
              <Input
                value={newRadius}
                onChange={(e) => setNewRadius(e.target.value)}
                placeholder="200"
                className="h-8 text-xs"
                type="number"
                min="10"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-8 w-8 rounded-md border border-border cursor-pointer bg-transparent"
                />
                <span className="text-[10px] text-muted-foreground">{newColor}</span>
              </div>
            </div>
          </div>

          {/* Form Error */}
          {formError && (
            <p className="text-[10px] text-red-500">{formError}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={saving}
            size="sm"
            className="w-full h-8 gap-1.5 text-xs"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            {saving ? "Creating..." : "Create Zone"}
          </Button>
        </form>
      )}

      {/* Zone List */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : zones.length === 0 ? (
        <div className="py-6 text-center px-4">
          <MapPin className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            No geofence zones yet. Add zones to get notified when your partner enters or leaves an area.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 transition-colors",
                !zone.enabled && "opacity-50"
              )}
            >
              {/* Color dot */}
              <div
                className="w-3 h-3 rounded-full shrink-0 ring-2 ring-background"
                style={{ backgroundColor: zone.color }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  {zone.name}
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)} &middot; {zone.radius}m radius
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditDialog(zone)}
                  className="p-1 rounded hover:bg-muted/50 transition-colors"
                  title="Edit zone"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-blue-500 transition-colors" />
                </button>
                <button
                  onClick={() => toggleZone(zone)}
                  className="p-1 rounded hover:bg-muted/50 transition-colors"
                  title={zone.enabled ? "Disable" : "Enable"}
                >
                  {zone.enabled ? (
                    <ToggleRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => confirmDelete(zone)}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete zone"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500 transition-colors" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      {/* ─── Delete Confirmation Dialog ──────────────────────────── */}
      {deletingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-3 overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h3 className="text-sm font-semibold">Delete Zone</h3>
              </div>
              <button
                onClick={cancelDelete}
                className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Are you sure you want to delete this geofence zone?
              </p>

              {/* Zone preview */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3 border border-border/30">
                <div
                  className="w-4 h-4 rounded-full shrink-0 ring-2 ring-background"
                  style={{ backgroundColor: deletingZone.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {deletingZone.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {deletingZone.latitude.toFixed(4)}, {deletingZone.longitude.toFixed(4)} &middot; {deletingZone.radius}m radius
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-red-500/80">
                This action cannot be undone. You will need to recreate the zone to set it up again.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 p-4 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs"
                onClick={cancelDelete}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 gap-1.5 text-xs bg-red-500 hover:bg-red-600"
                disabled={deleteLoading}
                onClick={executeDelete}
              >
                {deleteLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                {deleteLoading ? "Deleting..." : "Delete Zone"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Zone Dialog ──────────────────────────────────── */}
      {editingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-3 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-semibold">Edit Zone</h3>
              </div>
              <button
                onClick={closeEditDialog}
                className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Zone Name */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
                  Zone Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Zone name"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"
                  autoFocus
                />
                <div className="flex gap-1.5 mt-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setEditName(preset.name);
                        setEditColor(preset.color);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                        editName === preset.name
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

              {/* Radius Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground">
                    Radius
                  </label>
                  <span className="text-[10px] font-mono text-muted-foreground/70">
                    {editRadius}m
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  value={editRadius}
                  onChange={(e) => setEditRadius(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-rose-500 bg-muted"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-0.5">
                  <span>10m</span>
                  <span>500m</span>
                  <span>1000m</span>
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {["#22c55e", "#3b82f6", "#f97316", "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6", "#eab308"].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditColor(color)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          editColor === color
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
                onClick={closeEditDialog}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 gap-1.5 text-xs"
                disabled={editSaving || !editName.trim()}
                onClick={saveEditZone}
              >
                {editSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                {editSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
