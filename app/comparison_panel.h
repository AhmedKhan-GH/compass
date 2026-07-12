// Compass C2 — ComparisonPanel.
//
// The side-by-side comparison view (spec §3), usable with the viewport hidden
// (P2-pure): a scalar stats table (per-tag last/min/max per run, runs as columns
// — wxDataViewListCtrl) beside a native scalar plot (PlotSeriesCanvas) with a tag
// selector, plus an honest checkpoint-visibility caveat banner for foreign stores.
// It re-queries caliper.metrics.v1_1 for the DOCUMENT'S run set only (run-filtered
// — superseding C1's flat all-runs dump).

#ifndef COMPASS_C2_COMPARISON_PANEL_H
#define COMPASS_C2_COMPARISON_PANEL_H

#include <wx/panel.h>

#include <caliper/services/metrics_v1_1.h>

#include "compass/comparison_document.h"

class wxChoice;
class wxDataViewListCtrl;
class wxStaticText;

namespace compass {

class PlotSeriesCanvas;

// The default series color for a run: its explicit color, else a palette pick.
wxColour RunColor(const RunDisplay& r, int index);

class ComparisonPanel : public wxPanel {
public:
    ComparisonPanel(wxWindow* parent, ComparisonDocument* doc);

    void SetService(const CaliperMetricsV1_1* svc);
    void SetStoreForeign(bool foreign);

    // Re-query the store for the document's runs + selected tag; rebuild views.
    void Rebuild();

private:
    void OnTagChanged(wxCommandEvent&);
    void RebuildTable();
    void RebuildPlot();
    void RefreshTagChoice();

    ComparisonDocument* m_doc;
    const CaliperMetricsV1_1* m_svc = nullptr;
    bool m_foreign = false;

    wxStaticText* m_caveat = nullptr;
    wxDataViewListCtrl* m_table = nullptr;
    wxChoice* m_tagChoice = nullptr;
    PlotSeriesCanvas* m_plot = nullptr;
};

}  // namespace compass

#endif  // COMPASS_C2_COMPARISON_PANEL_H
