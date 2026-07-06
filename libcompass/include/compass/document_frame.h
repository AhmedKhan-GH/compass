// Compass framework (libcompass) — DocumentFrame.
//
// The generic workspace shell (PLATFORM.md §5.3), extracted from Plot Workbench
// at I2. Owns the menu bar, AUI docking + layout persistence, native Open/Save
// dialogs (driving compass::Document::Serialize/Deserialize), the dirty-prompt,
// the window title, and undo/redo wiring. Instruments subclass it and supply
// their document, panels, and view-refresh via a small virtual contract.

#ifndef COMPASS_DOCUMENT_FRAME_H
#define COMPASS_DOCUMENT_FRAME_H

#include <wx/aui/aui.h>
#include <wx/frame.h>

class wxMenu;
class wxAboutDialogInfo;

namespace compass {

class Document;

class DocumentFrame : public wxFrame {
public:
    explicit DocumentFrame(const wxString& app_name);
    ~DocumentFrame() override;

protected:
    // --- subclass contract ---------------------------------------------------

    // The instrument's concrete document. MUST return a stable address across the
    // frame's lifetime (New/Open mutate it in place) so panels may hold a pointer.
    virtual Document& document() = 0;

    // Reset the document to an empty state, in place (for File → New).
    virtual void NewDocument() = 0;

    // Create the instrument's canvas/panels and add them via aui(). Called once.
    virtual void BuildWorkspace() = 0;

    // Refresh every instrument view from document() (after Open/Undo/etc.).
    virtual void SyncViews() = 0;

    // Wildcard for the Open/Save dialogs, e.g. "Plot worksheet (*.plot)|*.plot".
    virtual wxString DocumentWildcard() const = 0;

    // Default filename offered by Save As (without directory).
    virtual wxString DefaultFileName() const { return "untitled"; }

    // Optional: append instrument-specific items (e.g. Export) to the File menu.
    virtual void PopulateFileMenu(wxMenu& file_menu) { (void)file_menu; }

    // Optional: fill in the About box.
    virtual void PopulateAboutDialog(wxAboutDialogInfo& info) { (void)info; }

    // --- services the subclass uses ------------------------------------------

    wxAuiManager& aui() { return m_aui; }

    // Call after any document edit: deferred SyncViews + menu + title refresh.
    void NotifyDocumentChanged();

    // Call at the END of the subclass constructor (after its members exist):
    // builds menus, calls BuildWorkspace(), saves the default layout, sets title.
    void FinishConstruction();

private:
    void BuildMenuBar();
    void OnNew(wxCommandEvent& e);
    void OnOpen(wxCommandEvent& e);
    void OnSave(wxCommandEvent& e);
    void OnSaveAs(wxCommandEvent& e);
    void OnUndo(wxCommandEvent& e);
    void OnRedo(wxCommandEvent& e);
    void OnResetLayout(wxCommandEvent& e);
    void OnAbout(wxCommandEvent& e);
    void OnExit(wxCommandEvent& e);
    void OnClose(wxCloseEvent& e);

    bool MaybeDiscardChanges();       // true if OK to proceed (may prompt to save)
    bool DoSave(const wxString& path);
    void UpdateTitle();
    void UpdateEditMenu();
    void SaveLayout();
    void RestoreLayout();

    wxAuiManager m_aui;
    wxString m_appName;
    wxString m_defaultPerspective;
    wxString m_filePath;  // current document path; empty == untitled
};

}  // namespace compass

#endif  // COMPASS_DOCUMENT_FRAME_H
