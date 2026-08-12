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

export const metadata: Metadata = {
  title: "SquadBuilder",
  description:
    "Descreva o escopo do projeto e veja o squad, custo mensal, prazo e risco de engenharia recomendados.",
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
