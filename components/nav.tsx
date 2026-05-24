"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Nav() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userName = session?.user?.name || "U";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png" // public/logo.png rakhna
              alt="Logo"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="text-sm font-semibold tracking-tight">Suar's Kitchen</span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-rose-600" />
              )}
            </Button>
          )}

          {/* Profile Avatar */}
          <div className="ml-1">
            <Image
              src="/profile.png"
              alt={userName}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ring-2 ring-primary/20"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
