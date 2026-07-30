import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

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
    <html lang="pt-BR" className={`${roboto.variable} ${robotoMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground-secondary">{children}</body>
    </html>
  );
}
