import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Firebase Storage (원본/썸네일)
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      // Google 계정 프로필 이미지 (운영자 아바타)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // 로컬 Storage 에뮬레이터
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
      // 데모/시드 이미지 (실데이터 연동 시 제거 가능)
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
