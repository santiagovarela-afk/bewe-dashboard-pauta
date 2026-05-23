import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LenisProvider } from "@/components/fx/lenis-provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bewe · Control de Pauta · Mayo 2026",
  description:
    "Dashboard de control de campañas Meta Ads · Plan mayo 2026 · 6 campañas activas, €3.000 budget",
};

export const viewport: Viewport = {
  themeColor: "#0d0d11",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('bw_theme');if(t==='light'){var d=document.documentElement;d.classList.remove('dark');d.classList.add('light');d.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${mono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <LenisProvider />
        {children}
        <Toaster
          position="top-right"
          theme="system"
          toastOptions={{
            classNames: {
              toast:
                "!bg-card !border !border-border !text-foreground !rounded-xl",
              description: "!text-muted-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
