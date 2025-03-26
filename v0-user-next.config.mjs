/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Use the experimental jsConfig option to configure the JSX transform
  experimental: {
    serverComponentsExternalPackages: [],
    // This is a more direct way to configure SWC
    swcMinifyDebugOptions: {
      compress: {
        defaults: true,
      }
    }
  }
}

export default nextConfig

