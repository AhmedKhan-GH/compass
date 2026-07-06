# Instrument Template

The minimal "copy this to start a new Compass instrument" skeleton. It opens,
edits, and saves a trivial `.note` document in a single text pane, exercising the
full compass::DocumentFrame lifecycle (New / Open / Save / undo / dirty).

## Start a new instrument

1. Copy this directory to `src/<your-instrument>/` (or wherever instruments live).
2. Rename the `instrument_template` target in `CMakeLists.txt` and add it to the
   build (at increment 3, replace the body with `compass_add_instrument(...)`).
3. Replace `NoteDocument`/`NoteState` with your document: model your state as a
   struct, give each mutation a method that calls `Commit()`, implement
   `Serialize()`/`Deserialize()`.
4. In your frame, override `BuildWorkspace()` (create your AUI panes),
   `SyncViews()` (document → widgets, guarded by the `m_syncing` flag), the
   widget callbacks (widgets → document, then `NotifyDocumentChanged()`), and
   `DocumentWildcard()` for your file extension.
5. Point `CreateMainFrame()`/`AppName()` in `main.cpp` at your frame.
