"use client";
import dynamic from "next/dynamic";
import type { ItemView } from "@compass/schema";
import { AppFrame, CommandBar, StatusBar } from "@compass/ui";
import { Brand } from "../brand";
import type { WorkspaceCourse } from "./workspace";
import "./workspace.css";

// The workspace reads the draft from local storage when it starts and runs CodeMirror, so it renders in the
// browser only. The frame stands in place until it loads.
const Workspace = dynamic(() => import("./workspace"), {
  ssr: false,
  loading: () => (
    <AppFrame
      commandBar={
        <CommandBar>
          <Brand />
        </CommandBar>
      }
      statusBar={<StatusBar>{null}</StatusBar>}
    >
      {null}
    </AppFrame>
  ),
});

export function WorkspaceLoader({ course, item }: { course: WorkspaceCourse; item: ItemView }) {
  return <Workspace course={course} item={item} />;
}
