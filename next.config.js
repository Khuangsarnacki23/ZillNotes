/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                hostname: "img.clerk.com",
            }
        ]
    },
    experimental: {
        images: {
            unoptimized: true,
        },
    },
}

module.exports = nextConfig
