#pragma once

#include <wx/frame.h>
#include <wx/aui/aui.h>

class MainFrame : public wxFrame {
public:
    MainFrame();
    ~MainFrame() override;

private:
    void BuildMenuBar();
    void OnExit(wxCommandEvent& event);
    void OnAbout(wxCommandEvent& event);
    void OnResetLayout(wxCommandEvent& event);
    void OnClose(wxCloseEvent& event);
    void SaveLayout();
    void RestoreLayout();

    wxAuiManager m_aui;
    wxString m_defaultPerspective;
};
