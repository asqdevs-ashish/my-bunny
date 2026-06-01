import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Bunny 💕",
    short_name: "My Bunny",
    description:
      "Your personal wellness companion",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fffbf5",
    theme_color: "#e85d75",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.jpeg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/icon-512.jpeg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/icon.jpeg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
    categories: ["health", "lifestyle", "wellness"],
  };
}
