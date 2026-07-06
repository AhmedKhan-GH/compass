// Instrument Template — NoteFrame implementation.
// REPLACE THIS with your instrument's views and interactions.

#include "note_frame.h"

#include <wx/textctrl.h>
#include <wx/aui/aui.h>

namespace note {

NoteFrame::NoteFrame()
    // The title shown in the frame's caption / used by the shell chrome.
    : compass::DocumentFrame("Instrument Template") {
    // FinishConstruction() runs the shell's two-phase startup: it calls our
    // BuildWorkspace(), commits the AUI layout, and does an initial SyncViews().
    // It must run AFTER our members are constructed, hence the explicit call
    // here rather than in the base constructor.
    FinishConstruction();
}

void NoteFrame::BuildWorkspace() {
    // One multiline text control as the single center pane. REPLACE with your
    // instrument's panels (add as many aui() panes as you need).
    m_text = new wxTextCtrl(this, wxID_ANY, wxEmptyString,
                            wxDefaultPosition, wxDefaultSize,
                            wxTE_MULTILINE);

    // Every keystroke pushes the widget's text into the document, then tells the
    // shell the document changed (which repaints title/dirty marker, refreshes
    // undo state, etc.). The m_syncing guard prevents SyncViews()'s own
    // SetValue() from bouncing back through here.
    m_text->Bind(wxEVT_TEXT, [this](wxCommandEvent&) {
        if (m_syncing) return;
        m_doc.SetText(m_text->GetValue().ToStdString());
        NotifyDocumentChanged();
    });

    // Register the pane with the shell's AUI manager. aui() is the wxAuiManager
    // owned by DocumentFrame; CenterPane() makes this the primary content area.
    // NOTE: exact pane-info spelling may differ in the committed shell — adjust
    // to whatever compass/document_frame.h exposes if this doesn't compile.
    aui().AddPane(m_text, wxAuiPaneInfo().CenterPane().Name("note").Caption("Note"));
}

void NoteFrame::SyncViews() {
    if (!m_text) return;
    // Guard so the SetValue below doesn't look like a user edit.
    m_syncing = true;
    m_text->ChangeValue(m_doc.text());  // ChangeValue does not emit wxEVT_TEXT,
                                        // but we keep the flag as belt-and-braces
                                        // and to model the pattern for widgets
                                        // that DO fire on programmatic change.
    m_syncing = false;
}

}  // namespace note
