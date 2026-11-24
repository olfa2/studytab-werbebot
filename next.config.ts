import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Schrift und Bildbibliothek für das Rendern der Slides mitliefern
  outputFileTracingIncludes: {
    "/api/slides/**": ["./assets/**", "./public/library/**"],
    "/entwuerfe": ["./public/library/**"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
