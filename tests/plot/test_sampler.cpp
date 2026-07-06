// Unit tests for plot::Sample — the Plot Workbench waveform sampler.
// Headless, wx-free, doctest (dev-only).

#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include <cmath>

#include "plot/expression.h"
#include "plot/sampler.h"

using plot::Expression;
using plot::Sample;

namespace {
Expression Compile(const char* s) { return Expression::Compile(s); }
}  // namespace

TEST_CASE("finite function yields a single polyline spanning the range") {
    auto polys = Sample(Compile("x"), 0.0, 10.0, 100);
    REQUIRE(polys.size() == 1);
    const auto& p = polys[0];
    CHECK(p.size() == 200);                     // 2 samples/pixel * 100 px
    CHECK(p.front().x == doctest::Approx(0.0));
    CHECK(p.back().x == doctest::Approx(10.0));
    // y == x on this function.
    CHECK(p.back().y == doctest::Approx(10.0));
}

TEST_CASE("leading undefined region is dropped, not drawn") {
    // sqrt(x) is NaN for x < 0 → those samples produce no points.
    auto polys = Sample(Compile("sqrt(x)"), -1.0, 1.0, 50);
    REQUIRE(polys.size() == 1);
    for (const auto& pt : polys[0]) CHECK(pt.x >= -1e-9);  // only the x>=0 part
}

TEST_CASE("undefined middle region splits into two polylines") {
    // sqrt(x*x - 1): finite for |x|>=1, NaN for |x|<1 → finite, gap, finite.
    auto polys = Sample(Compile("sqrt(x*x - 1)"), -2.0, 2.0, 100);
    REQUIRE(polys.size() == 2);
    CHECK(polys[0].front().x == doctest::Approx(-2.0));
    CHECK(polys[1].back().x == doctest::Approx(2.0));
    // The gap: first polyline ends at/below -1, second starts at/above +1.
    CHECK(polys[0].back().x <= -1.0 + 1e-6);
    CHECK(polys[1].front().x >= 1.0 - 1e-6);
}

TEST_CASE("entirely undefined function yields no polylines") {
    auto polys = Sample(Compile("sqrt(x)"), -2.0, -1.0, 50);
    CHECK(polys.empty());
}

TEST_CASE("degenerate inputs yield empty result, no crash") {
    CHECK(Sample(Compile("x"), 0.0, 10.0, 0).empty());    // width <= 0
    CHECK(Sample(Compile("x"), 5.0, 5.0, 100).empty());   // xmin >= xmax
    CHECK(Sample(Compile("x"), 10.0, 0.0, 100).empty());  // reversed range
    CHECK(Sample(Compile("("), 0.0, 10.0, 100).empty());  // errored expression
}
