/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, _options) => {
    config.module.rules.push({
      test: /\.md$/i,
      use: 'raw-loader',
    });

    return config;
  },
};

module.exports = nextConfig;
