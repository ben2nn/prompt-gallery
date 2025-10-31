/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 输出配置 - 静态导出
  output: 'export',
  // 输出目录 - 输出到项目根目录的 out
  distDir: '../out',
  // 禁用图片优化，直接使用原始图片 URL
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
