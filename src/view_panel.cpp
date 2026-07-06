// Compass — Plot Workbench (Instrument #1)
// ViewPanel implementation.

#include "view_panel.h"

#include <wx/propgrid/propgrid.h>
#include <wx/propgrid/props.h>
#include <wx/sizer.h>

#include "plot/plot_document.h"

namespace {
const wxString kXMin = "xmin";
const wxString kXMax = "xmax";
const wxString kYMin = "ymin";
const wxString kYMax = "ymax";
const wxString kGrid = "grid";
}  // namespace

ViewPanel::ViewPanel(wxWindow* parent, plot::PlotDocument* doc,
                     std::function<void()> on_changed)
    : wxPanel(parent, wxID_ANY), m_doc(doc), m_onChanged(std::move(on_changed)) {
    m_pg = new wxPropertyGrid(this, wxID_ANY, wxDefaultPosition, wxDefaultSize,
                              wxPG_SPLITTER_AUTO_CENTER);
    m_pg->Append(new wxFloatProperty("X min", kXMin));
    m_pg->Append(new wxFloatProperty("X max", kXMax));
    m_pg->Append(new wxFloatProperty("Y min", kYMin));
    m_pg->Append(new wxFloatProperty("Y max", kYMax));
    m_pg->Append(new wxBoolProperty("Grid", kGrid));
    m_pg->SetPropertyAttribute(kGrid, wxPG_BOOL_USE_CHECKBOX, true);

    auto* sizer = new wxBoxSizer(wxVERTICAL);
    sizer->Add(m_pg, 1, wxEXPAND);
    SetSizer(sizer);

    m_pg->Bind(wxEVT_PG_CHANGED, &ViewPanel::OnChanged, this);
    ReloadFromDoc();
}

void ViewPanel::ReloadFromDoc() {
    m_reloading = true;
    const plot::ViewRect& v = m_doc->view();
    m_pg->SetPropertyValue(kXMin, v.xmin);
    m_pg->SetPropertyValue(kXMax, v.xmax);
    m_pg->SetPropertyValue(kYMin, v.ymin);
    m_pg->SetPropertyValue(kYMax, v.ymax);
    m_pg->SetPropertyValue(kGrid, v.grid);
    m_reloading = false;
}

void ViewPanel::OnChanged(wxPropertyGridEvent&) {
    if (m_reloading) return;
    plot::ViewRect v;
    v.xmin = m_pg->GetPropertyValue(kXMin).GetDouble();
    v.xmax = m_pg->GetPropertyValue(kXMax).GetDouble();
    v.ymin = m_pg->GetPropertyValue(kYMin).GetDouble();
    v.ymax = m_pg->GetPropertyValue(kYMax).GetDouble();
    v.grid = m_pg->GetPropertyValue(kGrid).GetBool();
    // Ignore degenerate ranges (the document would reject drawing them anyway).
    if (!(v.xmin < v.xmax) || !(v.ymin < v.ymax)) return;
    m_doc->SetView(v);
    if (m_onChanged) m_onChanged();
}
