/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
      optimizeCss: false,
    },
    webpack: (config) => {
      config.resolve.fallback = { fs: false, path: false }
      return config
    }
  }
  
  export default nextConfig