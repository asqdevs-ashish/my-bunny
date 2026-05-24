"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UtensilsCrossed, Home, Store, IndianRupee, Clock, ListChecks, Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { formatMealForShare, copyToClipboard } from "@/lib/share";

interface MealEntry {
  id: string;
  mealName: string;
  ingredients: string;
  isOutside: boolean;
  cost: number | null;
  notes: string | null;
  createdAt: string;
}

export function MealLogger() {
  const [mealName, setMealName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [isOutside, setIsOutside] = useState(false);
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [recentMeals, setRecentMeals] = useState<MealEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchRecentMeals();
  }, []);

  async function fetchRecentMeals() {
    try {
      const res = await fetch("/api/meals");
      if (res.ok) {
        const data = await res.json();
        setRecentMeals(data.slice(0, 5));
      }
    } catch {
      // Silently fail
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!mealName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: mealName.trim(),
          ingredients: ingredients.trim(),
          isOutside,
          cost: cost ? parseFloat(cost) : null,
          notes: notes.trim() || null,
        }),
      });

      if (res.ok) {
        setSuccessMessage("Yay! Meal logged successfully! 🎉");
        setMealName("");
        setIngredients("");
        setCost("");
        setNotes("");
        setIsOutside(false);
        setShowForm(false);
        fetchRecentMeals();
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  }

  const todayMeals = recentMeals.filter((m) => {
    const mealDate = new Date(m.createdAt).toDateString();
    return mealDate === new Date().toDateString();
  });

  const [sharedMealId, setSharedMealId] = useState<string | null>(null);

  return (
    <Card className="relative overflow-hidden group/card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UtensilsCrossed className="h-5 w-5 text-amber-500" />
          Meal Logger
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Success Message */}
        {successMessage && (
          <div className="mb-3 animate-bounce-in rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/50 p-3.5 text-sm text-green-700 dark:text-green-400 text-center font-medium shadow-sm">
            {successMessage}
          </div>
        )}

        {/* Today's Meals Summary */}
        {todayMeals.length > 0 && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Today's meals ({todayMeals.length})
            </div>
            {todayMeals.map((meal) => {
              const isShared = sharedMealId === meal.id;

              async function handleShareMeal() {
                const text = formatMealForShare(meal);
                const ok = await copyToClipboard(text);
                if (ok) {
                  setSharedMealId(meal.id);
                  setTimeout(() => setSharedMealId(null), 2000);
                }
              }

              return (
                <div
                  key={meal.id}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-2.5 text-sm shadow-sm hover:shadow-md transition-all duration-200 group/meal"
                >
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    meal.isOutside ? "bg-orange-100 dark:bg-orange-900/30" : "bg-green-100 dark:bg-green-900/30"
                  )}>
                    {meal.isOutside ? (
                      <Store className="h-3.5 w-3.5 text-orange-500" />
                    ) : (
                      <Home className="h-3.5 w-3.5 text-green-500" />
                    )}
                  </div>
                  <span className="flex-1 font-medium truncate">{meal.mealName}</span>
                  {meal.cost && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5 shrink-0 bg-secondary/50 px-2 py-0.5 rounded-full">
                      <IndianRupee className="h-3 w-3" />
                      {meal.cost}
                    </span>
                  )}
                  <button
                    onClick={handleShareMeal}
                    className="opacity-0 group-hover/meal:opacity-100 transition-all duration-200 shrink-0 flex items-center gap-1 rounded-lg bg-background/80 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-background hover:shadow-sm active:scale-90 border border-border/30"
                    title="Share this meal"
                  >
                    {isShared ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Share2 className="h-3 w-3" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Toggle Form Button */}
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            size="sm"
            className="w-full gap-2 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            <ListChecks className="h-4 w-4 text-amber-500" />
            Log What You Ate
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 animate-slide-up">
            <Input
              placeholder="What did you eat? (e.g., Paneer Butter Masala)"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              required
              className="border-amber-200/50 dark:border-amber-800/30 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/30 dark:focus:ring-amber-700/30"
            />

            <Input
              placeholder="Ingredients used (comma separated)"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="border-amber-200/50 dark:border-amber-800/30 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/30 dark:focus:ring-amber-700/30"
            />

            {/* Home vs Outside toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOutside(false)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
                  !isOutside
                    ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "border-border text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <Home className="h-4 w-4" />
                Home
              </button>
              <button
                type="button"
                onClick={() => setIsOutside(true)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
                  isOutside
                    ? "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                    : "border-border text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <Store className="h-4 w-4" />
                Outside
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Cost (₹)"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  min="0"
                  className="pl-9 border-amber-200/50 dark:border-amber-800/30 focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving || !mealName.trim()}
                size="sm"
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-300/30 dark:shadow-amber-900/30 hover:shadow-lg transition-all"
              >
                {saving ? "Saving..." : "Log Meal 🍽️"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Recent meals list */}
        {recentMeals.length > 0 && !showForm && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-muted-foreground">Recent meals</p>
            {recentMeals.slice(0, 3).map((meal) => (
              <div
                key={meal.id}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                <span>{meal.mealName}</span>
                <span className="ml-auto">{formatDate(new Date(meal.createdAt))}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
