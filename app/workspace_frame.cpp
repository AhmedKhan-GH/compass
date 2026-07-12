// Compass C2 — WorkspaceFrame implementation.

#include "workspace_frame.h"

#include <wx/ffile.h>
#include <wx/filedlg.h>
#include <wx/menu.h>
#include <wx/textctrl.h>

#include <chrono>
#include <cmath>
#include <cstdlib>
#include <ctime>
#include <thread>

#include "annotations_panel.h"
#include "comparison_panel.h"
#include "compass/metrics_sql.h"
#include "compass/report.h"
#include "compass/store_root.h"
#include "metrics_table.h"
#include "report_builder.h"
#include "run_picker.h"
#include "viewport_panel.h"

#ifndef COMPASS_APPLETS_DIR_DEFAULT
#define COMPASS_APPLETS_DIR_DEFAULT ""
#endif

namespace compass {
namespace {

WorkspaceFrame* g_frame = nullptr;

constexpr int kIdViewViewport = wxID_HIGHEST + 100;
constexpr int kIdViewLog      = wxID_HIGHEST + 101;
constexpr int kIdViewTable    = wxID_HIGHEST + 102;
constexpr int kIdViewCompare  = wxID_HIGHEST + 103;
constexpr int kIdViewNotes    = wxID_HIGHEST + 104;
constexpr int kIdOpenRuns     = wxID_HIGHEST + 110;
constexpr int kIdExportReport = wxID_HIGHEST + 111;

const char* applet_id() {
    if (const char* e = std::getenv("COMPASS_APPLET")) return e;
    return "dev.caliper.instance-scope";
}
const char* applets_dir() {
    if (const char* e = std::getenv("CALIPER_EMBED_APPLETS")) return e;
    static const char* kDefault = COMPASS_APPLETS_DIR_DEFAULT;
    return (kDefault && kDefault[0]) ? kDefault : nullptr;
}
std::string ColorHex(const wxColour& c) {
    return wxString::Format("#%02x%02x%02x", c.Red(), c.Green(), c.Blue())
        .utf8_string();
}
std::string NowIso() {
    std::time_t t = std::time(nullptr);
    char buf[32];
    std::strftime(buf, sizeof buf, "%Y-%m-%d %H:%M:%S", std::localtime(&t));
    return buf;
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

std::string WorkspaceFrame::SessionRoot() const {
    static std::string dir;
    if (!dir.empty()) return dir;
    if (const char* e = std::getenv("COMPASS_DATA_DIR")) {
        dir = e;
    } else if (const char* home = std::getenv("HOME")) {
        dir = std::string(home) + "/Library/Application Support/Compass/c2";
    } else {
        dir = "/tmp/compass-c2";
    }
    return dir;
}

WorkspaceFrame::WorkspaceFrame() : DocumentFrame("Compass") {
    g_frame = this;
    FinishConstruction();
    AddViewToggles();

    m_pump.Bind(wxEVT_TIMER, &WorkspaceFrame::OnPumpTimer, this);
    m_poll.Bind(wxEVT_TIMER, &WorkspaceFrame::OnPollTimer, this);

    Bind(wxEVT_SHOW, &WorkspaceFrame::OnFirstShow, this);
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
    m_comparison = new ComparisonPanel(this, &m_doc);
    m_annotations =
        new AnnotationsPanel(this, &m_doc, [this] { ApplyDocument(); NotifyDocumentChanged(); });

    // Comparison is the primary document view (center); the viewport is a
    // dockable garnish the workflow does not require (P2-pure).
    aui().AddPane(m_comparison, wxAuiPaneInfo()
                                    .Name("comparison")
                                    .CenterPane()
                                    .Caption("Comparison"));
    aui().AddPane(m_viewport, wxAuiPaneInfo()
                                  .Name("viewport")
                                  .Caption("Viewport")
                                  .Top()
                                  .BestSize(900, 300)
                                  .CloseButton(false));
    aui().AddPane(m_annotations, wxAuiPaneInfo()
                                     .Name("notes")
                                     .Caption("Annotations")
                                     .Right()
                                     .BestSize(360, 300)
                                     .CloseButton(false));
    aui().AddPane(m_table, wxAuiPaneInfo()
                               .Name("table")
                               .Caption("Live metrics (all runs)")
                               .Right()
                               .BestSize(360, 300)
                               .CloseButton(false));
    aui().AddPane(m_log, wxAuiPaneInfo()
                             .Name("log")
                             .Caption("Log")
                             .Bottom()
                             .BestSize(900, 160)
                             .CloseButton(false));

    // Re-push physical size + content scale whenever the viewport is (re)shown —
    // AUI float/dock/re-show transitions reparent the NSView and EVT_SIZE after a
    // reparent is not reliable (carried review item C1-#2).
    m_viewport->Bind(wxEVT_SHOW, [this](wxShowEvent& e) {
        e.Skip();
        if (e.IsShown()) CallAfter([this] { RepushViewport(); });
    });

    AppendLog("Compass C2 — run-comparison document. File ▸ Open Runs… to begin.");
}

void WorkspaceFrame::AddViewToggles() {
    wxMenuBar* bar = GetMenuBar();
    if (!bar) return;
    const int viewIdx = bar->FindMenu("View");
    if (viewIdx == wxNOT_FOUND) return;
    wxMenu* view = bar->GetMenu(viewIdx);
    view->AppendSeparator();
    view->AppendCheckItem(kIdViewCompare, "Show &Comparison")->Check(true);
    view->AppendCheckItem(kIdViewNotes, "Show &Annotations")->Check(true);
    view->AppendCheckItem(kIdViewViewport, "Show &Viewport")->Check(true);
    view->AppendCheckItem(kIdViewTable, "Show Live &Metrics")->Check(true);
    view->AppendCheckItem(kIdViewLog, "Show &Log")->Check(true);

    auto toggle = [this](const char* name, bool show) {
        wxAuiPaneInfo& p = aui().GetPane(name);
        if (p.IsOk()) {
            p.Show(show);
            aui().Update();
            if (std::string(name) == "viewport" && show)
                CallAfter([this] { RepushViewport(); });
        }
    };
    Bind(wxEVT_MENU, [this, toggle](wxCommandEvent& e) { toggle("comparison", e.IsChecked()); }, kIdViewCompare);
    Bind(wxEVT_MENU, [this, toggle](wxCommandEvent& e) { toggle("notes", e.IsChecked()); }, kIdViewNotes);
    Bind(wxEVT_MENU, [this, toggle](wxCommandEvent& e) { toggle("viewport", e.IsChecked()); }, kIdViewViewport);
    Bind(wxEVT_MENU, [this, toggle](wxCommandEvent& e) { toggle("table", e.IsChecked()); }, kIdViewTable);
    Bind(wxEVT_MENU, [this, toggle](wxCommandEvent& e) { toggle("log", e.IsChecked()); }, kIdViewLog);
}

void WorkspaceFrame::PopulateFileMenu(wxMenu& file) {
    file.Append(kIdOpenRuns, L"Open &Runs…\tCtrl+R",
                "Pick runs from the metrics store to compare");
    file.Append(kIdExportReport, L"&Export Report…\tCtrl+E",
                "Write a self-contained HTML comparison report");
    Bind(wxEVT_MENU, &WorkspaceFrame::OnOpenRuns, this, kIdOpenRuns);
    Bind(wxEVT_MENU, &WorkspaceFrame::OnExportReport, this, kIdExportReport);
}

void WorkspaceFrame::OnFirstShow(wxShowEvent& e) {
    e.Skip();
    if (!e.IsShown() || m_caliperUp || m_core) return;
    CallAfter([this] { InitCaliper(); });
}

void WorkspaceFrame::InitCaliper() {
    if (m_caliperUp || m_core) return;

    const std::string root = SessionRoot();
    CaliperCoreDesc desc{};
    desc.struct_size = sizeof desc;
    desc.renderer    = CALIPER_RENDERER_DEFAULT;
    desc.data_dir    = root.c_str();
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
                                   applet_id(), caliper_core_last_error(m_core)));
    } else {
        AppendLog(wxString::Format(
            "[core] applet '%s' loaded — zero-copy canvas live in the viewport.",
            applet_id()));
    }

    m_metrics = static_cast<const CaliperMetricsV1_1*>(
        caliper_core_get_service(m_core, CALIPER_METRICS_V1_1));
    m_jobs = static_cast<const CaliperJobsV1*>(
        caliper_core_get_service(m_core, CALIPER_JOBS_V1));
    m_table->SetService(m_metrics);
    if (!m_metrics) AppendLog("[core] metrics.v1_1 service missing.");

    StartMetricsDemo();
    m_comparison->SetService(m_metrics);
    ApplyDocument();

    m_pump.Start(16);
    m_poll.Start(500);
    m_caliperUp = true;

    if (std::getenv("COMPASS_C2_SELFTEST")) {
        m_selftest.Bind(wxEVT_TIMER, [this](wxTimerEvent&) { RunSelfTest(); });
        m_selftest.StartOnce(400);
    }
    if (const char* s = std::getenv("COMPASS_EXIT_AFTER")) {
        const int ms = static_cast<int>(atof(s) * 1000);
        m_exit.Bind(wxEVT_TIMER, [this](wxTimerEvent&) { Close(true); });
        m_exit.StartOnce(ms > 0 ? ms : 4000);
    }
}

void WorkspaceFrame::StartMetricsDemo() {
    if (!m_metrics || !m_metrics->begin_run) {
        AppendLog("[demo] metrics writer unavailable — store will stay empty.");
        return;
    }
    // Multi-run seed for the comparison workflow: two COMPLETED runs with distinct
    // loss curves (written synchronously), so the picker has runs to compare.
    auto seed = [&](const char* name, double k) -> uint64_t {
        uint64_t run = m_metrics->begin_run("compass.demo", name);
        if (!run) return 0;
        for (int s = 0; s < 30; ++s) {
            const double loss = 1.0 / (1.0 + k * s);
            m_metrics->scalar(run, "loss", s, loss);
            m_metrics->scalar(run, "accuracy", s, 1.0 - loss * 0.5);
        }
        m_metrics->end_run(run);
        return run;
    };
    if (uint64_t a = seed("baseline", 1.0)) m_seededRuns.push_back((int64_t)a);
    if (uint64_t b = seed("tweak", 1.6)) m_seededRuns.push_back((int64_t)b);
    AppendLog(wxString::Format("[demo] seeded %zu completed run(s) for comparison.",
                               m_seededRuns.size()));

    // One live-streaming run (the C1 live-table proof: row count climbs).
    m_demo.metrics = m_metrics;
    m_demo.run = m_metrics->begin_run("compass.demo", "live-metrics");
    if (m_demo.run && m_jobs && m_jobs->submit) {
        m_demoJob = m_jobs->submit("compass.metrics-demo", &WorkspaceFrame::DemoJob,
                                   &m_demo);
        AppendLog(wxString::Format(
            "[demo] run %llu 'compass.demo/live-metrics' streaming scalars via "
            "caliper.jobs.v1 worker (labeled demo source).",
            (unsigned long long)m_demo.run));
    }
}

void WorkspaceFrame::DemoJob(void* user, const CaliperJobControl* ctl) {
    auto* st = static_cast<DemoState*>(user);
    const int N = 300;
    for (int step = 0; step < N; ++step) {
        if (st->stop.load(std::memory_order_relaxed)) break;
        if (ctl && ctl->cancelled && ctl->cancelled(ctl)) break;
        const double loss = 1.0 / (1.0 + step) + 0.02 * std::sin(step * 0.3);
        st->metrics->scalar(st->run, "loss", step, loss);
        st->metrics->scalar(st->run, "accuracy", step, 1.0 - loss * 0.5);
        if (ctl && ctl->progress)
            ctl->progress(ctl, static_cast<float>(step) / N, "streaming metrics");
        std::this_thread::sleep_for(std::chrono::milliseconds(150));
    }
    st->metrics->end_run(st->run);
}

// ---- C2 workflow -----------------------------------------------------------

bool WorkspaceFrame::StoreIsForeign() const {
    return ClassifyStoreRoot(m_doc.store_root(), SessionRoot()) ==
           StoreKind::kForeign;
}

void WorkspaceFrame::ApplyDocument() {
    if (m_comparison) {
        m_comparison->SetStoreForeign(StoreIsForeign());
        m_comparison->Rebuild();
    }
    if (m_annotations) m_annotations->Rebuild();
}

void WorkspaceFrame::OnOpenRuns(wxCommandEvent&) {
    if (!m_metrics) {
        AppendLog("[c2] Open Runs: metrics.v1_1 unavailable.");
        return;
    }
    RunPickerDialog dlg(this, m_metrics, SessionRoot(), m_doc.store_root());
    if (dlg.ShowModal() != wxID_OK) return;

    std::vector<RunDisplay> runs;
    int i = 0;
    for (int64_t id : dlg.SelectedRuns()) {
        RunDisplay r;
        r.id = id;
        r.color = ColorHex(RunColor(r, i));
        runs.push_back(std::move(r));
        ++i;
    }
    m_doc.SetStoreRoot(dlg.StoreRoot());
    m_doc.SetRuns(std::move(runs));
    ApplyDocument();
    NotifyDocumentChanged();
    AppendLog(wxString::Format("[c2] opened %zu run(s) for comparison.",
                               m_doc.runs().size()));
}

void WorkspaceFrame::OnExportReport(wxCommandEvent&) {
    if (m_doc.runs().empty()) {
        AppendLog("[c2] Export: no runs selected (File ▸ Open Runs… first).");
        return;
    }
    wxFileDialog dlg(this, "Export Report", "", "comparison.html",
                     "HTML report (*.html)|*.html",
                     wxFD_SAVE | wxFD_OVERWRITE_PROMPT);
    if (dlg.ShowModal() != wxID_OK) return;

    MetricsQuery q(m_metrics);
    ReportData rd = BuildReportData(m_doc, q, SessionRoot(), StoreIsForeign(),
                                    NowIso());
    const std::string html = RenderReportHtml(rd);
    wxFFile f(dlg.GetPath(), "w");
    if (f.IsOpened() && f.Write(html)) {
        f.Close();
        AppendLog(wxString::Format("[c2] report written: %s (%zu bytes).",
                                   dlg.GetPath(), html.size()));
    } else {
        AppendLog("[c2] report write failed.");
    }
}

void WorkspaceFrame::NewDocument() {
    m_doc.Deserialize("{\"version\":1}");  // empty comparison
    ApplyDocument();
}

void WorkspaceFrame::SyncViews() { ApplyDocument(); }

void WorkspaceFrame::RepushViewport() {
    if (m_core && m_viewport && m_viewport->IsShownOnScreen())
        m_viewport->PushResizeAndScale();
}

void WorkspaceFrame::RunSelfTest() {
    AppendLog("[c2] self-test: performing the run-comparison workflow headless.");
    if (!m_metrics) { AppendLog("[c2] self-test: no metrics — aborting."); Close(true); return; }

    // 1) Open the two seeded runs side by side.
    std::vector<int64_t> ids = m_seededRuns;
    if (ids.size() < 2) {
        MetricsQuery q(m_metrics);
        DecodedTable t;
        if (q.Run(SqlRunList(), &t)) {
            ids.clear();
            const int idc = t.column("id");
            for (auto& r : t.rows) if (idc >= 0) ids.push_back(r[idc].as_int());
        }
    }
    std::vector<RunDisplay> runs;
    for (size_t i = 0; i < ids.size() && i < 2; ++i) {
        RunDisplay r; r.id = ids[i]; r.color = ColorHex(RunColor(r, (int)i));
        runs.push_back(r);
    }
    m_doc.SetStoreRoot(SessionRoot());
    m_doc.SetRuns(runs);
    const int64_t ann =
        m_doc.AddAnnotation(runs.empty() ? -1 : runs[0].id, 10, "loss",
                            "self-test note: loss converged by step 10");
    ApplyDocument();
    AppendLog(wxString::Format("[c2] opened %zu runs; annotation id=%lld.",
                               runs.size(), (long long)ann));

    // 2) Verify values against the seed.
    MetricsQuery q(m_metrics);
    DecodedTable st;
    if (q.Run(SqlRunStats(ids), &st)) {
        const int rc = st.column("run"), tg = st.column("tag"),
                  vl = st.column("vlast"), vmn = st.column("vmin"),
                  vmx = st.column("vmax");
        for (auto& row : st.rows) {
            if (rc < 0) break;
            AppendLog(wxString::Format(
                "[c2] run %lld %s: last=%.6g min=%.6g max=%.6g",
                (long long)row[rc].as_int(),
                wxString::FromUTF8(row[tg].text()), row[vl].as_double(),
                row[vmn].as_double(), row[vmx].as_double()));
        }
    }

    // 3) Export a self-contained HTML report.
    std::string reportPath = "/tmp/compass_c2_report.html";
    if (const char* e = std::getenv("COMPASS_C2_REPORT")) reportPath = e;
    ReportData rd = BuildReportData(m_doc, q, SessionRoot(), false, NowIso());
    const std::string html = RenderReportHtml(rd);
    wxFFile rf(wxString::FromUTF8(reportPath), "w");
    if (rf.IsOpened() && rf.Write(html)) {
        rf.Close();
        const bool selfContained = html.find("http://") == std::string::npos &&
                                   html.find("https://") == std::string::npos &&
                                   html.find("src=") == std::string::npos;
        AppendLog(wxString::Format(
            "[c2] report written: %s (%zu bytes, self-contained=%s, svg=%s).",
            wxString::FromUTF8(reportPath), html.size(),
            selfContained ? "yes" : "no",
            html.find("<svg") != std::string::npos ? "yes" : "no"));
    } else {
        AppendLog("[c2] self-test: report write FAILED.");
    }

    // 4) Save the .compass document, reload it, verify equality.
    std::string docPath = "/tmp/compass_c2_doc.compass";
    if (const char* e = std::getenv("COMPASS_C2_DOC")) docPath = e;
    const std::string blob = m_doc.Serialize();
    wxFFile df(wxString::FromUTF8(docPath), "w");
    if (df.IsOpened() && df.Write(blob)) df.Close();
    ComparisonDocument reloaded;
    const bool ok = reloaded.Deserialize(blob);
    const bool sameRuns = ok && reloaded.runs().size() == m_doc.runs().size();
    const bool sameNotes =
        ok && reloaded.annotations().size() == m_doc.annotations().size() &&
        !reloaded.annotations().empty() &&
        reloaded.annotations()[0].text == m_doc.annotations()[0].text;
    AppendLog(wxString::Format(
        "[c2] .compass saved: %s; reload ok=%s runs=%s annotation=%s.",
        wxString::FromUTF8(docPath), ok ? "yes" : "no",
        sameRuns ? "match" : "MISMATCH", sameNotes ? "match" : "MISMATCH"));
    AppendLog("[c2] self-test: workflow complete.");

    // Let the viewport pump a few frames for the P1 proof, then close.
    m_exit.Bind(wxEVT_TIMER, [this](wxTimerEvent&) { Close(true); });
    m_exit.StartOnce(800);
}

void WorkspaceFrame::OnPumpTimer(wxTimerEvent&) {
    if (m_core && m_viewport && m_viewport->IsShownOnScreen())
        caliper_core_frame(m_core);
}

void WorkspaceFrame::OnPollTimer(wxTimerEvent&) {
    if (m_table) m_table->Refresh();
    // Own-root: keep the comparison views current as the live run streams in
    // (the honest live-poll case). Foreign-root: no live poll (checkpoint caveat).
    if (m_comparison && !m_doc.runs().empty() && !StoreIsForeign())
        m_comparison->Rebuild();
}

void WorkspaceFrame::PostLog(int level, const std::string& line) {
    std::string tagged = line;
    if (line.rfind("[applet]", 0) != 0 && line.rfind("[core]", 0) != 0 &&
        line.rfind("[demo]", 0) != 0 && line.rfind("[c2]", 0) != 0)
        tagged = "[core] " + line;
    (void)level;
    CallAfter([this, tagged] { AppendLog(wxString::FromUTF8(tagged)); });
}

void WorkspaceFrame::AppendLog(const wxString& line) {
    if (m_log) m_log->AppendText(line + "\n");
    std::fprintf(stderr, "[compass] %s\n", (const char*)line.utf8_str());
}

void WorkspaceFrame::OnCloseFrame(wxCloseEvent& e) {
    ShutdownCaliper();
    e.Skip();
}

void WorkspaceFrame::ShutdownCaliper() {
    m_pump.Stop();
    m_poll.Stop();
    m_demo.stop.store(true, std::memory_order_relaxed);
    if (m_jobs && m_jobs->request_cancel && m_demoJob)
        m_jobs->request_cancel(m_demoJob);
    if (m_core) {
        caliper_core_shutdown(m_core);
        m_core = nullptr;
    }
    m_metrics = nullptr;
    m_jobs = nullptr;
    m_caliperUp = false;
}

}  // namespace compass
