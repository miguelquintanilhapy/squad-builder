import type { Metadata } from "next";
import { IBM_Plex_Sans, Montserrat } from "next/font/google";
import "./globals.css";

// Montserrat: títulos, valores numéricos grandes, wordmark — alternativa gratuita mais parecida
// com a Proxima Nova (paga, sem licença neste projeto). IBM Plex Sans: todo o resto.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const description =
  "Descreva o escopo do projeto e veja o squad, custo mensal, prazo e risco de engenharia recomendados.";

export const metadata: Metadata = {
  // VERCEL_URL: a Vercel preenche automaticamente em toda build (produção e preview), sem
  // precisar cadastrar a URL à mão — sem protocolo, por isso o https:// na frente. Sem isso, as
  // imagens de OG (opengraph-image.tsx) não teriam como virar URL absoluta pro link preview.
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  title: "SquadBuilder",
  description,
  // Card exibido ao colar o link (WhatsApp, Slack, X, iMessage etc.) — a imagem em si vem de
  // opengraph-image.tsx, detectada automaticamente por convenção de arquivo.
  openGraph: {
    title: "SquadBuilder",
    description,
    type: "website",
    locale: "pt_BR",
    siteName: "SquadBuilder",
  },
  twitter: {
    card: "summary_large_image",
    title: "SquadBuilder",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${ibmPlexSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink-2">{children}</body>
    </html>
  );
}
