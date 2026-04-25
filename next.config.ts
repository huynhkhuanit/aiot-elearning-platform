import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    productionBrowserSourceMaps: false,
    experimental: {
        // Tree-shake & optimize imports for heavy libraries with many exports.
        // Reduces initial bundle by only including used symbols.
        optimizePackageImports: [
            "lucide-react",
            "framer-motion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-progress",
            "@radix-ui/react-slider",
            "@radix-ui/react-label",
            "@radix-ui/react-slot",
            "radix-ui",
            "recharts",
            "date-fns",
            "lowlight",
        ],
        scrollRestoration: true,
    },
    images: {
        formats: ["image/avif", "image/webp"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "cdn2.fptshop.com.vn",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "caodangvietmyhanoi.edu.vn",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "i.ytimg.com",
                pathname: "/**",
            },
        ],
    },
    // Long-term caching for hashed static assets
    async headers() {
        return [
            {
                source: "/_next/static/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
            {
                source: "/assets/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
        ];
    },
    // Increase max duration for video uploads
    // Note: `serverRuntimeConfig` is deprecated in Next.js 15+ and removed in Next.js 16.
    // Use environment variables instead. See: https://nextjs.org/docs/app/api-reference/config/next-config-js/runtime-configuration
    env: {
        API_TIMEOUT: "600", // 10 minutes (in seconds) - available on both server & client
    },
    serverExternalPackages: ["@sendgrid/mail"],
};

export default nextConfig;
