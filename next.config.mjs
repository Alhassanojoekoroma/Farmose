import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  webpack(config) {
    config.resolve.alias["cloudflare:workers"] = path.resolve(__dirname, "lib/cloudflare-workers-shim.ts");
    return config;
  },
};

export default nextConfig;
