/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // 1. Izinkan akses gambar dari domain backend kamu
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app', // Mengizinkan semua domain vercel
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  experimental: {
    // 2. Membantu mengatasi error "import.meta" pada library modern
    esmExternals: 'loose', 
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        canvas: false,
      };
    }

    // Mengatasi error Webpack pada file .node atau binary jika ada
    config.module.rules.push({
      test: /\.node$/,
      use: 'raw-loader',
    });

    return config;
  },

  transpilePackages: ['jspdf', 'jspdf-autotable', 'pdfjs-dist'], // Tambahkan pdfjs-dist jika kamu menggunakannya
};

module.exports = nextConfig;
