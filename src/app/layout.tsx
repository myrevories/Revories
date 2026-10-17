import type { Metadata } from "next";
import { Caveat, Figtree, Inter, Noto_Serif_Display, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// Display serif with a width axis: condensed for the big wordmark, normal elsewhere.
const display = Noto_Serif_Display({ variable: "--font-display-serif", subsets: ["latin"], style: ["normal", "italic"], axes: ["wdth"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["normal", "italic"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Revories", template: "%s · Revories" },
  description: "A calm home for your family's photos, places, and stories — with optional books.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${playfair.variable} ${figtree.variable} ${caveat.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
