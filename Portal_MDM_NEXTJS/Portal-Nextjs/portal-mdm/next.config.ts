import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

/**
 * Bundle analyzer activado bajo `ANALYZE=true`. Corre:
 *   ANALYZE=true npm run build
 * Genera HTML interactivo en `.next/analyze/` con cliente + servidor.
 * Útil para ver si lucide-react se tree-shake bien, si Plotly se quedó
 * fuera del bundle inicial, y quién está pesando.
 */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval requerido por Next.js dev + Plotly
      "style-src 'self' 'unsafe-inline'",                // unsafe-inline requerido por Tailwind/Radix
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"),
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  allowedDevOrigins: ["172.16.50.30", "localhost"],
} as any;

export default withBundleAnalyzer(nextConfig);
