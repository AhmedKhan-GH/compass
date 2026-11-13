import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

/**
 * The editor on the syntax roles of the theme: keywords, types, definitions, numbers, strings, comments and
 * preprocessor lines each have a hue; names and values are set in the text ink.
 */
const highlight = HighlightStyle.define([
  {
    tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.controlKeyword, tags.definitionKeyword],
    color: "var(--sb-syntax-keyword)",
  },
  { tag: [tags.typeName, tags.className, tags.namespace, tags.standard(tags.name)], color: "var(--sb-syntax-type)" },
  {
    tag: [tags.definition(tags.variableName), tags.definition(tags.name), tags.function(tags.variableName)],
    color: "var(--sb-syntax-definition)",
  },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: "var(--sb-syntax-comment)" },
  { tag: [tags.meta, tags.processingInstruction], color: "var(--sb-syntax-meta)" },
  { tag: [tags.number, tags.bool, tags.atom], color: "var(--sb-syntax-number)" },
  { tag: [tags.string, tags.special(tags.string)], color: "var(--sb-syntax-string)" },
  { tag: [tags.variableName, tags.name, tags.propertyName], color: "var(--sb-syntax-text)" },
  { tag: [tags.operator, tags.punctuation, tags.bracket, tags.separator], color: "var(--sb-syntax-operator)" },
  { tag: tags.invalid, color: "var(--sb-state-failed)", textDecoration: "underline" },
]);

export function codeEditorTheme() {
  return [
    EditorView.theme(
      {
        "&": {
          height: "100%",
          color: "var(--sb-syntax-text)",
          backgroundColor: "var(--sb-syntax-ground)",
          fontSize: "var(--sb-app-font-size-mono)",
        },
        "&.cm-focused": { outline: "none" },
        ".cm-scroller": {
          fontFamily: "var(--sb-font-family-mono)",
          lineHeight: "var(--sb-app-row)",
          overflow: "auto",
        },
        ".cm-content": { padding: "var(--sb-space-2) 0", caretColor: "var(--sb-syntax-text)" },
        ".cm-line": { padding: "0 var(--sb-space-3)" },
        ".cm-cursor, .cm-dropCursor": { borderLeft: "var(--sb-rule-width) solid var(--sb-syntax-text)" },
        "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
          { backgroundColor: "var(--sb-syntax-selection)" },
        ".cm-selectionMatch": { backgroundColor: "var(--sb-surface-hover)" },
        ".cm-activeLine": { backgroundColor: "var(--sb-syntax-active-line)" },
        ".cm-gutters": {
          backgroundColor: "var(--sb-syntax-ground)",
          color: "var(--sb-syntax-gutter)",
          border: "none",
          borderRight: "var(--sb-rule-width) solid var(--sb-rule-faint)",
        },
        ".cm-lineNumbers .cm-gutterElement": { padding: "0 var(--sb-space-2) 0 var(--sb-space-3)", minWidth: "40px" },
        ".cm-activeLineGutter": { backgroundColor: "var(--sb-syntax-active-line)", color: "var(--sb-syntax-text)" },
        ".cm-foldGutter .cm-gutterElement": { padding: "0 var(--sb-space-1)", color: "var(--sb-text-faint)" },
        "&.cm-focused .cm-matchingBracket": {
          backgroundColor: "transparent",
          outline: "var(--sb-rule-width) solid var(--sb-text-faint)",
        },
        "&.cm-focused .cm-nonmatchingBracket": {
          backgroundColor: "transparent",
          outline: "var(--sb-rule-width) solid var(--sb-state-failed)",
        },
        ".cm-searchMatch": {
          backgroundColor: "var(--sb-surface-hover)",
          outline: "var(--sb-rule-width) solid var(--sb-rule)",
        },
        ".cm-searchMatch.cm-searchMatch-selected": { outlineColor: "var(--sb-focus)" },
        ".cm-foldPlaceholder": {
          backgroundColor: "var(--sb-surface)",
          color: "var(--sb-text-muted)",
          border: "var(--sb-rule-width) solid var(--sb-rule)",
          borderRadius: "0",
        },
        ".cm-panels": {
          backgroundColor: "var(--sb-surface)",
          color: "var(--sb-text)",
          fontFamily: "var(--sb-font-family-text)",
          fontSize: "var(--sb-app-font-size-ui-small)",
        },
        ".cm-panels-top": { borderBottom: "var(--sb-rule-width) solid var(--sb-rule)" },
        ".cm-panels-bottom": { borderTop: "var(--sb-rule-width) solid var(--sb-rule)" },
        ".cm-panel.cm-search": { padding: "var(--sb-space-1) var(--sb-space-3)" },
        ".cm-panel.cm-search label": { color: "var(--sb-text-muted)", fontSize: "var(--sb-app-font-size-ui-small)" },
        ".cm-textfield": {
          backgroundColor: "var(--sb-well)",
          color: "var(--sb-text)",
          border: "var(--sb-rule-width) solid var(--sb-rule)",
          borderRadius: "0",
          fontSize: "var(--sb-app-font-size-ui-small)",
        },
        ".cm-textfield:focus": { outline: "none", borderColor: "var(--sb-focus)" },
        ".cm-button": {
          backgroundImage: "none",
          backgroundColor: "transparent",
          color: "var(--sb-text)",
          border: "var(--sb-rule-width) solid var(--sb-rule)",
          borderRadius: "0",
          fontSize: "var(--sb-app-font-size-ui-small)",
        },
        ".cm-button:hover": { backgroundColor: "var(--sb-surface-hover)" },
        ".cm-panel.cm-search [name=close]": { color: "var(--sb-text-muted)" },
        ".cm-tooltip": {
          backgroundColor: "var(--sb-surface)",
          color: "var(--sb-text)",
          border: "var(--sb-rule-width) solid var(--sb-rule)",
          borderRadius: "0",
        },
        ".cm-tooltip-autocomplete > ul": { fontFamily: "var(--sb-font-family-mono)" },
        ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
          backgroundColor: "var(--sb-selected)",
          color: "var(--sb-accent)",
        },
        ".cm-tooltip.cm-completionInfo": { padding: "var(--sb-space-1) var(--sb-space-2)" },
      },
      { dark: false },
    ),
    syntaxHighlighting(highlight),
  ];
}
