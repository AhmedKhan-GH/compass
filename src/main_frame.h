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
    void OnNew(wxCommandEvent& event);
    void OnOpen(wxCommandEvent& event);
    void OnSave(wxCommandEvent& event);
    void OnSaveAs(wxCommandEvent& event);
    void OnExportPng(wxCommandEvent& event);
    void OnExportCsv(wxCommandEvent& event);
    void OnClose(wxCloseEvent& event);
    void SaveLayout();
    void RestoreLayout();

    // Single sync point: any edit anywhere calls this to refresh every surface.
    void OnDocumentChanged();
    void UpdateEditMenu();
    void UpdateTitle();
    // Prompt to save when dirty; returns false if the user cancels the action.
    bool MaybeDiscardChanges();
    bool DoSave(const wxString& path);  // write ToJson to path; MarkSaved on success

    wxAuiManager m_aui;
    wxString m_defaultPerspective;
    wxString m_filePath;  // current .plot path; empty == untitled
    plot::PlotDocument m_doc;
    PlotCanvas* m_canvas = nullptr;
    ExpressionPanel* m_exprPanel = nullptr;
    ViewPanel* m_viewPanel = nullptr;
};
