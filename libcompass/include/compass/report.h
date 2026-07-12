// Compass C2 — self-contained HTML report export (spec §5).
//
// One honest v0 format: a single self-contained .html file — no external assets,
// no PDF machinery. It carries store/run identity, the scalar stats table, one
// inline-SVG step-vs-value plot per tag (a series per run), the annotations, and
// a caller-supplied timestamp. RenderReportHtml is a PURE function of already-
// fetched data (wx-free, no store access) so it is golden-file tested with stable
// ordering and a fixed timestamp; the app fills ReportData from metrics.v1_1.

#ifndef COMPASS_REPORT_H
#define COMPASS_REPORT_H

#include <cstdint>
#include <string>
#include <vector>

namespace compass {

struct ReportRun {
    int64_t id = 0;
    std::string label;       // display label
    std::string color;       // "#rrggbb"
    std::string experiment;
    std::string name;
    int64_t last_step = -1;
    int64_t tag_count = 0;
};

// One run's stats for a tag. `present` false -> the tag has no data in that run.
struct ReportStatCell {
    bool present = false;
    double last = 0, vmin = 0, vmax = 0;
    int64_t last_step = -1;
};
struct ReportStatRow {
    std::string tag;
    std::vector<ReportStatCell> cells;  // aligned with ReportData.runs order
};

struct ReportSeriesLine {
    int run_index = 0;  // index into ReportData.runs
    std::vector<std::pair<double, double>> points;  // (step, value)
};
struct ReportSeriesGroup {
    std::string tag;
    std::vector<ReportSeriesLine> lines;
};

struct ReportAnnotation {
    std::string run_label;  // "" -> document-level
    int64_t step = -1;      // -1 -> whole-run
    std::string tag;        // "" -> untied
    std::string text;
};

struct ReportData {
    std::string title = "Compass Run Comparison";
    std::string generated_at;      // caller-supplied (fixed in golden tests)
    std::string store_root_label;
    bool store_foreign = false;    // surfaces the checkpoint-visibility caveat
    std::vector<ReportRun> runs;
    std::vector<ReportStatRow> stats;
    std::vector<ReportSeriesGroup> series;
    std::vector<ReportAnnotation> annotations;
};

// Render a complete, self-contained HTML document.
std::string RenderReportHtml(const ReportData& data);

}  // namespace compass

#endif  // COMPASS_REPORT_H
