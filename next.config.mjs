const siteHost = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host
  : null;

const allowedOrigins = [
  ...(siteHost ? [siteHost] : []),
  ...(process.env.NODE_ENV === "development"
    ? ["localhost:3000", "*.app.github.dev"]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
