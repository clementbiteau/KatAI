import localFont from "next/font/local";

// The three typefaces of the visual identity (T24), bundled at build time from pinned npm
// packages: no request to a font service, at build or at runtime, and nothing for the CSP
// to allow beyond 'self'. Latin subset only, as the interface is in English.

export const displayFont = localFont({
  src: "../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-display",
  display: "swap",
});

export const bodyFont = localFont({
  src: "../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-body",
  display: "swap",
});

export const monoFont = localFont({
  src: "../node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-mono",
  display: "swap",
  preload: false,
});
