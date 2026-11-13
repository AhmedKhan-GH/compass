"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { KeyButton, Pane, type Tab } from "@compass/ui";
import { CodeEditor, type CursorPosition, type EditorHandle } from "./code-editor";

export type EditorPaneHandle = {
  focus: () => void;
  /** Selects a range in `file`, opening it first when another file is open. */
  select: (file: string, from: CursorPosition, to: CursorPosition) => void;
};

type Props = {
  files: Record<string, string>;
  /** The names shown as tabs: editable files first, then read-only support files. */
  names: string[];
  editable: string[];
  active: string;
  onActive: (name: string) => void;
  onChange: (name: string, content: string) => void;
  onCursor: (position: CursorPosition) => void;
  language: string;
  indent: number;
  focused: boolean;
  /** Opens the dialog that starts the exercise over. */
  onAskReset: () => void;
  readOnlyContent: (name: string) => string;
};

/** The editor: one tab per file, the editable ones first; the reset to the starter in the header. */
export const EditorPane = forwardRef<EditorPaneHandle, Props>(function EditorPane(props, handle) {
  const {
    files,
    names,
    editable,
    active,
    onActive,
    onChange,
    onCursor,
    language,
    indent,
    focused,
    onAskReset,
    readOnlyContent,
  } = props;
  const editor = useRef<EditorHandle>(null);
  const pendingSelection = useRef<{ file: string; from: CursorPosition; to: CursorPosition } | null>(null);

  useImperativeHandle(
    handle,
    () => ({
      focus: () => editor.current?.focus(),
      select: (file, from, to) => {
        if (file === active) editor.current?.select(from, to);
        else {
          pendingSelection.current = { file, from, to };
          onActive(file);
        }
      },
    }),
    [active, onActive],
  );

  // A selection in another file waits until that file is open.
  useEffect(() => {
    const pending = pendingSelection.current;
    if (!pending || pending.file !== active) return;
    pendingSelection.current = null;
    editor.current?.select(pending.from, pending.to);
  }, [active]);

  const tabs: Tab[] = names.map((name) => ({
    id: name,
    label: name,
    detail: editable.includes(name) ? undefined : "read-only",
  }));
  const readOnly = !editable.includes(active);
  return (
    <Pane
      id="editor"
      title="Editor"
      tabs={tabs}
      activeTab={active}
      onTab={onActive}
      focused={focused}
      chord="Alt+Digit3"
      className="editor-pane"
      onFocusRequest={() => editor.current?.focus()}
      actions={
        <KeyButton chord="Alt+Shift+KeyR" onClick={onAskReset}>
          Reset
        </KeyButton>
      }
    >
      <CodeEditor
        ref={editor}
        docKey={active}
        value={readOnly ? readOnlyContent(active) : (files[active] ?? "")}
        readOnly={readOnly}
        onChange={(content) => onChange(active, content)}
        onCursor={onCursor}
        language={language}
        indent={indent}
        label={`${active}${readOnly ? ", read-only" : ""}`}
      />
    </Pane>
  );
});
