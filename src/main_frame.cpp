// Compass — Plot Workbench (Instrument #1)
// MainFrame implementation — the plot-specific parts only.

#include "main_frame.h"

#include <vector>

#include <wx/aboutdlg.h>
#include <wx/filedlg.h>
#include <wx/ffile.h>
#include <wx/menu.h>
#include <wx/msgdlg.h>

#include "expression_panel.h"
#include "plot/csv_exporter.h"
#include "plot_canvas.h"
#include "view_panel.h"

namespace {
constexpr int ID_EXPORT_PNG = wxID_HIGHEST + 100;
constexpr int ID_EXPORT_CSV = wxID_HIGHEST + 101;
}

MainFrame::MainFrame() : compass::DocumentFrame("Compass") {
    // Seed the worksheet with a curve so a fresh launch shows something.
    m_doc.AddExpression(plot::ExprEntry{"sin(x)", plot::Style{}});
    m_doc.MarkSaved();
    FinishConstruction();  // base builds menus + calls BuildWorkspace()
}

void MainFrame::BuildWorkspace() {
    auto onChanged = [this] { NotifyDocumentChanged(); };

    m_canvas = new PlotCanvas(this, &m_doc);
    m_canvas->SetOnChanged(onChanged);
    m_canvas->SetOnCursor([this](double x, double y) {
        SetStatusText(wxString::Format("x = %.4g   y = %.4g", x, y));
    });
    aui().AddPane(m_canvas, wxAuiPaneInfo().Name("workspace").CenterPane());

    m_exprPanel = new ExpressionPanel(this, &m_doc, onChanged);
    aui().AddPane(m_exprPanel, wxAuiPaneInfo()
                                   .Name("expressions").Caption("Expressions")
                                   .Left().BestSize(260, -1).CloseButton(true));

    m_viewPanel = new ViewPanel(this, &m_doc, onChanged);
    aui().AddPane(m_viewPanel, wxAuiPaneInfo()
                                   .Name("view").Caption("View")
                                   .Right().BestSize(220, -1).CloseButton(true));
}

void MainFrame::SyncViews() {
    if (m_canvas) m_canvas->Refresh();
    if (m_exprPanel) m_exprPanel->ReloadFromDoc();
    if (m_viewPanel) m_viewPanel->ReloadFromDoc();
}

void MainFrame::PopulateFileMenu(wxMenu& file_menu) {
    file_menu.AppendSeparator();
    file_menu.Append(ID_EXPORT_PNG, L"Export &PNG…");
    file_menu.Append(ID_EXPORT_CSV, L"Export &CSV…");
    Bind(wxEVT_MENU, &MainFrame::OnExportPng, this, ID_EXPORT_PNG);
    Bind(wxEVT_MENU, &MainFrame::OnExportCsv, this, ID_EXPORT_CSV);
}

void MainFrame::PopulateAboutDialog(wxAboutDialogInfo& info) {
    info.SetVersion("0.1");
    info.SetDescription(
        L"Plot Workbench — a function grapher.\n"
        L"A Compass desktop instrument: self-contained, native, static.");
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
    wxFileDialog dlg(this, "Export CSV", "", "plot.csv", "CSV (*.csv)|*.csv",
                     wxFD_SAVE | wxFD_OVERWRITE_PROMPT);
    if (dlg.ShowModal() != wxID_OK) return;
    const plot::ViewRect& v = m_doc.view();
    const std::string csv = plot::ExportCsv(visible, v.xmin, v.xmax, 1000);
    wxFFile file(dlg.GetPath(), "w");
    if (!file.IsOpened() || !file.Write(csv)) {
        wxMessageBox("Could not write " + dlg.GetPath(), "Compass",
                     wxOK | wxICON_ERROR, this);
    }
}
