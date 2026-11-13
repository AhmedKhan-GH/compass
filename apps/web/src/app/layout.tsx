import "@fontsource/source-code-pro/400.css";
import "@compass/ui/styles.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Compass", template: "%s · Compass" },
};

export const viewport: Viewport = { colorScheme: "dark" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* The pinned Sternbild release: the roles, the display and text faces. Synced by scripts/sync-assets.mjs. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/sternbild/design/1.0.0/sternbild.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
