/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
};
export default nextConfig;
