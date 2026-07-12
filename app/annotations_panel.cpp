// Compass C2 — AnnotationsPanel implementation.

#include "annotations_panel.h"

#include <vector>

#include <wx/button.h>
#include <wx/choice.h>
#include <wx/dataview.h>
#include <wx/dialog.h>
#include <wx/sizer.h>
#include <wx/stattext.h>
#include <wx/textctrl.h>

namespace compass {
namespace {

// A small modal for composing/editing a note. Run is chosen from the document's
// runs (or "(document-level)"); step + tag are optional.
class AnnotationDialog : public wxDialog {
public:
    AnnotationDialog(wxWindow* parent, const ComparisonDocument& doc,
                     const Annotation& seed)
        : wxDialog(parent, wxID_ANY, "Annotation", wxDefaultPosition,
                   wxSize(420, 300)) {
        auto* s = new wxBoxSizer(wxVERTICAL);
        auto grid = new wxFlexGridSizer(2, 6, 8);
        grid->AddGrowableCol(1, 1);

        grid->Add(new wxStaticText(this, wxID_ANY, "Run:"), 0,
                  wxALIGN_CENTER_VERTICAL);
        m_run = new wxChoice(this, wxID_ANY);
        m_run->Append("(document-level)");
        m_runIds.push_back(-1);
        int sel = 0;
        for (auto& r : doc.runs()) {
            const wxString lbl =
                r.label.empty() ? wxString::Format("run %lld", (long long)r.id)
                                 : wxString::FromUTF8(r.label);
            m_run->Append(lbl);
            m_runIds.push_back(r.id);
            if (r.id == seed.run) sel = (int)m_runIds.size() - 1;
        }
        m_run->SetSelection(sel);
        grid->Add(m_run, 1, wxEXPAND);

        grid->Add(new wxStaticText(this, wxID_ANY, "Tag (optional):"), 0,
                  wxALIGN_CENTER_VERTICAL);
        m_tag = new wxTextCtrl(this, wxID_ANY, wxString::FromUTF8(seed.tag));
        grid->Add(m_tag, 1, wxEXPAND);

        grid->Add(new wxStaticText(this, wxID_ANY, "Step (optional):"), 0,
                  wxALIGN_CENTER_VERTICAL);
        m_step = new wxTextCtrl(this, wxID_ANY,
                                seed.step >= 0
                                    ? wxString::Format("%lld", (long long)seed.step)
                                    : "");
        grid->Add(m_step, 1, wxEXPAND);

        s->Add(grid, 0, wxEXPAND | wxALL, 10);
        s->Add(new wxStaticText(this, wxID_ANY, "Note:"), 0, wxLEFT | wxRIGHT, 10);
        m_text = new wxTextCtrl(this, wxID_ANY, wxString::FromUTF8(seed.text),
                                wxDefaultPosition, wxDefaultSize, wxTE_MULTILINE);
        s->Add(m_text, 1, wxEXPAND | wxALL, 10);
        s->Add(CreateButtonSizer(wxOK | wxCANCEL), 0, wxEXPAND | wxALL, 8);
        SetSizer(s);
    }

    Annotation Result(int64_t keep_id) const {
        Annotation a;
        a.id = keep_id;
        const int sel = m_run->GetSelection();
        a.run = (sel >= 0 && sel < (int)m_runIds.size()) ? m_runIds[sel] : -1;
        a.tag = m_tag->GetValue().utf8_string();
        long step = -1;
        a.step = m_step->GetValue().ToLong(&step) ? step : -1;
        a.text = m_text->GetValue().utf8_string();
        return a;
    }

private:
    wxChoice* m_run;
    wxTextCtrl* m_tag;
    wxTextCtrl* m_step;
    wxTextCtrl* m_text;
    std::vector<int64_t> m_runIds;
};

}  // namespace

AnnotationsPanel::AnnotationsPanel(wxWindow* parent, ComparisonDocument* doc,
                                   std::function<void()> on_changed)
    : wxPanel(parent, wxID_ANY),
      m_doc(doc),
      m_onChanged(std::move(on_changed)) {
    auto* s = new wxBoxSizer(wxVERTICAL);
    m_list = new wxDataViewListCtrl(this, wxID_ANY);
    m_list->AppendTextColumn("Run");
    m_list->AppendTextColumn("Tag");
    m_list->AppendTextColumn("Step");
    m_list->AppendTextColumn("Note", wxDATAVIEW_CELL_INERT, 260);
    s->Add(m_list, 1, wxEXPAND | wxALL, 4);

    auto* row = new wxBoxSizer(wxHORIZONTAL);
    auto* add = new wxButton(this, wxID_ADD, "Add…");
    auto* edit = new wxButton(this, wxID_EDIT, "Edit…");
    auto* del = new wxButton(this, wxID_DELETE, "Delete");
    row->Add(add, 0, wxRIGHT, 4);
    row->Add(edit, 0, wxRIGHT, 4);
    row->Add(del, 0);
    s->Add(row, 0, wxALL, 4);
    SetSizer(s);

    add->Bind(wxEVT_BUTTON, &AnnotationsPanel::OnAdd, this);
    edit->Bind(wxEVT_BUTTON, &AnnotationsPanel::OnEdit, this);
    del->Bind(wxEVT_BUTTON, &AnnotationsPanel::OnDelete, this);
    Rebuild();
}

void AnnotationsPanel::Rebuild() {
    m_list->DeleteAllItems();
    for (const auto& a : m_doc->annotations()) {
        wxVector<wxVariant> r;
        r.push_back(wxVariant(a.run >= 0 ? wxString::Format("%lld", (long long)a.run)
                                         : wxString("—")));
        r.push_back(wxVariant(wxString::FromUTF8(a.tag)));
        r.push_back(wxVariant(a.step >= 0 ? wxString::Format("%lld", (long long)a.step)
                                          : wxString("—")));
        r.push_back(wxVariant(wxString::FromUTF8(a.text)));
        m_list->AppendItem(r, static_cast<wxUIntPtr>(a.id));
    }
}

int64_t AnnotationsPanel::SelectedId() const {
    const int row = m_list->GetSelectedRow();
    if (row == wxNOT_FOUND) return -1;
    return static_cast<int64_t>(m_list->GetItemData(m_list->RowToItem(row)));
}

void AnnotationsPanel::OnAdd(wxCommandEvent&) {
    AnnotationDialog dlg(this, *m_doc, Annotation{});
    if (dlg.ShowModal() != wxID_OK) return;
    const Annotation a = dlg.Result(0);
    if (a.text.empty()) return;
    m_doc->AddAnnotation(a.run, a.step, a.tag, a.text);
    Rebuild();
    if (m_onChanged) m_onChanged();
}

void AnnotationsPanel::OnEdit(wxCommandEvent&) {
    const int64_t id = SelectedId();
    if (id < 0) return;
    const Annotation* cur = nullptr;
    for (const auto& a : m_doc->annotations())
        if (a.id == id) cur = &a;
    if (!cur) return;
    AnnotationDialog dlg(this, *m_doc, *cur);
    if (dlg.ShowModal() != wxID_OK) return;
    const Annotation edited = dlg.Result(id);
    // Text edit + rebind (delete + re-add keeps run/step/tag current).
    m_doc->DeleteAnnotation(id);
    m_doc->AddAnnotation(edited.run, edited.step, edited.tag, edited.text);
    Rebuild();
    if (m_onChanged) m_onChanged();
}

void AnnotationsPanel::OnDelete(wxCommandEvent&) {
    const int64_t id = SelectedId();
    if (id < 0) return;
    if (m_doc->DeleteAnnotation(id)) {
        Rebuild();
        if (m_onChanged) m_onChanged();
    }
}

}  // namespace compass
