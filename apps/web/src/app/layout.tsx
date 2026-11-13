import "@fontsource/source-code-pro/400.css";
import "@compass/ui/styles.css";
import "@compass/ui/themes/learn.css";
import "@compass/ui/themes/dark.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DEFAULT_THEME, THEME_SCRIPT } from "@compass/ui";

export const metadata: Metadata = {
  title: { default: "Compass", template: "%s · Compass" },
  // The approved mark (copied unchanged by scripts/sync-assets.mjs) and PNGs rendered from it in public/icons/.
  icons: {
    icon: [
      { url: "/sternbild/marks/compass-icon.svg", type: "image/svg+xml" },
      { url: "/icons/compass-icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/compass-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = { colorScheme: "light dark" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The stored theme is applied by the script below before the first paint, so the attribute may differ from
    // what the server rendered.
    <html lang="en" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* The pinned Sternbild release: the roles, the display and text faces. Synced by scripts/sync-assets.mjs. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/sternbild/design/1.0.0/sternbild.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
