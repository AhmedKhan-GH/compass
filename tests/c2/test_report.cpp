// C2 — HTML report export: golden-file the skeleton for a tiny fixed dataset
// (stable ordering; the only timestamp is a fixed literal, so nothing is masked)
// plus self-containment invariants. Regenerate the golden with COMPASS_UPDATE_GOLDEN=1.
#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include <cstdlib>
#include <fstream>
#include <sstream>
#include <string>

#include "compass/report.h"

using namespace compass;

namespace {
ReportData Fixture() {
    ReportData d;
    d.title = "Compass Run Comparison";
    d.generated_at = "1970-01-01T00:00:00Z";  // fixed -> deterministic golden
    d.store_root_label = "/tmp/seed-store";
    d.store_foreign = false;

    d.runs = {{1, "baseline", "#4c6ef5", "exp", "baseline", 2, 1},
              {2, "tweak", "#e8590c", "exp", "tweak", 2, 1}};

    ReportStatRow row;
    row.tag = "loss";
    row.cells = {{true, 0.25, 0.25, 1.0, 2}, {true, 0.20, 0.20, 0.9, 2}};
    d.stats = {row};

    ReportSeriesGroup g;
    g.tag = "loss";
    g.lines = {{0, {{0, 1.0}, {1, 0.5}, {2, 0.25}}},
               {1, {{0, 0.9}, {1, 0.4}, {2, 0.20}}}};
    d.series = {g};

    d.annotations = {{"baseline", 2, "loss", "converged"}};
    return d;
}

std::string ReadFile(const std::string& p) {
    std::ifstream f(p, std::ios::binary);
    std::ostringstream ss;
    ss << f.rdbuf();
    return ss.str();
}
}  // namespace

TEST_CASE("report is self-contained and carries the data") {
    const std::string html = RenderReportHtml(Fixture());
    // Self-contained: no external resource references.
    CHECK(html.find("http://") == std::string::npos);
    CHECK(html.find("https://") == std::string::npos);
    CHECK(html.find("src=") == std::string::npos);
    CHECK(html.rfind("<!DOCTYPE html>", 0) == 0);
    // Identity + data present.
    CHECK(html.find("/tmp/seed-store") != std::string::npos);
    CHECK(html.find("baseline") != std::string::npos);
    CHECK(html.find("tweak") != std::string::npos);
    CHECK(html.find("loss") != std::string::npos);
    CHECK(html.find("converged") != std::string::npos);
    // An inline SVG plot with a polyline per run color.
    CHECK(html.find("<svg") != std::string::npos);
    CHECK(html.find("<polyline") != std::string::npos);
    CHECK(html.find("#4c6ef5") != std::string::npos);
    CHECK(html.find("#e8590c") != std::string::npos);
}

TEST_CASE("foreign store surfaces the checkpoint caveat; own store does not") {
    ReportData d = Fixture();
    CHECK(RenderReportHtml(d).find("checkpoint") == std::string::npos);
    d.store_foreign = true;
    CHECK(RenderReportHtml(d).find("checkpoint") != std::string::npos);
}

TEST_CASE("golden HTML skeleton is byte-stable") {
    const std::string html = RenderReportHtml(Fixture());
    const std::string path = C2_GOLDEN_PATH;
    if (std::getenv("COMPASS_UPDATE_GOLDEN")) {
        std::ofstream(path, std::ios::binary) << html;
        MESSAGE("golden regenerated: " << path);
        return;
    }
    const std::string golden = ReadFile(path);
    REQUIRE_MESSAGE(!golden.empty(),
                    "missing golden; run with COMPASS_UPDATE_GOLDEN=1 once");
    CHECK(html == golden);
}
