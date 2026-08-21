import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O selo "N" do próprio Next.js (dev-only) foi confundido com um elemento da UI numa revisão
  // externa — desligado pra não repetir a confusão. Nunca aparece em build de produção de todo jeito.
  devIndicators: false,
  // O next dev injeta um bloco de aviso de versão no CLAUDE.md/AGENTS.md a cada start — esse
  // arquivo é a documentação do produto, não lugar pra nota genérica de framework.
  agentRules: false,
};

export default nextConfig;
