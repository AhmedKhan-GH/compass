// Unit tests for plot::ExportCsv — Plot Workbench CSV export.
// Headless, wx-free, doctest (dev-only).

#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include <string>
#include <vector>

#include "plot/csv_exporter.h"

using plot::ExportCsv;

namespace {
// Count newline-terminated lines.
int LineCount(const std::string& s) {
    int n = 0;
    for (char c : s) if (c == '\n') n++;
    return n;
}
}  // namespace

TEST_CASE("header names the x column and each expression") {
    std::string csv = ExportCsv({"x", "x*x"}, 0.0, 2.0, 3);
    CHECK(csv.rfind("x,x,x*x\n", 0) == 0);  // header is the first line
}

TEST_CASE("one header line plus one row per sample") {
    std::string csv = ExportCsv({"x"}, 0.0, 10.0, 5);
    CHECK(LineCount(csv) == 6);  // header + 5 rows
}

TEST_CASE("values are correct and endpoints inclusive") {
    // f(x)=x over [0,4] with 5 rows → x = 0,1,2,3,4.
    std::string csv = ExportCsv({"x"}, 0.0, 4.0, 5);
    CHECK(csv.find("\n0,0\n") != std::string::npos);
    CHECK(csv.find("\n2,2\n") != std::string::npos);
    CHECK(csv.find("4,4\n") != std::string::npos);  // last row, inclusive endpoint
}

TEST_CASE("non-finite results become empty cells") {
    // sqrt(x) over [-2,2] with 5 rows → x=-2,-1 give NaN (empty), x=0,1,2 finite.
    std::string csv = ExportCsv({"sqrt(x)"}, -2.0, 2.0, 5);
    CHECK(csv.find("-2,\n") != std::string::npos);   // empty cell at x=-2
    CHECK(csv.find("\n0,0\n") != std::string::npos);  // sqrt(0)=0
}

TEST_CASE("degenerate inputs yield empty output") {
    CHECK(ExportCsv({}, 0.0, 10.0, 5).empty());            // no expressions
    CHECK(ExportCsv({"x"}, 0.0, 10.0, 0).empty());         // rows < 1
    CHECK(ExportCsv({"x"}, 5.0, 5.0, 5).empty());          // xmin >= xmax
}
