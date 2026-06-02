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
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["health", "lifestyle", "wellness"],
  };
}
