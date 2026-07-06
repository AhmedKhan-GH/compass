// Compass — Plot Workbench (Instrument #1)
// ExpressionPanel: the docked list of expressions (visible toggle, editable text,
// parse-error badge) + Add/Remove. Edits push PlotDocument commands and notify.

#pragma once

#include <functional>

#include <wx/panel.h>

class wxDataViewListCtrl;
class wxDataViewEvent;

namespace plot {
class PlotDocument;
}

class ExpressionPanel : public wxPanel {
public:
    ExpressionPanel(wxWindow* parent, plot::PlotDocument* doc,
                    std::function<void()> on_changed);

    // Rebuild the list from the document (after undo/redo or external changes).
    void ReloadFromDoc();

private:
    void OnAdd(wxCommandEvent& event);
    void OnRemove(wxCommandEvent& event);
    void OnValueChanged(wxDataViewEvent& event);

    plot::PlotDocument* m_doc;         // not owned
    std::function<void()> m_onChanged;
    wxDataViewListCtrl* m_list;
    bool m_reloading = false;          // suppress command emission during reload
};
