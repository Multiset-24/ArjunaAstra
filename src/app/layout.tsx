import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { ProgressProvider } from "@/lib/store/progress";
import { Header } from "@/components/shell/Header";
import { Footer } from "@/components/shell/Footer";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { siteUrl } from "@/lib/site";

const description = "From zero to Codeforces Candidate Master, plus System Design, Low-Level Design and AI Engineering. Short interactive lessons, honest guidance, real practice.";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: "teacher — calm, interactive learning", template: "%s · teacher" },
  description,
  openGraph: { type: "website", siteName: "teacher", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#17110d" },
    { media: "(prefers-color-scheme: light)", color: "#f4ede1" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `try{var t=localStorage.getItem("teacher:theme");document.documentElement.dataset.theme=t==="paper"?"paper":"dark"}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ProgressProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CommandPalette />
        </ProgressProvider>
      </body>
    </html>
  );
}
