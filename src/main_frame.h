#pragma once

#include <wx/frame.h>
#include <wx/aui/aui.h>

#include "plot/plot_document.h"

class PlotCanvas;
class ExpressionPanel;
class ViewPanel;

class MainFrame : public wxFrame {
public:
    MainFrame();
    ~MainFrame() override;

private:
    void BuildMenuBar();
    void OnExit(wxCommandEvent& event);
    void OnAbout(wxCommandEvent& event);
    void OnResetLayout(wxCommandEvent& event);
    void OnUndo(wxCommandEvent& event);
    void OnRedo(wxCommandEvent& event);
    void OnClose(wxCloseEvent& event);
    void SaveLayout();
    void RestoreLayout();

    // Single sync point: any edit anywhere calls this to refresh every surface.
    void OnDocumentChanged();
    void UpdateEditMenu();

    wxAuiManager m_aui;
    wxString m_defaultPerspective;
    plot::PlotDocument m_doc;
    PlotCanvas* m_canvas = nullptr;
    ExpressionPanel* m_exprPanel = nullptr;
    ViewPanel* m_viewPanel = nullptr;
};
