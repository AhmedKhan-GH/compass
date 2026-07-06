// Compass framework (libcompass) — DocumentFrame implementation.

#include "compass/document_frame.h"

#include <wx/aboutdlg.h>
#include <wx/arrstr.h>
#include <wx/config.h>
#include <wx/ffile.h>
#include <wx/filedlg.h>
#include <wx/filename.h>
#include <wx/menu.h>
#include <wx/msgdlg.h>

#include "compass/document.h"

namespace compass {
namespace {
constexpr int ID_RESET_LAYOUT = wxID_HIGHEST + 1;

// A signature of the current dockable pane set (sorted names). A saved layout is
// restored only when its signature matches — so a layout from a build with a
// different pane set (or one with no signature, e.g. an older/corrupt save)
// falls back to the default instead of hiding panels or mangling the canvas.
wxString PaneSignature(wxAuiManager& aui) {
    wxArrayString names;
    for (const wxAuiPaneInfo& p : aui.GetAllPanes()) names.Add(p.name);
    names.Sort();
    return wxJoin(names, ',');
}
}  // namespace

DocumentFrame::DocumentFrame(const wxString& app_name)
    : wxFrame(nullptr, wxID_ANY, app_name, wxDefaultPosition, wxSize(1000, 700)),
      m_appName(app_name) {
    m_aui.SetManagedWindow(this);
}

DocumentFrame::~DocumentFrame() { m_aui.UnInit(); }

void DocumentFrame::FinishConstruction() {
    BuildMenuBar();
    CreateStatusBar();
    SetStatusText("Ready");

    BuildWorkspace();  // instrument creates its panes

    m_aui.Update();
    m_defaultPerspective = m_aui.SavePerspective();

    Bind(wxEVT_MENU, &DocumentFrame::OnNew, this, wxID_NEW);
    Bind(wxEVT_MENU, &DocumentFrame::OnOpen, this, wxID_OPEN);
    Bind(wxEVT_MENU, &DocumentFrame::OnSave, this, wxID_SAVE);
    Bind(wxEVT_MENU, &DocumentFrame::OnSaveAs, this, wxID_SAVEAS);
    Bind(wxEVT_MENU, &DocumentFrame::OnUndo, this, wxID_UNDO);
    Bind(wxEVT_MENU, &DocumentFrame::OnRedo, this, wxID_REDO);
    Bind(wxEVT_MENU, &DocumentFrame::OnResetLayout, this, ID_RESET_LAYOUT);
    Bind(wxEVT_MENU, &DocumentFrame::OnAbout, this, wxID_ABOUT);
    Bind(wxEVT_MENU, &DocumentFrame::OnExit, this, wxID_EXIT);
    Bind(wxEVT_CLOSE_WINDOW, &DocumentFrame::OnClose, this);

    RestoreLayout();
    UpdateEditMenu();
    UpdateTitle();
}

void DocumentFrame::BuildMenuBar() {
    auto* fileMenu = new wxMenu;
    fileMenu->Append(wxID_NEW, "&New\tCtrl+N");
    fileMenu->Append(wxID_OPEN, "&Open…\tCtrl+O");
    fileMenu->Append(wxID_SAVE, "&Save\tCtrl+S");
    fileMenu->Append(wxID_SAVEAS, "Save &As…\tCtrl+Shift+S");
    PopulateFileMenu(*fileMenu);  // instrument adds Export etc.
    fileMenu->AppendSeparator();
    fileMenu->Append(wxID_EXIT);

    auto* editMenu = new wxMenu;
    editMenu->Append(wxID_UNDO, "&Undo\tCtrl+Z");
    editMenu->Append(wxID_REDO, "&Redo\tCtrl+Shift+Z");

    auto* viewMenu = new wxMenu;
    viewMenu->Append(ID_RESET_LAYOUT, "&Reset Layout",
                     "Restore the default window layout");

    auto* helpMenu = new wxMenu;
    helpMenu->Append(wxID_ABOUT);

    auto* bar = new wxMenuBar;
    bar->Append(fileMenu, "&File");
    bar->Append(editMenu, "&Edit");
    bar->Append(viewMenu, "&View");
    bar->Append(helpMenu, "&Help");
    SetMenuBar(bar);
}

void DocumentFrame::NotifyDocumentChanged() {
    // Deferred so we never rebuild a control from inside its own event handler.
    CallAfter([this] {
        SyncViews();
        UpdateEditMenu();
        UpdateTitle();
    });
}

void DocumentFrame::UpdateEditMenu() {
    if (wxMenuBar* bar = GetMenuBar()) {
        bar->Enable(wxID_UNDO, document().CanUndo());
        bar->Enable(wxID_REDO, document().CanRedo());
    }
}

void DocumentFrame::UpdateTitle() {
    const wxString name =
        m_filePath.empty() ? "Untitled" : wxFileName(m_filePath).GetFullName();
    SetTitle(wxString::Format("%s%s — %s", name, document().dirty() ? "*" : "",
                              m_appName));
}

bool DocumentFrame::MaybeDiscardChanges() {
    if (!document().dirty()) return true;
    const int answer = wxMessageBox("Save changes to the current document?",
                                    m_appName,
                                    wxYES_NO | wxCANCEL | wxICON_QUESTION, this);
    if (answer == wxCANCEL) return false;
    if (answer == wxYES) {
        wxCommandEvent dummy;
        OnSave(dummy);
        return !document().dirty();  // save may have been cancelled
    }
    return true;  // discard
}

bool DocumentFrame::DoSave(const wxString& path) {
    wxFFile file(path, "w");
    if (!file.IsOpened() || !file.Write(document().Serialize())) {
        wxMessageBox("Could not write " + path, m_appName, wxOK | wxICON_ERROR, this);
        return false;
    }
    file.Close();
    document().MarkSaved();
    m_filePath = path;
    UpdateTitle();
    UpdateEditMenu();
    return true;
}

void DocumentFrame::OnNew(wxCommandEvent&) {
    if (!MaybeDiscardChanges()) return;
    NewDocument();
    m_filePath.clear();
    SyncViews();
    UpdateEditMenu();
    UpdateTitle();
}

void DocumentFrame::OnOpen(wxCommandEvent&) {
    if (!MaybeDiscardChanges()) return;
    wxFileDialog dlg(this, "Open", "", "", DocumentWildcard(),
                     wxFD_OPEN | wxFD_FILE_MUST_EXIST);
    if (dlg.ShowModal() != wxID_OK) return;
    wxFFile file(dlg.GetPath(), "r");
    wxString data;
    if (!file.IsOpened() || !file.ReadAll(&data)) {
        wxMessageBox("Could not read " + dlg.GetPath(), m_appName,
                     wxOK | wxICON_ERROR, this);
        return;
    }
    if (!document().Deserialize(std::string(data.utf8_string()))) {
        wxMessageBox("Not a valid document:\n" + dlg.GetPath(), m_appName,
                     wxOK | wxICON_ERROR, this);
        return;
    }
    m_filePath = dlg.GetPath();
    SyncViews();
    UpdateEditMenu();
    UpdateTitle();
}

void DocumentFrame::OnSave(wxCommandEvent& e) {
    if (m_filePath.empty()) {
        OnSaveAs(e);
        return;
    }
    DoSave(m_filePath);
}

void DocumentFrame::OnSaveAs(wxCommandEvent&) {
    wxFileDialog dlg(this, "Save", "", DefaultFileName(), DocumentWildcard(),
                     wxFD_SAVE | wxFD_OVERWRITE_PROMPT);
    if (dlg.ShowModal() != wxID_OK) return;
    DoSave(dlg.GetPath());
}

void DocumentFrame::OnUndo(wxCommandEvent&) {
    document().Undo();
    SyncViews();
    UpdateEditMenu();
    UpdateTitle();
}

void DocumentFrame::OnRedo(wxCommandEvent&) {
    document().Redo();
    SyncViews();
    UpdateEditMenu();
    UpdateTitle();
}

void DocumentFrame::OnResetLayout(wxCommandEvent&) {
    m_aui.LoadPerspective(m_defaultPerspective, true);
}

void DocumentFrame::OnAbout(wxCommandEvent&) {
    wxAboutDialogInfo info;
    info.SetName(m_appName);
    PopulateAboutDialog(info);
    wxAboutBox(info, this);
}

void DocumentFrame::OnExit(wxCommandEvent&) { Close(true); }

void DocumentFrame::OnClose(wxCloseEvent& event) {
    if (event.CanVeto() && !MaybeDiscardChanges()) {
        event.Veto();
        return;
    }
    SaveLayout();
    event.Skip();
}

void DocumentFrame::SaveLayout() {
    wxConfigBase* cfg = wxConfigBase::Get();
    cfg->Write("/Layout/Signature", PaneSignature(m_aui));
    cfg->Write("/Layout/Perspective", m_aui.SavePerspective());
}

void DocumentFrame::RestoreLayout() {
    wxConfigBase* cfg = wxConfigBase::Get();
    wxString sig;
    // Only restore a layout saved by a build with the same pane set.
    if (!cfg->Read("/Layout/Signature", &sig) || sig != PaneSignature(m_aui))
        return;
    wxString perspective;
    if (cfg->Read("/Layout/Perspective", &perspective) && !perspective.empty()) {
        m_aui.LoadPerspective(perspective, true);
    }
}

}  // namespace compass
