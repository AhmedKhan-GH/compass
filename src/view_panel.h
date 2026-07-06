// Compass — Plot Workbench (Instrument #1)
// ViewPanel: wxPropertyGrid editing the view rectangle (xmin/xmax/ymin/ymax) and
// grid toggle. Edits push a SetView command; ReloadFromDoc() reflects external
// changes (pan/zoom, undo).

#pragma once

#include <functional>

#include <wx/panel.h>

class wxPropertyGrid;
class wxPropertyGridEvent;

namespace plot {
class PlotDocument;
}

class ViewPanel : public wxPanel {
public:
    ViewPanel(wxWindow* parent, plot::PlotDocument* doc,
              std::function<void()> on_changed);

    void ReloadFromDoc();

private:
    void OnChanged(wxPropertyGridEvent& event);

    plot::PlotDocument* m_doc;  // not owned
    std::function<void()> m_onChanged;
    wxPropertyGrid* m_pg;
    bool m_reloading = false;
};
