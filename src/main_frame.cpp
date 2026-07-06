#include "main_frame.h"

#include <wx/aboutdlg.h>
#include <wx/menu.h>
#include <wx/panel.h>
#include <wx/settings.h>

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

    auto* workspace = new wxPanel(this, wxID_ANY);
    workspace->SetBackgroundColour(
        wxSystemSettings::GetColour(wxSYS_COLOUR_APPWORKSPACE));
    m_aui.AddPane(workspace, wxAuiPaneInfo()
                                 .Name("workspace")
                                 .CenterPane());

    auto* sidebar = new wxPanel(this, wxID_ANY);
    m_aui.AddPane(sidebar, wxAuiPaneInfo()
                               .Name("sidebar")
                               .Caption("Panels")
                               .Left()
                               .BestSize(240, -1)
                               .CloseButton(true));

    m_aui.Update();
    m_defaultPerspective = m_aui.SavePerspective();

    Bind(wxEVT_MENU, &MainFrame::OnExit, this, wxID_EXIT);
    Bind(wxEVT_MENU, &MainFrame::OnAbout, this, wxID_ABOUT);
    Bind(wxEVT_MENU, &MainFrame::OnResetLayout, this, ID_RESET_LAYOUT);
}

MainFrame::~MainFrame() {
    m_aui.UnInit();
}

void MainFrame::BuildMenuBar() {
    auto* fileMenu = new wxMenu;
    fileMenu->Append(wxID_EXIT);

    auto* viewMenu = new wxMenu;
    viewMenu->Append(ID_RESET_LAYOUT, "&Reset Layout",
                     "Restore the default window layout");

    auto* helpMenu = new wxMenu;
    helpMenu->Append(wxID_ABOUT);

    auto* menuBar = new wxMenuBar;
    menuBar->Append(fileMenu, "&File");
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
