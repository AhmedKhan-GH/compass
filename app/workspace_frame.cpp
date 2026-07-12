// Compass C1 — WorkspaceFrame implementation.

#include "workspace_frame.h"

#include <wx/menu.h>
#include <wx/textctrl.h>

#include <chrono>
#include <cmath>
#include <cstdlib>
#include <thread>

#include "metrics_table.h"
#include "viewport_panel.h"

#ifndef COMPASS_APPLETS_DIR_DEFAULT
#define COMPASS_APPLETS_DIR_DEFAULT ""
#endif

namespace compass {
namespace {

// One core per process (embed.h) → one frame owns the log/crash trampolines.
WorkspaceFrame* g_frame = nullptr;

constexpr int kIdViewViewport = wxID_HIGHEST + 100;
constexpr int kIdViewLog      = wxID_HIGHEST + 101;
constexpr int kIdViewTable    = wxID_HIGHEST + 102;

const char* applet_id() {
    if (const char* e = std::getenv("COMPASS_APPLET")) return e;
    return "dev.caliper.instance-scope";
}

const char* applets_dir() {
    if (const char* e = std::getenv("CALIPER_EMBED_APPLETS")) return e;
    static const char* kDefault = COMPASS_APPLETS_DIR_DEFAULT;
    return (kDefault && kDefault[0]) ? kDefault : nullptr;
}

// Compass's OWN per-app data root (CaliperCoreDesc.data_dir). A document app
// roots its metrics/artifacts store here rather than sharing caliper's OS-default
// store — which also sidesteps a stale/incompatible shared metrics.duckdb. Env
// override: COMPASS_DATA_DIR. The core creates the dir if missing (embed.h §3.3).
const char* data_dir() {
    static std::string dir;
    if (const char* e = std::getenv("COMPASS_DATA_DIR")) {
        dir = e;
    } else if (const char* home = std::getenv("HOME")) {
        dir = std::string(home) + "/Library/Application Support/Compass/c1";
    } else {
        dir = "/tmp/compass-c1";
    }
    return dir.c_str();
}

void LogTrampoline(void* ud, int level, const char* msg) {
    if (ud && msg) static_cast<WorkspaceFrame*>(ud)->PostLog(level, msg);
}
void CrashTrampoline(void* ud, const char* applet, const char* fault) {
    if (!ud) return;
    std::string s = "applet '";
    s += applet ? applet : "?";
    s += "' faulted and was quarantined (host lives on): ";
    s += fault ? fault : "?";
    static_cast<WorkspaceFrame*>(ud)->PostLog(3, s);
}

}  // namespace

WorkspaceFrame::WorkspaceFrame() : DocumentFrame("Compass") {
    g_frame = this;
    FinishConstruction();  // rescued shell: menus, AUI, layout, title
    AddViewToggles();

    m_pump.Bind(wxEVT_TIMER, &WorkspaceFrame::OnPumpTimer, this);
    m_poll.Bind(wxEVT_TIMER, &WorkspaceFrame::OnPollTimer, this);

    // Defer core init until the frame (and thus the viewport's NSView) is on
    // screen — GetHandle() is only a valid NSView post-Show (survey Q4 risk #2).
    Bind(wxEVT_SHOW, &WorkspaceFrame::OnFirstShow, this);
    // Tear the core down before wx destroys the view. Bound after the base's
    // OnClose so this runs first; Skip() lets the base save layout + close.
    Bind(wxEVT_CLOSE_WINDOW, &WorkspaceFrame::OnCloseFrame, this);
}

WorkspaceFrame::~WorkspaceFrame() {
    ShutdownCaliper();
    if (g_frame == this) g_frame = nullptr;
}

void WorkspaceFrame::BuildWorkspace() {
    m_viewport = new ViewportPanel(this, [this](const CaliperInputEvent& ev) {
        if (m_core) caliper_core_event(m_core, &ev);
    });
    m_log = new wxTextCtrl(this, wxID_ANY, "", wxDefaultPosition, wxDefaultSize,
                           wxTE_MULTILINE | wxTE_READONLY | wxTE_DONTWRAP);
    m_table = new MetricsTable(
        this, [this](const std::string& s) { AppendLog(wxString::FromUTF8(s)); });

    aui().AddPane(m_viewport, wxAuiPaneInfo()
                                  .Name("viewport")
                                  .CenterPane()
                                  .Caption("Viewport"));
    aui().AddPane(m_table, wxAuiPaneInfo()
                               .Name("table")
                               .Caption("Metrics")
                               .Right()
                               .BestSize(420, 500)
                               .CloseButton(false));
    aui().AddPane(m_log, wxAuiPaneInfo()
                             .Name("log")
                             .Caption("Log")
                             .Bottom()
                             .BestSize(900, 180)
                             .CloseButton(false));
    AppendLog("Compass C1 — libcaliper host. Waiting for canvas…");
}

void WorkspaceFrame::AddViewToggles() {
    wxMenuBar* bar = GetMenuBar();
    if (!bar) return;
    const int viewIdx = bar->FindMenu("View");
    if (viewIdx == wxNOT_FOUND) return;
    wxMenu* view = bar->GetMenu(viewIdx);
    view->AppendSeparator();
    view->AppendCheckItem(kIdViewViewport, "Show &Viewport")->Check(true);
    view->AppendCheckItem(kIdViewLog, "Show &Log")->Check(true);
    view->AppendCheckItem(kIdViewTable, "Show &Metrics")->Check(true);

    auto toggle = [this](const char* name, bool show) {
        wxAuiPaneInfo& p = aui().GetPane(name);
        if (p.IsOk()) { p.Show(show); aui().Update(); }
    };
    Bind(wxEVT_MENU,
         [this, toggle](wxCommandEvent& e) { toggle("viewport", e.IsChecked()); },
         kIdViewViewport);
    Bind(wxEVT_MENU,
         [this, toggle](wxCommandEvent& e) { toggle("log", e.IsChecked()); },
         kIdViewLog);
    Bind(wxEVT_MENU,
         [this, toggle](wxCommandEvent& e) { toggle("table", e.IsChecked()); },
         kIdViewTable);
}

void WorkspaceFrame::OnFirstShow(wxShowEvent& e) {
    e.Skip();
    if (!e.IsShown() || m_caliperUp || m_core) return;
    // One more turn of the loop so AppKit finishes realizing the NSView.
    CallAfter([this] { InitCaliper(); });
}

void WorkspaceFrame::InitCaliper() {
    if (m_caliperUp || m_core) return;

    CaliperCoreDesc desc{};
    desc.struct_size = sizeof desc;
    desc.renderer    = CALIPER_RENDERER_DEFAULT;   // Metal on Apple
    desc.data_dir    = data_dir();                 // Compass's own per-app root
    desc.applets_dir = applets_dir();
    desc.log_fn      = &LogTrampoline;
    desc.crash_fn    = &CrashTrampoline;
    desc.userdata    = this;

    m_core = caliper_core_create(&desc);
    if (!m_core) {
        AppendLog("[core] caliper_core_create failed — viewport disabled.");
        return;
    }

    int w = 0, h = 0;
    m_viewport->PhysicalSize(&w, &h);
    if (w <= 0 || h <= 0) { w = 640; h = 480; }
    CaliperCanvasDesc canvas{};
    canvas.struct_size   = sizeof canvas;
    canvas.mode          = CALIPER_CANVAS_WINDOW;
    canvas.width         = w;
    canvas.height        = h;
    canvas.content_scale = m_viewport->ContentScale();
    if (!caliper_core_attach_canvas(m_core, m_viewport->NativeView(), &canvas)) {
        AppendLog(wxString("[core] attach_canvas failed: ") +
                  caliper_core_last_error(m_core));
        ShutdownCaliper();
        return;
    }
    m_viewport->PushResizeAndScale();

    if (!caliper_core_load_applet(m_core, applet_id())) {
        AppendLog(wxString::Format("[core] load_applet '%s' failed: %s",
                                   applet_id(),
                                   caliper_core_last_error(m_core)));
    } else {
        AppendLog(wxString::Format("[core] applet '%s' loaded — zero-copy canvas "
                                   "live in the Compass viewport.",
                                   applet_id()));
    }

    m_metrics = static_cast<const CaliperMetricsV1_1*>(
        caliper_core_get_service(m_core, CALIPER_METRICS_V1_1));
    m_jobs = static_cast<const CaliperJobsV1*>(
        caliper_core_get_service(m_core, CALIPER_JOBS_V1));
    m_table->SetService(m_metrics);
    if (!m_metrics) AppendLog("[core] metrics.v1_1 service missing.");

    StartMetricsDemo();

    m_pump.Start(16);   // ~60 Hz frame pump
    m_poll.Start(500);  // metrics poll
    m_caliperUp = true;

    // Headless run-proof hook: auto-close after N seconds (mirrors embed_host's
    // CALIPER_EMBED_EXIT_AFTER). No effect when unset — normal interactive use.
    if (const char* s = std::getenv("COMPASS_EXIT_AFTER")) {
        const int ms = static_cast<int>(atof(s) * 1000);
        m_exit.Bind(wxEVT_TIMER, [this](wxTimerEvent&) { Close(true); });
        m_exit.StartOnce(ms > 0 ? ms : 4000);
    }
}

void WorkspaceFrame::StartMetricsDemo() {
    if (!m_metrics || !m_metrics->begin_run) {
        AppendLog("[demo] metrics writer unavailable — table will stay empty.");
        return;
    }
    m_demo.metrics = m_metrics;
    m_demo.run = m_metrics->begin_run("compass.demo", "live-metrics");
    if (!m_demo.run) {
        AppendLog("[demo] begin_run failed.");
        return;
    }
    if (m_jobs && m_jobs->submit) {
        m_demoJob = m_jobs->submit("compass.metrics-demo", &WorkspaceFrame::DemoJob,
                                   &m_demo);
        AppendLog(wxString::Format(
            "[demo] run %llu 'compass.demo/live-metrics' streaming scalars via "
            "caliper.jobs.v1 worker (labeled demo source).",
            (unsigned long long)m_demo.run));
    } else {
        AppendLog("[demo] jobs.v1 unavailable; writing a static burst inline.");
        for (int s = 0; s < 20; ++s)
            m_metrics->scalar(m_demo.run, "loss", s, 1.0 / (1.0 + s));
        m_metrics->end_run(m_demo.run);
    }
}

void WorkspaceFrame::DemoJob(void* user, const CaliperJobControl* ctl) {
    auto* st = static_cast<DemoState*>(user);
    const int N = 300;
    for (int step = 0; step < N; ++step) {
        if (st->stop.load(std::memory_order_relaxed)) break;
        if (ctl && ctl->cancelled && ctl->cancelled(ctl)) break;
        const double loss = 1.0 / (1.0 + step) + 0.02 * std::sin(step * 0.3);
        const double acc = 1.0 - loss * 0.5;
        st->metrics->scalar(st->run, "loss", step, loss);
        st->metrics->scalar(st->run, "accuracy", step, acc);
        if (ctl && ctl->progress)
            ctl->progress(ctl, static_cast<float>(step) / N, "streaming metrics");
        std::this_thread::sleep_for(std::chrono::milliseconds(150));
    }
    st->metrics->end_run(st->run);
}

void WorkspaceFrame::OnPumpTimer(wxTimerEvent&) {
    // Pump ONLY while the viewport is actually on screen (survey Q4 risk #4).
    if (m_core && m_viewport && m_viewport->IsShownOnScreen())
        caliper_core_frame(m_core);
}

void WorkspaceFrame::OnPollTimer(wxTimerEvent&) {
    if (m_table) m_table->Refresh();
}

void WorkspaceFrame::PostLog(int level, const std::string& line) {
    // Called from any thread (applet log.v1 lines are worker-callable). Tag the
    // source and marshal to the UI thread.
    std::string tagged = line;
    if (line.rfind("[applet]", 0) != 0 && line.rfind("[core]", 0) != 0 &&
        line.rfind("[demo]", 0) != 0)
        tagged = "[core] " + line;
    (void)level;
    CallAfter([this, tagged] { AppendLog(wxString::FromUTF8(tagged)); });
}

void WorkspaceFrame::AppendLog(const wxString& line) {
    if (m_log) m_log->AppendText(line + "\n");
    // Tee to stderr so a headless run-proof (no GUI capture) still has evidence.
    std::fprintf(stderr, "[compass] %s\n", (const char*)line.utf8_str());
}

void WorkspaceFrame::OnCloseFrame(wxCloseEvent& e) {
    ShutdownCaliper();
    e.Skip();  // let DocumentFrame::OnClose save layout + actually close
}

void WorkspaceFrame::ShutdownCaliper() {
    m_pump.Stop();
    m_poll.Stop();
    m_demo.stop.store(true, std::memory_order_relaxed);
    if (m_jobs && m_jobs->request_cancel && m_demoJob)
        m_jobs->request_cancel(m_demoJob);
    if (m_core) {
        caliper_core_shutdown(m_core);  // joins jobs, unloads applet, drops core
        m_core = nullptr;
    }
    m_metrics = nullptr;
    m_jobs = nullptr;
    m_caliperUp = false;
}

}  // namespace compass
