// Compass — Signal Workbench (Instrument #2, I3)
// SignalFrame implementation.

#include "signal_frame.h"

#include <fstream>
#include <sstream>
#include <string>

#include <wx/aboutdlg.h>
#include <wx/button.h>
#include <wx/dataview.h>
#include <wx/filedlg.h>
#include <wx/menu.h>
#include <wx/msgdlg.h>
#include <wx/panel.h>
#include <wx/sizer.h>
#include <wx/treectrl.h>

#include "signal/waveform_decimator.h"
#include "waveform_canvas.h"

namespace {
constexpr int ID_OPEN_RECORDING = wxID_HIGHEST + 200;
constexpr int ID_ADD_ANNOT = wxID_HIGHEST + 201;
constexpr int ID_REMOVE_ANNOT = wxID_HIGHEST + 202;

constexpr int kColStart = 0;
constexpr int kColEnd = 1;
constexpr int kColLabel = 2;

std::string ReadFile(const wxString& path) {
    std::ifstream in(std::string(path.utf8_string()), std::ios::binary);
    std::stringstream ss;
    ss << in.rdbuf();
    return ss.str();
}
}  // namespace

SignalFrame::SignalFrame() : compass::DocumentFrame("Signal Workbench") {
    FinishConstruction();
}

void SignalFrame::BuildWorkspace() {
    m_canvas = new WaveformCanvas(this);
    aui().AddPane(m_canvas, wxAuiPaneInfo().Name("waveform").CenterPane());

    m_tree = new wxTreeCtrl(this, wxID_ANY, wxDefaultPosition, wxDefaultSize,
                            wxTR_HIDE_ROOT | wxTR_DEFAULT_STYLE);
    m_tree->AddRoot("channels");
    aui().AddPane(m_tree, wxAuiPaneInfo().Name("channels").Caption("Channels")
                              .Left().BestSize(220, -1).CloseButton(true));

    auto* panel = new wxPanel(this, wxID_ANY);
    m_annot = new wxDataViewListCtrl(panel, wxID_ANY);
    m_annot->AppendTextColumn("Start", wxDATAVIEW_CELL_INERT, 60);
    m_annot->AppendTextColumn("End", wxDATAVIEW_CELL_INERT, 60);
    m_annot->AppendTextColumn("Label", wxDATAVIEW_CELL_EDITABLE, 120);
    auto* add = new wxButton(panel, ID_ADD_ANNOT, "Add");
    auto* rem = new wxButton(panel, ID_REMOVE_ANNOT, "Remove");
    auto* btns = new wxBoxSizer(wxHORIZONTAL);
    btns->Add(add, 0, wxRIGHT, 4);
    btns->Add(rem, 0);
    auto* sizer = new wxBoxSizer(wxVERTICAL);
    sizer->Add(m_annot, 1, wxEXPAND | wxALL, 4);
    sizer->Add(btns, 0, wxLEFT | wxBOTTOM, 4);
    panel->SetSizer(sizer);
    aui().AddPane(panel, wxAuiPaneInfo().Name("annotations").Caption("Annotations")
                             .Right().BestSize(280, -1).CloseButton(true));

    Bind(wxEVT_MENU, &SignalFrame::OnOpenRecording, this, ID_OPEN_RECORDING);
    Bind(wxEVT_BUTTON, &SignalFrame::OnAddAnnotation, this, ID_ADD_ANNOT);
    Bind(wxEVT_BUTTON, &SignalFrame::OnRemoveAnnotation, this, ID_REMOVE_ANNOT);
    m_annot->Bind(wxEVT_DATAVIEW_ITEM_VALUE_CHANGED, &SignalFrame::OnAnnotEdited, this);
}

void SignalFrame::PopulateFileMenu(wxMenu& file_menu) {
    file_menu.AppendSeparator();
    file_menu.Append(ID_OPEN_RECORDING, "Open &Recording (EDF)…\tCtrl+R");
}

void SignalFrame::PopulateAboutDialog(wxAboutDialogInfo& info) {
    info.SetVersion("0.1");
    info.SetDescription(
        "Signal Workbench — open EDF recordings, view waveforms, annotate.\n"
        "A Compass desktop instrument: native, static, GL 3.3 waveform canvas.");
}

void SignalFrame::ReloadChannelTree() {
    m_tree->DeleteAllItems();
    wxTreeItemId root = m_tree->AddRoot("channels");
    if (!m_haveReader) return;
    for (int i = 0; i < m_reader.channel_count(); ++i) {
        m_tree->AppendItem(
            root, wxString::Format("%s  (%.0f Hz)", m_reader.channel(i).label,
                                   m_reader.sample_rate(i)));
    }
}

void SignalFrame::ReloadAnnotTable() {
    m_reloading = true;
    m_annot->DeleteAllItems();
    for (const sig::Annotation& a : m_doc.annotations()) {
        wxVector<wxVariant> row;
        row.push_back(wxVariant(wxString::Format("%.3f", a.start)));
        row.push_back(wxVariant(wxString::Format("%.3f", a.end)));
        row.push_back(wxVariant(wxString(a.label)));
        m_annot->AppendItem(row);
    }
    m_reloading = false;
}

void SignalFrame::SyncViews() {
    ReloadAnnotTable();
    if (m_canvas) m_canvas->Refresh();
}

void SignalFrame::OnOpenRecording(wxCommandEvent&) {
    wxFileDialog dlg(this, "Open recording", "", "", "EDF recording (*.edf)|*.edf",
                     wxFD_OPEN | wxFD_FILE_MUST_EXIST);
    if (dlg.ShowModal() != wxID_OK) return;

    const std::string bytes = ReadFile(dlg.GetPath());
    sig::EdfReader r = sig::EdfReader::Parse(bytes);
    if (!r.ok()) {
        wxMessageBox("Not a valid EDF recording:\n" + wxString(r.error()),
                     "Signal Workbench", wxOK | wxICON_ERROR, this);
        return;
    }
    m_reader = std::move(r);
    m_haveReader = true;
    m_canvas->SetReader(&m_reader);
    ReloadChannelTree();

    // Load the annotation sidecar (<recording>.annot) if present; else start fresh.
    const std::string sidecar = std::string(dlg.GetPath().utf8_string()) + ".annot";
    const std::string sc = ReadFile(sidecar);
    m_doc = sig::SignalDocument{};
    if (!sc.empty()) m_doc.Deserialize(sc);
    m_doc.SetEdfPath(std::string(dlg.GetPath().utf8_string()));
    m_doc.MarkSaved();
    NotifyDocumentChanged();
}

void SignalFrame::OnAddAnnotation(wxCommandEvent&) {
    m_doc.AddAnnotation({0.0, 1.0, "annotation"});
    NotifyDocumentChanged();
}

void SignalFrame::OnRemoveAnnotation(wxCommandEvent&) {
    const int row = m_annot->GetSelectedRow();
    if (row == wxNOT_FOUND) return;
    m_doc.RemoveAnnotation(static_cast<std::size_t>(row));
    NotifyDocumentChanged();
}

void SignalFrame::OnAnnotEdited(wxDataViewEvent& event) {
    if (m_reloading) return;
    const int row = m_annot->ItemToRow(event.GetItem());
    if (row == wxNOT_FOUND ||
        static_cast<std::size_t>(row) >= m_doc.annotations().size())
        return;
    if (event.GetColumn() != kColLabel) return;
    sig::Annotation a = m_doc.annotations()[row];
    a.label = std::string(m_annot->GetTextValue(row, kColLabel).utf8_string());
    m_doc.EditAnnotation(static_cast<std::size_t>(row), a);
    NotifyDocumentChanged();
}
