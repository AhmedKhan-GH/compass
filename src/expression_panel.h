// Compass — Plot Workbench (Instrument #1)
// ExpressionPanel: the docked list of expressions. Each row is an always-editable
// text field (click and type — Desmos-style) with a visibility checkbox and a
// remove button; edits replot live and push coalesced undo steps. An "Add" button
// appends a fresh field.

#pragma once

#include <cstddef>
#include <functional>
#include <vector>

#include <wx/panel.h>

class wxScrolledWindow;
class wxBoxSizer;
class wxCheckBox;
class wxTextCtrl;

namespace plot {
class PlotDocument;
}

class ExpressionPanel : public wxPanel {
public:
    ExpressionPanel(wxWindow* parent, plot::PlotDocument* doc,
                    std::function<void()> on_changed);

    // Reconcile the UI with the document (after undo/redo or external changes).
    void ReloadFromDoc();

private:
    struct Row {
        wxCheckBox* visible;
        wxTextCtrl* text;
    };

    void Rebuild();                       // recreate all rows (structure changed)
    void OnAdd();
    void CommitText(std::size_t index);   // push the row's text into the document
    void ApplyStatus(wxTextCtrl* ctrl, const std::string& text);  // red on parse error

    plot::PlotDocument* m_doc;            // not owned
    std::function<void()> m_onChanged;
    wxScrolledWindow* m_list = nullptr;
    wxBoxSizer* m_listSizer = nullptr;
    std::vector<Row> m_rows;
    bool m_reloading = false;
};
