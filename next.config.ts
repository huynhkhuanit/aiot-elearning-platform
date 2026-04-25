import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    images: {
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
    // Increase max duration for video uploads
    // Note: `serverRuntimeConfig` is deprecated in Next.js 15+ and removed in Next.js 16.
    // Use environment variables instead. See: https://nextjs.org/docs/app/api-reference/config/next-config-js/runtime-configuration
    env: {
        API_TIMEOUT: "600", // 10 minutes (in seconds) - available on both server & client
    },
    serverExternalPackages: ["@sendgrid/mail"],
};

export default nextConfig;
