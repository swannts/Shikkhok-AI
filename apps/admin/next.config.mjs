/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    if (config.module && config.module.rules) {
      config.module.rules.push({
        test: /\.(json|js|ts|tsx|jsx)$/,
        resourceQuery: /raw/,
        use: 'raw-loader',
      });
    }

    return config;
  },
};

export default nextConfig;
