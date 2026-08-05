import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans, Roboto_Mono } from "next/font/google";
import "./globals.css";

// Bricolage Grotesque: títulos, valores numéricos grandes, wordmark. IBM Plex Sans: todo o resto.
const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage",
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

// Mantido só pelas 2 telas antigas (SquadGrid/MetricsCards) que ainda usam font-mono
// até serem substituídas por CompositionTable/KpiStrip — remover junto com elas.
const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "SquadBuilder — Dimensione seu squad de engenharia com IA",
  description:
    "Copiloto de IA para fundadores e CTOs dimensionarem squads de engenharia, calculando custo, prazo e risco em tempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${bricolageGrotesque.variable} ${ibmPlexSans.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground-secondary">{children}</body>
    </html>
  );
}
