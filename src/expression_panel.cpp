// Compass — Plot Workbench (Instrument #1)
// ExpressionPanel implementation.

#include "expression_panel.h"

#include <wx/button.h>
#include <wx/dataview.h>
#include <wx/sizer.h>

#include "plot/expression.h"
#include "plot/plot_document.h"

namespace {

// Column indices in the wxDataViewListCtrl.
constexpr int kColVisible = 0;
constexpr int kColText = 1;
constexpr int kColStatus = 2;

// A small palette cycled as expressions are added.
const char* const kPalette[] = {"#4C6EF5", "#F03E3E", "#37B24D", "#F59F00",
                                "#AE3EC9", "#1098AD", "#E64980", "#7048E8"};
constexpr int kPaletteSize = 8;

// "ok" or a short parse-error badge for the status column.
wxString StatusFor(const std::string& text) {
    plot::Expression e = plot::Expression::Compile(text);
    if (!e.has_error()) return "ok";
    return wxString::Format("err@%d", e.error().column);
}

}  // namespace

ExpressionPanel::ExpressionPanel(wxWindow* parent, plot::PlotDocument* doc,
                                 std::function<void()> on_changed)
    : wxPanel(parent, wxID_ANY), m_doc(doc), m_onChanged(std::move(on_changed)) {
    m_list = new wxDataViewListCtrl(this, wxID_ANY);
    m_list->AppendToggleColumn("✓", wxDATAVIEW_CELL_ACTIVATABLE, 28);
    m_list->AppendTextColumn("Expression", wxDATAVIEW_CELL_EDITABLE, 150);
    m_list->AppendTextColumn("Status", wxDATAVIEW_CELL_INERT, 60);

    auto* addBtn = new wxButton(this, wxID_ANY, "Add");
    auto* remBtn = new wxButton(this, wxID_ANY, "Remove");
    auto* btns = new wxBoxSizer(wxHORIZONTAL);
    btns->Add(addBtn, 0, wxRIGHT, 4);
    btns->Add(remBtn, 0);

    auto* sizer = new wxBoxSizer(wxVERTICAL);
    sizer->Add(m_list, 1, wxEXPAND | wxALL, 4);
    sizer->Add(btns, 0, wxLEFT | wxBOTTOM, 4);
    SetSizer(sizer);

    addBtn->Bind(wxEVT_BUTTON, &ExpressionPanel::OnAdd, this);
    remBtn->Bind(wxEVT_BUTTON, &ExpressionPanel::OnRemove, this);
    m_list->Bind(wxEVT_DATAVIEW_ITEM_VALUE_CHANGED,
                 &ExpressionPanel::OnValueChanged, this);

    ReloadFromDoc();
}

void ExpressionPanel::ReloadFromDoc() {
    m_reloading = true;
    m_list->DeleteAllItems();
    for (const plot::ExprEntry& e : m_doc->expressions()) {
        wxVector<wxVariant> row;
        row.push_back(wxVariant(e.style.visible));
        row.push_back(wxVariant(wxString(e.text)));
        row.push_back(wxVariant(StatusFor(e.text)));
        m_list->AppendItem(row);
    }
    m_reloading = false;
}

void ExpressionPanel::OnAdd(wxCommandEvent&) {
    plot::Style s;
    s.color = kPalette[m_doc->expressions().size() % kPaletteSize];
    m_doc->AddExpression(plot::ExprEntry{"x", s});
    if (m_onChanged) m_onChanged();
}

void ExpressionPanel::OnRemove(wxCommandEvent&) {
    const int row = m_list->GetSelectedRow();
    if (row == wxNOT_FOUND) return;
    m_doc->RemoveExpression(static_cast<std::size_t>(row));
    if (m_onChanged) m_onChanged();
}

void ExpressionPanel::OnValueChanged(wxDataViewEvent& event) {
    if (m_reloading) return;
    const int row = m_list->ItemToRow(event.GetItem());
    if (row == wxNOT_FOUND) return;
    const std::size_t index = static_cast<std::size_t>(row);
    if (index >= m_doc->expressions().size()) return;

    const int col = event.GetColumn();
    if (col == kColVisible) {
        plot::Style s = m_doc->expressions()[index].style;
        s.visible = m_list->GetToggleValue(row, kColVisible);
        m_doc->SetExpressionStyle(index, s);
    } else if (col == kColText) {
        const wxString text = m_list->GetTextValue(row, kColText);
        m_doc->EditExpressionText(index, std::string(text.utf8_string()));
        // Refresh this row's status badge in place.
        m_reloading = true;
        m_list->SetTextValue(StatusFor(std::string(text.utf8_string())), row,
                             kColStatus);
        m_reloading = false;
    } else {
        return;
    }
    if (m_onChanged) m_onChanged();
}
