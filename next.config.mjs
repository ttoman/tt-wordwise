/** @type {import('next').NextConfig} */
export default {
  // ⛔  Tell Next.js: “ignore TS errors when you build”
  typescript: {
    ignoreBuildErrors: true,
  },

  // (optional) also ignore ESLint failures, if you like
  eslint: {
    ignoreDuringBuilds: true,
  },
};
