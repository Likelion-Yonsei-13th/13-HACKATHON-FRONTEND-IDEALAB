// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 빌드 중 ESLint 에러가 있어도 실패하지 않게
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 타입 에러가 있어도 빌드를 멈추지 않게 (원하면 빼도 됨)
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
