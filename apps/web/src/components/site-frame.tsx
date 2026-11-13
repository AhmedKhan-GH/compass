import type { ReactNode } from "react";
import { AppFrame, CommandBar, Spacer, StatusBar, StatusItem, ThemeSwitch, Trail } from "@compass/ui";
import { Brand } from "./brand";

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
          <Brand />
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
