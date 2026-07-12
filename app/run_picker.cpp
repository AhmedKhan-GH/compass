// Compass C2 — RunPickerDialog implementation.

#include "run_picker.h"

#include <wx/button.h>
#include <wx/dataview.h>
#include <wx/dirdlg.h>
#include <wx/settings.h>
#include <wx/sizer.h>
#include <wx/stattext.h>

#include "compass/metrics_sql.h"
#include "compass/store_root.h"
#include "report_builder.h"

namespace compass {

RunPickerDialog::RunPickerDialog(wxWindow* parent, const CaliperMetricsV1_1* svc,
                                 std::string session_root, std::string doc_root)
    : wxDialog(parent, wxID_ANY, "Open Runs", wxDefaultPosition, wxSize(640, 460),
               wxDEFAULT_DIALOG_STYLE | wxRESIZE_BORDER),
      m_svc(svc),
      m_sessionRoot(std::move(session_root)),
      m_docRoot(std::move(doc_root)) {
    auto* s = new wxBoxSizer(wxVERTICAL);

    auto* rootRow = new wxBoxSizer(wxHORIZONTAL);
    m_rootLabel = new wxStaticText(this, wxID_ANY, "");
    auto* change = new wxButton(this, wxID_ANY, "Store root…");
    change->Bind(wxEVT_BUTTON, &RunPickerDialog::OnChangeRoot, this);
    rootRow->Add(m_rootLabel, 1, wxALIGN_CENTER_VERTICAL | wxRIGHT, 8);
    rootRow->Add(change, 0);
    s->Add(rootRow, 0, wxEXPAND | wxALL, 8);

    m_list = new wxDataViewListCtrl(this, wxID_ANY, wxDefaultPosition,
                                    wxDefaultSize, wxDV_MULTIPLE);
    m_list->AppendTextColumn("Run #");
    m_list->AppendTextColumn("Experiment");
    m_list->AppendTextColumn("Name");
    m_list->AppendTextColumn("Done");
    m_list->AppendTextColumn("Last step");
    m_list->AppendTextColumn("Tags");
    s->Add(m_list, 1, wxEXPAND | wxLEFT | wxRIGHT, 8);

    s->Add(new wxStaticText(this, wxID_ANY,
                            "Select one or more runs to compare "
                            "(⌘-click / shift-click for multiple)."),
           0, wxALL, 8);
    s->Add(CreateButtonSizer(wxOK | wxCANCEL), 0, wxEXPAND | wxALL, 8);
    SetSizer(s);

    Bind(wxEVT_BUTTON, &RunPickerDialog::OnOk, this, wxID_OK);
    UpdateRootLabel();
    Populate();
}

void RunPickerDialog::UpdateRootLabel() {
    const std::string shown = m_docRoot.empty() ? m_sessionRoot : m_docRoot;
    const bool foreign =
        ClassifyStoreRoot(m_docRoot, m_sessionRoot) == StoreKind::kForeign;
    wxString txt = "Store: " + wxString::FromUTF8(shown);
    if (foreign)
        txt += "  [foreign — list shows the session store; relaunch rooted "
               "there to browse it]";
    m_rootLabel->SetLabel(txt);
    m_rootLabel->SetForegroundColour(foreign ? wxColour(0x9a, 0x67, 0x00)
                                             : wxSystemSettings::GetColour(
                                                   wxSYS_COLOUR_WINDOWTEXT));
}

void RunPickerDialog::Populate() {
    m_list->DeleteAllItems();
    m_rowIds.clear();
    if (!m_svc) return;

    MetricsQuery q(m_svc);
    DecodedTable t;
    if (!q.Run(SqlRunList(), &t)) return;
    const int idc = t.column("id"), ec = t.column("experiment"),
              nc = t.column("name"), dc = t.column("done"),
              lc = t.column("last_step"), tc = t.column("tag_count");
    for (auto& row : t.rows) {
        if (idc < 0) break;
        wxVector<wxVariant> r;
        r.push_back(wxVariant(row[idc].text()));
        r.push_back(wxVariant(ec >= 0 ? wxString::FromUTF8(row[ec].text()) : ""));
        r.push_back(wxVariant(nc >= 0 ? wxString::FromUTF8(row[nc].text()) : ""));
        r.push_back(wxVariant(dc >= 0 && row[dc].as_int() ? "yes" : ""));
        r.push_back(wxVariant(lc >= 0 ? wxString::FromUTF8(row[lc].text()) : ""));
        r.push_back(wxVariant(tc >= 0 ? wxString::FromUTF8(row[tc].text()) : ""));
        m_list->AppendItem(r);
        m_rowIds.push_back(row[idc].as_int());
    }
}

void RunPickerDialog::OnChangeRoot(wxCommandEvent&) {
    wxDirDialog dlg(this, "Choose a metrics store root",
                    wxString::FromUTF8(m_docRoot.empty() ? m_sessionRoot : m_docRoot));
    if (dlg.ShowModal() != wxID_OK) return;
    m_docRoot = dlg.GetPath().utf8_string();
    UpdateRootLabel();
}

void RunPickerDialog::OnOk(wxCommandEvent& e) {
    m_selected.clear();
    wxDataViewItemArray sel;
    m_list->GetSelections(sel);
    for (const auto& item : sel) {
        const int row = m_list->ItemToRow(item);
        if (row >= 0 && row < (int)m_rowIds.size())
            m_selected.push_back(m_rowIds[row]);
    }
    e.Skip();  // let the dialog close with wxID_OK
}

}  // namespace compass
