/** @type {import('next').NextConfig} */
const nextConfig = {
  // 기존 eslint, typescript 설정
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // rewrites 설정을 여기에 합쳐줍니다.
  async rewrites() {
    return [
      {
        source: "/api/:path*", // 프론트에서 /api/ 로 시작하는 모든 요청을
        destination: "http://65.0.101.130/api/:path*", // 실제 백엔드 주소로 전달
      },
    ];
  },
};

// module.exports만 사용합니다.
module.exports = nextConfig;
