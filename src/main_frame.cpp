#include "main_frame.h"

#include <wx/aboutdlg.h>
#include <wx/config.h>
#include <wx/menu.h>
#include <wx/panel.h>
#include <wx/settings.h>

#include "expression_panel.h"
#include "plot_canvas.h"
#include "view_panel.h"

namespace {
constexpr int ID_RESET_LAYOUT = wxID_HIGHEST + 1;
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

    Bind(wxEVT_CLOSE_WINDOW, &MainFrame::OnClose, this);
    RestoreLayout();
}

MainFrame::~MainFrame() {
    m_aui.UnInit();
}

void MainFrame::BuildMenuBar() {
    auto* fileMenu = new wxMenu;
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
    });
}

void MainFrame::UpdateEditMenu() {
    wxMenuBar* bar = GetMenuBar();
    if (!bar) return;
    bar->Enable(wxID_UNDO, m_doc.can_undo());
    bar->Enable(wxID_REDO, m_doc.can_redo());
}

void MainFrame::OnClose(wxCloseEvent& event) {
    SaveLayout();
    event.Skip();
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
