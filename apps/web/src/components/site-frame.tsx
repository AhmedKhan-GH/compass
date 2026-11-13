import Link from "next/link";
import type { ReactNode } from "react";
import { AppFrame, CommandBar, Spacer, StatusBar, StatusItem, ThemeSwitch, Trail, Wordmark } from "@compass/ui";

/** The frame of the catalog and course pages: the command bar with the trail, the page, the status bar. */
export function SiteFrame({
  trail,
  commands,
  status,
  children,
}: {
  trail: ReactNode[];
  commands?: ReactNode;
  status?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppFrame
      commandBar={
        <CommandBar>
          <Link href="/" className="sb-wordmark-link" aria-label="Compass">
            <Wordmark>Compass</Wordmark>
          </Link>
          <Trail>{trail}</Trail>
          <Spacer />
          {commands}
        </CommandBar>
      }
      statusBar={
        <StatusBar>
          {status}
          <Spacer />
          <StatusItem>
            <ThemeSwitch />
          </StatusItem>
        </StatusBar>
      }
    >
      {children}
    </AppFrame>
  );
}
