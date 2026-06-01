"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, ExternalLink, CirclePlay } from "lucide-react";
import { useMood } from "@/lib/use-mood";

interface RecipeSuggestion {
  title: string;
  description: string;
  searchUrl: string;
}

const moodRecipes: Record<string, RecipeSuggestion[]> = {
  happy: [
    {
      title: "Paneer Butter Masala",
      description: "Celebration mode! Rich, creamy aur absolutely divine 🤤",
      searchUrl: "https://www.youtube.com/results?search_query=paneer+butter+masala+recipe",
    },
    {
      title: "Gulab Jamun",
      description: "Kuch meetha ho jaye? Perfect for your happy mood!",
      searchUrl: "https://www.youtube.com/results?search_query=gulab+jamun+recipe",
    },
    {
      title: "Veg Biryani",
      description: "Layered, aromatic aur full of flavor!",
      searchUrl: "https://www.youtube.com/results?search_query=veg+biryani+recipe+quick",
    },
    {
      title: "Masala Chai",
      description: "Celebrate with garma-garam chai aur kuch crispy!",
      searchUrl: "https://www.youtube.com/results?search_query=masala+chai+recipe",
    },
  ],
  stressed: [
    {
      title: "Masala Chai",
      description: "Ek cup chai — sab theek ho jayega. Promise! ☕",
      searchUrl: "https://www.youtube.com/results?search_query=masala+chai+recipe+indian",
    },
    {
      title: "Tomato Soup",
      description: "Warm, comforting aur soul-soothing. Comfort food at its best!",
      searchUrl: "https://www.youtube.com/results?search_query=tomato+soup+recipe+indian",
    },
    {
      title: "Khichdi",
      description: "Light, easy aur gut-friendly. Maa ke haath jaisa pyaar!",
      searchUrl: "https://www.youtube.com/results?search_query=khichdi+recipe+quick",
    },
    {
      title: "Dark Chocolate Smoothie",
      description: "Stress bhejne ka best tarika — chocolate se better kya hai?",
      searchUrl: "https://www.youtube.com/results?search_query=chocolate+smoothie+recipe+healthy",
    },
  ],
  tired: [
    {
      title: "Egg Fried Rice",
      description: "5-minute recipe! Protein-packed aur instantly energy boost 💪",
      searchUrl: "https://www.youtube.com/results?search_query=egg+fried+rice+recipe+quick",
    },
    {
      title: "Oats Upma",
      description: "Quick, healthy aur tasty — thak gaya hai toh yeh lo!",
      searchUrl: "https://www.youtube.com/results?search_query=oats+upma+recipe",
    },
    {
      title: "Banana Smoothie",
      description: "Instant energy! Banana + milk + honey = magic ✨",
      searchUrl: "https://www.youtube.com/results?search_query=banana+smoothie+recipe+quick",
    },
    {
      title: "Veg Noodles",
      description: "Classic! 2-minute mein taiyaar, instant happiness! 🍜",
      searchUrl: "https://www.youtube.com/results?search_query=veg+noodles+recipe+quick",
    },
  ],
  productive: [
    {
      title: "Protein Paneer Wrap",
      description: "High-protein lunch jo tumhe energetic rakhe!",
      searchUrl: "https://www.youtube.com/results?search_query=paneer+wrap+recipe+healthy",
    },
    {
      title: "Mixed Sprouts Salad",
      description: "Brain food! Protein se bhari, healthy aur crunchy!",
      searchUrl: "https://www.youtube.com/results?search_query=sprouts+salad+recipe+indian",
    },
    {
      title: "Moong Dal Chilla",
      description: "High-protein breakfast, perfect for a productive day!",
      searchUrl: "https://www.youtube.com/results?search_query=moong+dal+chilla+recipe",
    },
    {
      title: "Dry Fruit Laddoo",
      description: "Energy balls — healthy snack for busy schedule!",
      searchUrl: "https://www.youtube.com/results?search_query=dry+fruit+ladoo+recipe",
    },
  ],
};

const defaultRecipes = [
  {
    title: "Paneer Butter Masala",
    description: "Creamy, rich aur restaurant-style!",
    searchUrl: "https://www.youtube.com/results?search_query=paneer+butter+masala+recipe",
  },
  {
    title: "Veg Noodles",
    description: "Quick, spicy aur so delicious!",
    searchUrl: "https://www.youtube.com/results?search_query=veg+noodles+recipe",
  },
  {
    title: "Masala Dosa",
    description: "Crispy dosa with spicy potato filling!",
    searchUrl: "https://www.youtube.com/results?search_query=masala+dosa+recipe+crispy",
  },
  {
    title: "Egg Curry",
    description: "Comfort food classic — rich gravy, boiled eggs!",
    searchUrl: "https://www.youtube.com/results?search_query=egg+curry+recipe+indian",
  },
];

export function MoodRecipes() {
  const { currentMood, mounted } = useMood();

  if (!mounted) return null;

  const moodId = currentMood?.id ?? null;

  const recipes = moodId && moodRecipes[moodId]
    ? moodRecipes[moodId]
    : defaultRecipes;

  const moodLabel = moodId
    ? {
        happy: "Happy 😊",
        stressed: "Stressed 😰",
        tired: "Tired 😴",
        productive: "Productive 💪",
      }[moodId]
    : null;

  return (
    <Card className="group/card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 group-hover/card:scale-110 transition-transform">
            <ChefHat className="h-4 w-4 text-amber-500" />
          </div>
          {moodLabel ? (
            <>Recommended for {moodLabel}</>
          ) : (
            <>Recipe Ideas</>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2">
          {recipes.map((recipe, index) => (
            <a
              key={index}
              href={recipe.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group/recipe animate-fade-in flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-700 hover:scale-[1.02] active:scale-[0.98] hover:bg-gradient-to-r hover:from-white dark:hover:from-transparent"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 group-hover/recipe:bg-red-100 dark:group-hover/recipe:bg-red-900/30 transition-colors">
                <CirclePlay className="h-5 w-5 text-red-500 group-hover/recipe:scale-110 transition-transform" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground group-hover/recipe:text-rose-600 dark:group-hover/recipe:text-rose-400 transition-colors">
                    {recipe.title}
                  </p>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover/recipe:opacity-100 transition-all duration-200" />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                  {recipe.description}
                </p>
              </div>
            </a>
          ))}
        </div>


      </CardContent>
    </Card>
  );
}
