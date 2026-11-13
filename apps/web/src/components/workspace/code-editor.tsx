"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { basicSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { StreamLanguage, indentUnit, type StreamParser } from "@codemirror/language";
import { verilog } from "@codemirror/legacy-modes/mode/verilog";
import { vhdl } from "@codemirror/legacy-modes/mode/vhdl";
import { python } from "@codemirror/legacy-modes/mode/python";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { codeEditorTheme } from "./code-editor-theme";

/** The editor languages this site knows, by the course's `language`. Any other language is edited as text. */
const LANGUAGES: Record<string, StreamParser<unknown>> = {
  verilog: verilog as StreamParser<unknown>,
  vhdl: vhdl as StreamParser<unknown>,
  python: python as StreamParser<unknown>,
};

export type CursorPosition = { line: number; column: number };

export type EditorHandle = {
  focus: () => void;
  /** Selects from one position to another (1-based lines and columns), scrolls it into view and focuses. */
  select: (from: CursorPosition, to: CursorPosition) => void;
};

type Props = {
  /** Which document is open; each keeps its own undo history. */
  docKey: string;
  value: string;
  onChange?: (value: string) => void;
  onCursor?: (position: CursorPosition) => void;
  readOnly?: boolean;
  language: string;
  indent: number;
  label: string;
};

/**
 * CodeMirror 6. One view; each document keeps its own state, so switching files keeps undo history. A value that
 * changes from outside (a reset, a restored run) replaces the document in place.
 */
export const CodeEditor = forwardRef<EditorHandle, Props>(function CodeEditor(
  { docKey, value, onChange, onCursor, readOnly = false, language, indent, label },
  handle,
) {
  const element = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const states = useRef(new Map<string, EditorState>());
  const openKey = useRef(docKey);
  const callbacks = useRef({ onChange, onCursor });
  useEffect(() => {
    callbacks.current = { onChange, onCursor };
  });

  useImperativeHandle(
    handle,
    () => ({
      focus: () => view.current?.focus(),
      select: (from, to) => {
        const editor = view.current;
        if (!editor) return;
        const doc = editor.state.doc;
        const offset = (position: CursorPosition) => {
          const line = doc.line(Math.max(1, Math.min(doc.lines, position.line)));
          return line.from + Math.max(0, Math.min(line.length, position.column - 1));
        };
        const anchor = offset(from);
        const head = Math.max(anchor, offset(to));
        editor.dispatch({ selection: { anchor, head }, effects: EditorView.scrollIntoView(anchor, { y: "center" }) });
        editor.focus();
      },
    }),
    [],
  );

  // The configuration of a document: everything but its text.
  const configure = useRef((readOnlyDoc: boolean): Extension[] => {
    const parser = LANGUAGES[language];
    return [
      basicSetup,
      codeEditorTheme(),
      ...(parser ? [StreamLanguage.define(parser)] : []),
      EditorState.tabSize.of(indent),
      indentUnit.of(" ".repeat(indent)),
      EditorState.readOnly.of(readOnlyDoc),
      EditorView.editable.of(!readOnlyDoc),
      ...(readOnlyDoc ? [] : [keymap.of([indentWithTab])]),
      EditorView.contentAttributes.of({ "aria-label": label, "aria-readonly": String(readOnlyDoc) }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !readOnlyDoc) callbacks.current.onChange?.(update.state.doc.toString());
        if (update.docChanged || update.selectionSet || update.focusChanged) {
          const head = update.state.selection.main.head;
          const line = update.state.doc.lineAt(head);
          callbacks.current.onCursor?.({ line: line.number, column: head - line.from + 1 });
        }
      }),
    ];
  });

  useEffect(() => {
    if (!element.current) return;
    const editor = new EditorView({
      parent: element.current,
      state: EditorState.create({ doc: value, extensions: configure.current(readOnly) }),
    });
    view.current = editor;
    const saved = states.current;
    return () => {
      saved.clear();
      view.current = null;
      editor.destroy();
    };
    // The view is created once; documents and values are swapped in the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switching documents: keep the old state, restore or create the new one.
  useEffect(() => {
    const editor = view.current;
    if (!editor || openKey.current === docKey) return;
    states.current.set(openKey.current, editor.state);
    openKey.current = docKey;
    const saved = states.current.get(docKey);
    editor.setState(
      saved && saved.doc.toString() === value
        ? saved
        : EditorState.create({ doc: value, extensions: configure.current(readOnly) }),
    );
  }, [docKey, value, readOnly]);

  // A value changed from outside replaces the text, as one undoable change.
  useEffect(() => {
    const editor = view.current;
    if (!editor || openKey.current !== docKey) return;
    if (editor.state.doc.toString() !== value)
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }, [value, docKey]);

  return <div ref={element} className="code-editor" />;
});
