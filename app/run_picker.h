// Compass C2 — RunPickerDialog (File ▸ Open Runs…).
//
// A native multi-select picker over caliper.metrics.v1_1: lists the session
// store's runs (id, experiment, name, done, last step, tag count — SqlRunList),
// and lets the user choose N to populate the comparison document's run set. A
// "Store root…" control records the document's store-root property; pointing at a
// root other than the running session's is flagged foreign (the run list still
// reflects the session store — a foreign store is browsed by relaunching Compass
// rooted there, the honest same-process limit).

#ifndef COMPASS_C2_RUN_PICKER_H
#define COMPASS_C2_RUN_PICKER_H

#include <cstdint>
#include <string>
#include <vector>

#include <wx/dialog.h>

#include <caliper/services/metrics_v1_1.h>

class wxDataViewListCtrl;
class wxStaticText;

namespace compass {

class RunPickerDialog : public wxDialog {
public:
    // session_root is the root the running core is rooted at (for foreign detection).
    RunPickerDialog(wxWindow* parent, const CaliperMetricsV1_1* svc,
                    std::string session_root, std::string doc_root);

    const std::vector<int64_t>& SelectedRuns() const { return m_selected; }
    const std::string& StoreRoot() const { return m_docRoot; }

private:
    void Populate();
    void OnChangeRoot(wxCommandEvent&);
    void OnOk(wxCommandEvent&);
    void UpdateRootLabel();

    const CaliperMetricsV1_1* m_svc;
    std::string m_sessionRoot;
    std::string m_docRoot;
    std::vector<int64_t> m_rowIds;    // run id per table row
    std::vector<int64_t> m_selected;  // result

    wxDataViewListCtrl* m_list = nullptr;
    wxStaticText* m_rootLabel = nullptr;
};

}  // namespace compass

#endif  // COMPASS_C2_RUN_PICKER_H
