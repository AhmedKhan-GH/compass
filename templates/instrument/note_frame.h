// Instrument Template — NoteFrame
//
// A complete-but-minimal instrument shell. It subclasses compass::DocumentFrame,
// which supplies the frame, menus, status bar, AUI workspace, and the whole
// New / Open / Save / Save As / dirty-tracking / undo lifecycle. Your job as an
// instrument author is only to fill in a handful of protected virtuals so the
// shell knows what YOUR document is and how to show it.
//
// REPLACE THIS with your instrument's frame. The three overrides you almost
// always customise are BuildWorkspace() (your panels), SyncViews() (push
// document -> widgets), and the widget callbacks (push widgets -> document).

#ifndef COMPASS_TEMPLATE_NOTE_FRAME_H
#define COMPASS_TEMPLATE_NOTE_FRAME_H

#include "compass/document_frame.h"

#include "note_document.h"

class wxTextCtrl;  // forward-declared to keep the header light

namespace note {

class NoteFrame : public compass::DocumentFrame {
public:
    NoteFrame();

protected:
    // --- the required contract (see compass/document_frame.h) ---

    // Hand the shell a stable pointer to the live document. m_doc is a member,
    // so its address never moves for the frame's lifetime.
    compass::Document& document() override { return m_doc; }

    // "File > New": replace the document with a fresh, empty one.
    void NewDocument() override { m_doc = NoteDocument{}; }

    // Build the panels and register them with the AUI manager (aui()). Called
    // once during FinishConstruction().
    void BuildWorkspace() override;

    // Push the current document state into the widgets. The shell calls this
    // after New/Open/Undo/Redo — anything that can change the document behind
    // the UI's back.
    void SyncViews() override;

    // The wildcard for Open/Save dialogs: "<label> (*.<ext>)|*.<ext>".
    wxString DocumentWildcard() const override { return "Note (*.note)|*.note"; }

private:
    NoteDocument m_doc;             // owned; stable address for document()
    wxTextCtrl* m_text = nullptr;   // the single center pane

    // Guards SyncViews() from re-triggering the text-changed callback: when we
    // set the control's value programmatically we don't want that to look like
    // a user edit and commit a redundant undo step.
    bool m_syncing = false;
};

}  // namespace note

#endif  // COMPASS_TEMPLATE_NOTE_FRAME_H
