// Compass C2 — AnnotationsPanel.
//
// Create/edit/delete free-text notes on the comparison document (spec §4). Each
// note may bind to a run, a step, and a scalar tag so the plot can drop a marker.
// Stored in the .compass file via the document; edits fire onChanged so the frame
// re-syncs the plot markers + dirty title.

#ifndef COMPASS_C2_ANNOTATIONS_PANEL_H
#define COMPASS_C2_ANNOTATIONS_PANEL_H

#include <functional>

#include <wx/panel.h>

#include "compass/comparison_document.h"

class wxDataViewListCtrl;

namespace compass {

class AnnotationsPanel : public wxPanel {
public:
    AnnotationsPanel(wxWindow* parent, ComparisonDocument* doc,
                     std::function<void()> on_changed);

    void Rebuild();  // repopulate from the document

private:
    void OnAdd(wxCommandEvent&);
    void OnEdit(wxCommandEvent&);
    void OnDelete(wxCommandEvent&);
    int64_t SelectedId() const;

    ComparisonDocument* m_doc;
    std::function<void()> m_onChanged;
    wxDataViewListCtrl* m_list = nullptr;
};

}  // namespace compass

#endif  // COMPASS_C2_ANNOTATIONS_PANEL_H
