// Compass — Plot Workbench (Instrument #1)
// MainFrame: the plot-specific instrument shell. A thin subclass of
// compass::DocumentFrame — it only builds the plot panels/canvas and answers the
// framework's document/serialize/refresh contract. All generic shell behaviour
// (menus, docking, Open/Save, undo, dirty prompt, title) lives in libcompass.

#pragma once

#include "compass/document_frame.h"
#include "plot/plot_document.h"

class PlotCanvas;
class ExpressionPanel;
class ViewPanel;
class wxMenu;
class wxAboutDialogInfo;

class MainFrame : public compass::DocumentFrame {
public:
    MainFrame();

protected:
    compass::Document& document() override { return m_doc; }
    void NewDocument() override { m_doc = plot::PlotDocument{}; }
    void BuildWorkspace() override;
    void SyncViews() override;
    wxString DocumentWildcard() const override {
        return "Plot worksheet (*.plot)|*.plot";
    }
    wxString DefaultFileName() const override { return "untitled.plot"; }
    void PopulateFileMenu(wxMenu& file_menu) override;
    void PopulateAboutDialog(wxAboutDialogInfo& info) override;

private:
    void OnExportPng(wxCommandEvent& event);
    void OnExportCsv(wxCommandEvent& event);

    plot::PlotDocument m_doc;
    PlotCanvas* m_canvas = nullptr;
    ExpressionPanel* m_exprPanel = nullptr;
    ViewPanel* m_viewPanel = nullptr;
};
