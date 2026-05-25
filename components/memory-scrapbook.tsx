"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Plus, Loader2, Calendar, Heart, Camera, X } from "lucide-react";
import Image from "next/image";
import Script from "next/script";
import { cn } from "@/lib/utils";

// Declare global for Cloudinary widget
declare global {
  interface Window {
    cloudinary: any;
  }
}

interface Memory {
  id: string;
  imageUrl: string;
  caption: string | null;
  date: string;
  user: { name: string };
}

export function MemoryScrapbook() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsMenuOpen] = useState(false);
  const [newMemory, setNewMemory] = useState({ imageUrl: "", caption: "", date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  useEffect(() => {
    fetchMemories();

    // Auto-refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchMemories, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMemories() {
    try {
      const res = await fetch("/api/memories");
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (error) {
      console.error("Failed to fetch memories:", error);
    } finally {
      setLoading(false);
    }
  }

  const openUploadWidget = () => {
    if (!window.cloudinary) return;

    window.cloudinary.openUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        sources: ["local", "url", "camera"],
        multiple: false,
        clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
        maxFileSize: 2000000, // 2MB
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setNewMemory(prev => ({ ...prev, imageUrl: result.info.secure_url }));
        }
      }
    );
  };

  async function handleAddMemory(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemory.imageUrl) return;
    setSaving(true);

    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemory),
      });

      if (res.ok) {
        setNewMemory({ imageUrl: "", caption: "", date: new Date().toISOString().split('T')[0] });
        setIsMenuOpen(false);
        fetchMemories();
      }
    } catch (error) {
      console.error("Failed to add memory:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="afterInteractive" />
      <Card className="relative overflow-hidden group/card border-rose-100 dark:border-rose-900/20 shadow-md">
        <CardHeader className="pb-3 border-b border-rose-50 dark:border-rose-900/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-5 w-5 text-amber-500" />
              Memory Scrapbook 📸
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isAdding)}
              className="h-8 w-8 rounded-full p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              <Plus className={cn("h-5 w-5 transition-transform duration-300", isAdding && "rotate-45")} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isAdding && (
            <form onSubmit={handleAddMemory} className="p-4 bg-rose-50/30 dark:bg-rose-900/5 border-b border-rose-100 dark:border-rose-900/20 animate-in slide-in-from-top duration-300">
              <div className="space-y-3">
                {newMemory.imageUrl ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-rose-200">
                    <Image src={newMemory.imageUrl} alt="Preview" fill className="object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setNewMemory(prev => ({ ...prev, imageUrl: "" }))}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={openUploadWidget}
                    className="w-full h-24 rounded-xl border-2 border-dashed border-rose-200 dark:border-rose-800 bg-white/50 dark:bg-black/20 flex flex-col gap-2 hover:bg-rose-50 transition-all"
                  >
                    <Camera className="h-6 w-6 text-rose-400" />
                    <span className="text-xs font-medium text-muted-foreground">Tap to Upload Photo</span>
                  </Button>
                )}
                
                <input
                  type="text"
                  placeholder="Sweet caption..."
                  value={newMemory.caption}
                  onChange={(e) => setNewMemory({ ...newMemory, caption: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-rose-300/30"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newMemory.date}
                    onChange={(e) => setNewMemory({ ...newMemory, date: e.target.value })}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-rose-300/30"
                  />
                  <Button type="submit" disabled={saving || !newMemory.imageUrl} size="sm" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-4">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="max-h-[400px] overflow-y-auto p-4 space-y-4 no-scrollbar">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-rose-300" /></div>
            ) : memories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                <ImageIcon className="h-10 w-10 mb-2" />
                <p className="text-xs italic">Add your first special photo together! 💕</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {memories.map((memory) => (
                  <div 
                    key={memory.id} 
                    onClick={() => setSelectedMemory(memory)}
                    className="group/item relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-muted cursor-pointer"
                  >
                    <Image
                      src={memory.imageUrl}
                      alt={memory.caption || "Memory"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 p-2.5 flex flex-col justify-end">
                      {memory.caption && <p className="text-[10px] text-white font-medium line-clamp-2 leading-tight">{memory.caption}</p>}
                      <p className="text-[8px] text-white/70 mt-1 flex items-center gap-1">
                        <Calendar className="h-2 w-2" />
                        {new Date(memory.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* Memory Viewer Modal */}
        {selectedMemory && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedMemory(null)}
          >
            <div 
              className="relative w-full max-w-2xl bg-card rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedMemory(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative aspect-[4/3] w-full bg-muted">
                <Image
                  src={selectedMemory.imageUrl}
                  alt={selectedMemory.caption || "Memory"}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>

              <div className="p-6 bg-gradient-to-b from-card to-secondary/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-rose-500" fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-500">A special moment</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(selectedMemory.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                
                {selectedMemory.caption ? (
                  <p className="text-base font-medium italic text-foreground leading-relaxed">
                    “{selectedMemory.caption}”
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No caption added for this memory...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
