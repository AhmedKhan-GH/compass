// Compass — Plot Workbench (Instrument #1)
// ExpressionPanel implementation.

#include "expression_panel.h"

#include <wx/button.h>
#include <wx/checkbox.h>
#include <wx/scrolwin.h>
#include <wx/settings.h>
#include <wx/sizer.h>
#include <wx/textctrl.h>

#include "plot/expression.h"
#include "plot/plot_document.h"

namespace {
// Cycled as new expressions are added.
const char* const kPalette[] = {"#4C6EF5", "#F03E3E", "#37B24D", "#F59F00",
                                "#AE3EC9", "#1098AD", "#E64980", "#7048E8"};
constexpr int kPaletteSize = 8;
}  // namespace

ExpressionPanel::ExpressionPanel(wxWindow* parent, plot::PlotDocument* doc,
                                 std::function<void()> on_changed)
    : wxPanel(parent, wxID_ANY), m_doc(doc), m_onChanged(std::move(on_changed)) {
    m_list = new wxScrolledWindow(this, wxID_ANY);
    m_list->SetScrollRate(0, 8);
    m_listSizer = new wxBoxSizer(wxVERTICAL);
    m_list->SetSizer(m_listSizer);

    auto* addBtn = new wxButton(this, wxID_ANY, "+ Add expression");
    addBtn->Bind(wxEVT_BUTTON, [this](wxCommandEvent&) { OnAdd(); });

    auto* sizer = new wxBoxSizer(wxVERTICAL);
    sizer->Add(m_list, 1, wxEXPAND | wxALL, 2);
    sizer->Add(addBtn, 0, wxEXPAND | wxLEFT | wxRIGHT | wxBOTTOM, 4);
    SetSizer(sizer);

    Rebuild();
}

void ExpressionPanel::ApplyStatus(wxTextCtrl* ctrl, const std::string& text) {
    if (text.empty()) {
        ctrl->SetForegroundColour(wxNullColour);
        ctrl->UnsetToolTip();
    } else {
        plot::Expression e = plot::Expression::Compile(text);
        if (e.has_error()) {
            // red on parse error; brighter variant stays legible on dark bg (design §3)
            ctrl->SetForegroundColour(wxSystemSettings::GetAppearance().IsDark()
                                          ? wxColour(255, 110, 110)
                                          : wxColour(200, 0, 0));
            ctrl->SetToolTip(wxString::Format("column %d: %s", e.error().column,
                                              e.error().message));
        } else {
            ctrl->SetForegroundColour(wxNullColour);
            ctrl->UnsetToolTip();
        }
    }
    ctrl->Refresh();
}

void ExpressionPanel::Rebuild() {
    m_reloading = true;
    m_listSizer->Clear(/*delete_windows=*/true);
    m_rows.clear();

    const auto& exprs = m_doc->expressions();
    for (std::size_t i = 0; i < exprs.size(); ++i) {
        auto* rowSizer = new wxBoxSizer(wxHORIZONTAL);

        auto* chk = new wxCheckBox(m_list, wxID_ANY, "");
        chk->SetValue(exprs[i].style.visible);
        chk->Bind(wxEVT_CHECKBOX, [this, i](wxCommandEvent& e) {
            if (m_reloading || i >= m_doc->expressions().size()) return;
            plot::Style s = m_doc->expressions()[i].style;
            s.visible = e.IsChecked();
            m_doc->SetExpressionStyle(i, s);
            if (m_onChanged) m_onChanged();
        });

        auto* txt = new wxTextCtrl(m_list, wxID_ANY, exprs[i].text,
                                   wxDefaultPosition, wxDefaultSize,
                                   wxTE_PROCESS_ENTER);
        txt->Bind(wxEVT_TEXT, [this, i](wxCommandEvent&) {
            if (m_reloading) return;
            CommitText(i);
        });

        auto* rm = new wxButton(m_list, wxID_ANY, "x", wxDefaultPosition,
                                wxSize(28, -1));
        rm->Bind(wxEVT_BUTTON, [this, i](wxCommandEvent&) {
            if (i >= m_doc->expressions().size()) return;
            m_doc->RemoveExpression(i);
            if (m_onChanged) m_onChanged();
        });

        rowSizer->Add(chk, 0, wxALIGN_CENTER_VERTICAL | wxRIGHT, 2);
        rowSizer->Add(txt, 1, wxALIGN_CENTER_VERTICAL);
        rowSizer->Add(rm, 0, wxALIGN_CENTER_VERTICAL | wxLEFT, 2);
        m_listSizer->Add(rowSizer, 0, wxEXPAND | wxALL, 2);

        ApplyStatus(txt, exprs[i].text);
        m_rows.push_back({chk, txt});
    }
    m_list->Layout();
    m_list->FitInside();
    m_reloading = false;
}

void ExpressionPanel::ReloadFromDoc() {
    // Structure change (add/remove) → full rebuild; otherwise update in place so
    // the field the user is typing in is never destroyed under them.
    if (m_rows.size() != m_doc->expressions().size()) {
        Rebuild();
        return;
    }
    m_reloading = true;
    const auto& exprs = m_doc->expressions();
    for (std::size_t i = 0; i < m_rows.size(); ++i) {
        m_rows[i].visible->SetValue(exprs[i].style.visible);
        wxTextCtrl* t = m_rows[i].text;
        if (!t->HasFocus() &&
            std::string(t->GetValue().utf8_string()) != exprs[i].text) {
            t->ChangeValue(exprs[i].text);  // ChangeValue does not fire wxEVT_TEXT
        }
        ApplyStatus(t, exprs[i].text);
    }
    m_reloading = false;
}

void ExpressionPanel::CommitText(std::size_t index) {
    if (index >= m_rows.size()) return;
    const std::string text(m_rows[index].text->GetValue().utf8_string());
    m_doc->EditExpressionText(index, text);
    ApplyStatus(m_rows[index].text, text);
    if (m_onChanged) m_onChanged();
}

void ExpressionPanel::OnAdd() {
    plot::Style s;
    s.color = kPalette[m_doc->expressions().size() % kPaletteSize];
    m_doc->AddExpression(plot::ExprEntry{"", s});
    Rebuild();                       // structural change
    if (!m_rows.empty()) {
        m_rows.back().text->SetFocus();  // ready to type immediately
    }
    if (m_onChanged) m_onChanged();
}
