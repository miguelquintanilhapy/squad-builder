import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O selo "N" do próprio Next.js (dev-only) foi confundido com um elemento da UI numa revisão
  // externa — desligado pra não repetir a confusão. Nunca aparece em build de produção de todo jeito.
  devIndicators: false,
};

export default nextConfig;
