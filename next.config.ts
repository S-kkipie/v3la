import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const walletCsp = isDev
    ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "connect-src 'self' ws: wss: http: https:",
          "img-src 'self' data: blob:",
          "object-src 'none'",
          "base-uri 'none'",
          "frame-ancestors 'self'",
      ].join("; ")
    : [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "connect-src 'self' https:",
          "img-src 'self' data: blob:",
          "object-src 'none'",
          "base-uri 'none'",
          "frame-ancestors 'self'",
      ].join("; ");

const nextConfig: NextConfig = {
    serverExternalPackages: ["ws"],
    async headers() {
        return [
            {
                source: "/wallet",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: walletCsp,
                    },
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
