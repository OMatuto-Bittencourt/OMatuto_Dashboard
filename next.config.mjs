/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  // NEXT_DIST_DIR permite um segundo `next dev` (ex.: testes) sem disputar a pasta .next do servidor principal.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
