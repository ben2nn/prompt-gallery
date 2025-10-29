/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 图片配置 - Cloudflare Pages 不支持 Next.js Image Optimization
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
