/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Izinkan gambar dari Backend Vercel/Localhost
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.vercel.app" },
      { protocol: "http", hostname: "localhost" },
    ],
  },

  // SOLUSI UTAMA ERROR import.meta
  experimental: {
    esmExternals: "loose",
  },

  webpack: (config, { isServer }) => {
    // Memperbaiki masalah library PDF di sisi client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        canvas: false,
      };
    }

    // Mengabaikan parsing pada file binary/worker library PDF
    config.module.rules.push({
      test: /\.m?js$/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },

  // Transpile package yang sering bermasalah di Next.js
  transpilePackages: ["jspdf", "jspdf-autotable", "pdfjs-dist"],
};

module.exports = nextConfig;
