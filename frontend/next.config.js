/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // 获取后端地址，优先使用环境变量，否则使用localhost
    const backendHost = process.env.BACKEND_HOST || 'localhost';
    const backendUrl = `http://${backendHost}:5001`;
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;