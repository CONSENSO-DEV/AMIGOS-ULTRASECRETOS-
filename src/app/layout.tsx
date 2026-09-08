import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Amigos Ultrasecretos",
  description:
    "¿Crees saber quién se esconde detrás de cada alias? Crea un grupo, elige tu alias secreto, chatea y descubre identidades.",
  keywords: ["amigos secretos", "juego", "alias", "misterio", "detectives"],
  authors: [{ name: "Amigos Ultrasecretos" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Amigos Ultrasecretos",
    description: "Sin cuentas. Sin contraseñas. Solo secretos.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amigos Ultrasecretos",
    description: "Sin cuentas. Sin contraseñas. Solo secretos.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
      >
        <div className="bg-mystery min-h-screen flex flex-col">
          {children}
        </div>
        <Toaster />
        <SonnerToaster richColors position="top-center" />
      </body>
    </html>
  );
}
