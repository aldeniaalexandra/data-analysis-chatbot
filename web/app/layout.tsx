import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const sans = localFont({
  src: "./fonts/SchibstedGrotesk-var.woff2",
  variable: "--font-sans",
  weight: "400 900",
  display: "swap",
});

const display = localFont({
  src: "./fonts/Sora-var.woff2",
  variable: "--font-display",
  weight: "400 800",
  display: "swap",
});

const mono = localFont({
  src: "./fonts/SplineSansMono-var.woff2",
  variable: "--font-mono",
  weight: "400 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cognitus AI",
  description:
    "Upload a CSV dataset and ask questions about it in plain language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
