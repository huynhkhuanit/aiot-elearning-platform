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
    serverRuntimeConfig: {
        // Will only be available on the server side
        apiTimeout: 600, // 10 minutes
    },
    serverExternalPackages: ["@sendgrid/mail"],
};

export default nextConfig;
