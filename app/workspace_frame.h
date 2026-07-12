// Compass C2 — WorkspaceFrame: the run-comparison document workspace.
//
// Builds on the C1 skeleton (rescued DocumentFrame: menus, AUI docking, layout;
// a live libcaliper viewport; the metrics.v1_1 read path; data_dir rooting) and
// makes it USEFUL (workflow (a), consumer spec §5(a)/§7-C2): open N runs from a
// metrics store side by side, native scalar tables + plots, annotations, a
// .compass project file, and a self-contained HTML report — all without Caliper's
// shell. The C1 panes remain (viewport / log / live metrics table) so C1's proof
// reproduces, but the comparison document is fully usable with the viewport hidden.

#ifndef COMPASS_C2_WORKSPACE_FRAME_H
#define COMPASS_C2_WORKSPACE_FRAME_H

#include <wx/timer.h>

#include <atomic>
#include <cstdint>
#include <string>
#include <vector>

#include <caliper/embed.h>
#include <caliper/services/jobs_v1.h>
#include <caliper/services/metrics_v1_1.h>

#include "compass/comparison_document.h"
#include "compass/document_frame.h"

class wxMenu;
class wxTextCtrl;

namespace compass {

class ViewportPanel;
class MetricsTable;
class ComparisonPanel;
class AnnotationsPanel;

class WorkspaceFrame : public DocumentFrame {
public:
    WorkspaceFrame();
    ~WorkspaceFrame() override;

    void PostLog(int level, const std::string& line);

protected:
    Document& document() override { return m_doc; }
    void NewDocument() override;
    void BuildWorkspace() override;
    void SyncViews() override;
    void PopulateFileMenu(wxMenu& file_menu) override;
    wxString DocumentWildcard() const override {
        return "Compass project (*.compass)|*.compass";
    }
    wxString DefaultFileName() const override { return "comparison"; }

private:
    void OnFirstShow(wxShowEvent& e);
    void InitCaliper();
    void ShutdownCaliper();
    void OnPumpTimer(wxTimerEvent&);
    void OnPollTimer(wxTimerEvent&);
    void AddViewToggles();
    void StartMetricsDemo();
    void AppendLog(const wxString& line);
    void OnCloseFrame(wxCloseEvent& e);

    // C2 workflow.
    void OnOpenRuns(wxCommandEvent&);
    void OnExportReport(wxCommandEvent&);
    void ApplyDocument();          // re-sync comparison/annotations from m_doc
    bool StoreIsForeign() const;   // doc store root vs the session root
    std::string SessionRoot() const;
    void RepushViewport();         // scale/size re-push (AUI float/dock/re-show)
    void RunSelfTest();            // headless workflow proof (COMPASS_C2_SELFTEST)

    static void DemoJob(void* user, const CaliperJobControl* ctl);

    ComparisonDocument m_doc;
    ViewportPanel* m_viewport = nullptr;
    wxTextCtrl* m_log = nullptr;
    MetricsTable* m_table = nullptr;       // C1 live all-runs table (proof)
    ComparisonPanel* m_comparison = nullptr;
    AnnotationsPanel* m_annotations = nullptr;

    wxTimer m_pump;
    wxTimer m_poll;
    wxTimer m_exit;
    wxTimer m_selftest;

    CaliperCore* m_core = nullptr;
    const CaliperMetricsV1_1* m_metrics = nullptr;
    const CaliperJobsV1* m_jobs = nullptr;
    bool m_caliperUp = false;

    struct DemoState {
        const CaliperMetricsV1_1* metrics = nullptr;
        uint64_t run = 0;
        std::atomic<bool> stop{false};
    } m_demo;
    uint64_t m_demoJob = 0;
    std::vector<int64_t> m_seededRuns;  // run ids the demo seeded (for self-test)
};

}  // namespace compass

#endif  // COMPASS_C2_WORKSPACE_FRAME_H
