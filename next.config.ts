import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow admin-uploaded images served from Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default nextConfig;
