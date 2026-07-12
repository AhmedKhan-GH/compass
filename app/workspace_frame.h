// Compass C1 — WorkspaceFrame.
//
// The C1 shell: a compass::DocumentFrame (rescued from libcompass — menus, AUI
// docking, layout persistence) subclass that hosts a live libcaliper core. It
// owns three AUI panes —
//   P1 Viewport : a ViewportPanel whose NSView is the core's canvas
//   P2 Log      : a wxTextCtrl fed by the CoreDesc log_fn (core + applet lines)
//   P2 Table    : a MetricsTable over caliper.metrics.v1_1 (live rows)
// — and the two UI-thread timers that drive them: a ~60 Hz frame pump (only while
// the viewport is shown) and a metrics poll.
//
// It also drives the metrics DEMO source: instance_scope does not emit metrics,
// so (per the brief) the frame begins a run labeled "compass.demo" and streams
// scalars from a caliper.jobs.v1 worker — the clearly-labeled live source the
// table displays.

#ifndef COMPASS_C1_WORKSPACE_FRAME_H
#define COMPASS_C1_WORKSPACE_FRAME_H

#include <wx/timer.h>

#include <atomic>
#include <cstdint>
#include <string>

#include <caliper/embed.h>
#include <caliper/services/jobs_v1.h>
#include <caliper/services/metrics_v1_1.h>

#include "compass/document_frame.h"
#include "stub_document.h"

class wxTextCtrl;  // global wx type (not compass::)

namespace compass {

class ViewportPanel;
class MetricsTable;

class WorkspaceFrame : public DocumentFrame {
public:
    WorkspaceFrame();
    ~WorkspaceFrame() override;

    // Called from the process-static log/crash trampolines (any thread). Marshals
    // to the UI thread and appends to the Log pane.
    void PostLog(int level, const std::string& line);

protected:
    // --- DocumentFrame contract ---
    Document& document() override { return m_doc; }
    void NewDocument() override {}
    void BuildWorkspace() override;
    void SyncViews() override {}
    wxString DocumentWildcard() const override {
        return "Compass project (*.compass)|*.compass";
    }

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

    // The jobs.v1 worker body (runs on a host worker thread). Static to match
    // CaliperJobFn; reads DemoState (a private nested type) via `user`.
    static void DemoJob(void* user, const CaliperJobControl* ctl);

    StubDocument m_doc;
    ViewportPanel* m_viewport = nullptr;
    wxTextCtrl* m_log = nullptr;
    MetricsTable* m_table = nullptr;

    wxTimer m_pump;   // frame pump
    wxTimer m_poll;   // metrics poll
    wxTimer m_exit;   // optional headless auto-close (COMPASS_EXIT_AFTER)

    CaliperCore* m_core = nullptr;
    const CaliperMetricsV1_1* m_metrics = nullptr;
    const CaliperJobsV1* m_jobs = nullptr;
    bool m_caliperUp = false;

    // Demo-run state. Heap-stable for the lifetime of the frame so the jobs.v1
    // worker (which outlives submit) can safely reference it.
    struct DemoState {
        const CaliperMetricsV1_1* metrics = nullptr;
        uint64_t run = 0;
        std::atomic<bool> stop{false};
    } m_demo;
    uint64_t m_demoJob = 0;
};

}  // namespace compass

#endif  // COMPASS_C1_WORKSPACE_FRAME_H
