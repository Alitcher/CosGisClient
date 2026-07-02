import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CosoraAtlas — Nordic & Baltic",
  description:
    "Find every anime con near you, plus the cafés, malls and photo spots that welcome cosplayers — across Helsinki, Vantaa & Espoo.",
};

// Runs before paint to set the theme and avoid a flash of the wrong mode.
const themeInit = `(function(){try{var k='cosplaymap-theme';var s=localStorage.getItem(k);var m=window.matchMedia('(prefers-color-scheme: light)').matches;document.documentElement.setAttribute('data-theme',s||(m?'light':'dark'));}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
