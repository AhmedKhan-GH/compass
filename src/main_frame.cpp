#include "main_frame.h"

#include <wx/aboutdlg.h>
#include <wx/config.h>
#include <wx/ffile.h>
#include <wx/filedlg.h>
#include <wx/filename.h>
#include <wx/image.h>
#include <wx/menu.h>
#include <wx/msgdlg.h>
#include <wx/panel.h>
#include <wx/settings.h>

#include <utility>
#include <vector>

#include "expression_panel.h"
#include "plot/csv_exporter.h"
#include "plot_canvas.h"
#include "view_panel.h"

namespace {
constexpr int ID_RESET_LAYOUT = wxID_HIGHEST + 1;
constexpr int ID_EXPORT_PNG = wxID_HIGHEST + 2;
constexpr int ID_EXPORT_CSV = wxID_HIGHEST + 3;
constexpr const char* kPlotWildcard = "Plot worksheet (*.plot)|*.plot";
}

MainFrame::MainFrame()
    : wxFrame(nullptr, wxID_ANY, "Compass",
              wxDefaultPosition, wxSize(1000, 700)) {
    m_aui.SetManagedWindow(this);

    BuildMenuBar();
    CreateStatusBar();
    SetStatusText("Ready");

    // Seed the worksheet with a curve so a fresh launch shows something.
    m_doc.AddExpression(plot::ExprEntry{"sin(x)", plot::Style{}});
    m_doc.MarkSaved();

    auto onChanged = [this] { OnDocumentChanged(); };

    m_canvas = new PlotCanvas(this, &m_doc);
    m_canvas->SetOnChanged(onChanged);
    m_canvas->SetOnCursor([this](double x, double y) {
        SetStatusText(wxString::Format("x = %.4g   y = %.4g", x, y));
    });
    m_aui.AddPane(m_canvas, wxAuiPaneInfo()
                                .Name("workspace")
                                .CenterPane());

    m_exprPanel = new ExpressionPanel(this, &m_doc, onChanged);
    m_aui.AddPane(m_exprPanel, wxAuiPaneInfo()
                                   .Name("expressions")
                                   .Caption("Expressions")
                                   .Left()
                                   .BestSize(260, -1)
                                   .CloseButton(true));

    m_viewPanel = new ViewPanel(this, &m_doc, onChanged);
    m_aui.AddPane(m_viewPanel, wxAuiPaneInfo()
                                   .Name("view")
                                   .Caption("View")
                                   .Right()
                                   .BestSize(220, -1)
                                   .CloseButton(true));

    m_aui.Update();
    UpdateEditMenu();
    m_defaultPerspective = m_aui.SavePerspective();

    Bind(wxEVT_MENU, &MainFrame::OnExit, this, wxID_EXIT);
    Bind(wxEVT_MENU, &MainFrame::OnAbout, this, wxID_ABOUT);
    Bind(wxEVT_MENU, &MainFrame::OnResetLayout, this, ID_RESET_LAYOUT);
    Bind(wxEVT_MENU, &MainFrame::OnUndo, this, wxID_UNDO);
    Bind(wxEVT_MENU, &MainFrame::OnRedo, this, wxID_REDO);
    Bind(wxEVT_MENU, &MainFrame::OnNew, this, wxID_NEW);
    Bind(wxEVT_MENU, &MainFrame::OnOpen, this, wxID_OPEN);
    Bind(wxEVT_MENU, &MainFrame::OnSave, this, wxID_SAVE);
    Bind(wxEVT_MENU, &MainFrame::OnSaveAs, this, wxID_SAVEAS);
    Bind(wxEVT_MENU, &MainFrame::OnExportPng, this, ID_EXPORT_PNG);
    Bind(wxEVT_MENU, &MainFrame::OnExportCsv, this, ID_EXPORT_CSV);

    Bind(wxEVT_CLOSE_WINDOW, &MainFrame::OnClose, this);
    RestoreLayout();
    UpdateTitle();
}

MainFrame::~MainFrame() {
    m_aui.UnInit();
}

void MainFrame::BuildMenuBar() {
    auto* fileMenu = new wxMenu;
    fileMenu->Append(wxID_NEW, "&New\tCtrl+N");
    fileMenu->Append(wxID_OPEN, "&Open…\tCtrl+O");
    fileMenu->Append(wxID_SAVE, "&Save\tCtrl+S");
    fileMenu->Append(wxID_SAVEAS, "Save &As…\tCtrl+Shift+S");
    fileMenu->AppendSeparator();
    fileMenu->Append(ID_EXPORT_PNG, "Export &PNG…");
    fileMenu->Append(ID_EXPORT_CSV, "Export &CSV…");
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

    auto* menuBar = new wxMenuBar;
    menuBar->Append(fileMenu, "&File");
    menuBar->Append(editMenu, "&Edit");
    menuBar->Append(viewMenu, "&View");
    menuBar->Append(helpMenu, "&Help");
    SetMenuBar(menuBar);
}

void MainFrame::OnExit(wxCommandEvent&) {
    Close(true);
}

void MainFrame::OnAbout(wxCommandEvent&) {
    wxAboutDialogInfo info;
    info.SetName("Compass");
    info.SetVersion("0.1");
    info.SetDescription(
        "Desktop instruments: self-contained, cross-platform,\n"
        "document-centric native tools.");
    wxAboutBox(info, this);
}

void MainFrame::OnResetLayout(wxCommandEvent&) {
    m_aui.LoadPerspective(m_defaultPerspective, true);
}

void MainFrame::OnUndo(wxCommandEvent&) {
    m_doc.Undo();
    OnDocumentChanged();
}

void MainFrame::OnRedo(wxCommandEvent&) {
    m_doc.Redo();
    OnDocumentChanged();
}

void MainFrame::OnDocumentChanged() {
    if (m_canvas) m_canvas->Refresh();
    // Defer panel rebuilds so we never delete/repopulate a control from inside
    // one of its own event handlers.
    CallAfter([this] {
        if (m_exprPanel) m_exprPanel->ReloadFromDoc();
        if (m_viewPanel) m_viewPanel->ReloadFromDoc();
        UpdateEditMenu();
        UpdateTitle();
    });
}

void MainFrame::UpdateEditMenu() {
    wxMenuBar* bar = GetMenuBar();
    if (!bar) return;
    bar->Enable(wxID_UNDO, m_doc.can_undo());
    bar->Enable(wxID_REDO, m_doc.can_redo());
}

void MainFrame::OnClose(wxCloseEvent& event) {
    if (event.CanVeto() && !MaybeDiscardChanges()) {
        event.Veto();
        return;
    }
    SaveLayout();
    event.Skip();
}

void MainFrame::UpdateTitle() {
    const wxString name =
        m_filePath.empty() ? "Untitled" : wxFileName(m_filePath).GetFullName();
    SetTitle(wxString::Format("%s%s — Compass", name, m_doc.dirty() ? "*" : ""));
}

bool MainFrame::MaybeDiscardChanges() {
    if (!m_doc.dirty()) return true;
    const int answer = wxMessageBox("Save changes to the current worksheet?",
                                    "Compass", wxYES_NO | wxCANCEL | wxICON_QUESTION,
                                    this);
    if (answer == wxCANCEL) return false;
    if (answer == wxYES) {
        wxCommandEvent dummy;
        OnSave(dummy);
        return !m_doc.dirty();  // save may have been cancelled
    }
    return true;  // wxNO: discard
}

bool MainFrame::DoSave(const wxString& path) {
    wxFFile file(path, "w");
    if (!file.IsOpened() || !file.Write(m_doc.ToJson())) {
        wxMessageBox("Could not write " + path, "Compass",
                     wxOK | wxICON_ERROR, this);
        return false;
    }
    file.Close();
    m_doc.MarkSaved();
    m_filePath = path;
    UpdateTitle();
    UpdateEditMenu();
    return true;
}

void MainFrame::OnNew(wxCommandEvent&) {
    if (!MaybeDiscardChanges()) return;
    m_doc = plot::PlotDocument{};  // empty worksheet, default view, clean
    m_filePath.clear();
    OnDocumentChanged();
    UpdateTitle();
}

void MainFrame::OnOpen(wxCommandEvent&) {
    if (!MaybeDiscardChanges()) return;
    wxFileDialog dlg(this, "Open worksheet", "", "", kPlotWildcard,
                     wxFD_OPEN | wxFD_FILE_MUST_EXIST);
    if (dlg.ShowModal() != wxID_OK) return;

    wxFFile file(dlg.GetPath(), "r");
    wxString json;
    if (!file.IsOpened() || !file.ReadAll(&json)) {
        wxMessageBox("Could not read " + dlg.GetPath(), "Compass",
                     wxOK | wxICON_ERROR, this);
        return;
    }
    auto loaded = plot::PlotDocument::FromJson(std::string(json.utf8_string()));
    if (!loaded) {
        wxMessageBox("Not a valid .plot worksheet:\n" + dlg.GetPath(), "Compass",
                     wxOK | wxICON_ERROR, this);
        return;
    }
    m_doc = std::move(*loaded);
    m_filePath = dlg.GetPath();
    OnDocumentChanged();
    UpdateTitle();
}

void MainFrame::OnSave(wxCommandEvent& event) {
    if (m_filePath.empty()) {
        OnSaveAs(event);
        return;
    }
    DoSave(m_filePath);
}

void MainFrame::OnSaveAs(wxCommandEvent&) {
    wxFileDialog dlg(this, "Save worksheet", "", "untitled.plot", kPlotWildcard,
                     wxFD_SAVE | wxFD_OVERWRITE_PROMPT);
    if (dlg.ShowModal() != wxID_OK) return;
    DoSave(dlg.GetPath());
}

void MainFrame::OnExportPng(wxCommandEvent&) {
    wxFileDialog dlg(this, "Export PNG", "", "plot.png",
                     "PNG image (*.png)|*.png", wxFD_SAVE | wxFD_OVERWRITE_PROMPT);
    if (dlg.ShowModal() != wxID_OK) return;
    const wxSize size = m_canvas->GetClientSize();
    wxBitmap bmp = m_canvas->RenderToBitmap(size.GetWidth(), size.GetHeight());
    if (!bmp.ConvertToImage().SaveFile(dlg.GetPath(), wxBITMAP_TYPE_PNG)) {
        wxMessageBox("Could not write " + dlg.GetPath(), "Compass",
                     wxOK | wxICON_ERROR, this);
    }
}

void MainFrame::OnExportCsv(wxCommandEvent&) {
    std::vector<std::string> visible;
    for (const plot::ExprEntry& e : m_doc.expressions()) {
        if (e.style.visible) visible.push_back(e.text);
    }
    if (visible.empty()) {
        wxMessageBox("No visible expressions to export.", "Compass",
                     wxOK | wxICON_INFORMATION, this);
        return;
    }
    wxFileDialog dlg(this, "Export CSV", "", "plot.csv",
                     "CSV (*.csv)|*.csv", wxFD_SAVE | wxFD_OVERWRITE_PROMPT);
    if (dlg.ShowModal() != wxID_OK) return;
    const plot::ViewRect& v = m_doc.view();
    const std::string csv = plot::ExportCsv(visible, v.xmin, v.xmax, 1000);
    wxFFile file(dlg.GetPath(), "w");
    if (!file.IsOpened() || !file.Write(csv)) {
        wxMessageBox("Could not write " + dlg.GetPath(), "Compass",
                     wxOK | wxICON_ERROR, this);
    }
}

void MainFrame::SaveLayout() {
    wxConfigBase::Get()->Write("/Layout/Perspective", m_aui.SavePerspective());
}

void MainFrame::RestoreLayout() {
    wxString perspective;
    if (wxConfigBase::Get()->Read("/Layout/Perspective", &perspective)
        && !perspective.empty()) {
        m_aui.LoadPerspective(perspective, true);
    }
}
