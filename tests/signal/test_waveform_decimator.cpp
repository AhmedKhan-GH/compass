// Unit tests for sig::Decimate — Signal Workbench min/max decimation.
#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include <vector>

#include "signal/waveform_decimator.h"

using sig::Decimate;

TEST_CASE("one column over the whole range gives the global min/max") {
    std::vector<double> s = {3, 1, 4, 1, 5, 9, 2, 6};
    auto d = Decimate(s, 0, s.size(), 1);
    REQUIRE(d.size() == 1);
    CHECK(d[0].min == doctest::Approx(1));
    CHECK(d[0].max == doctest::Approx(9));
}

TEST_CASE("columns partition the range and capture per-slice extremes") {
    std::vector<double> s = {0, 10, 2, 8, 4, 6};  // 2 columns → [0,10,2] and [8,4,6]
    auto d = Decimate(s, 0, s.size(), 2);
    REQUIRE(d.size() == 2);
    CHECK(d[0].min == doctest::Approx(0));
    CHECK(d[0].max == doctest::Approx(10));
    CHECK(d[1].min == doctest::Approx(4));
    CHECK(d[1].max == doctest::Approx(8));
}

TEST_CASE("sub-range honours begin/end bounds") {
    std::vector<double> s = {100, 1, 2, 3, 100};
    auto d = Decimate(s, 1, 4, 1);  // only samples {1,2,3}
    REQUIRE(d.size() == 1);
    CHECK(d[0].min == doctest::Approx(1));
    CHECK(d[0].max == doctest::Approx(3));
}

TEST_CASE("more columns than samples never produces NaN or crashes") {
    std::vector<double> s = {1, 2, 3};
    auto d = Decimate(s, 0, s.size(), 10);
    REQUIRE(d.size() == 10);
    for (const auto& mm : d) {
        CHECK(mm.min >= 1.0);
        CHECK(mm.max <= 3.0);
        CHECK(mm.min <= mm.max);
    }
}

TEST_CASE("degenerate inputs yield empty output") {
    std::vector<double> s = {1, 2, 3};
    CHECK(Decimate(s, 0, s.size(), 0).empty());   // columns <= 0
    CHECK(Decimate(s, 2, 2, 4).empty());          // empty range
    CHECK(Decimate(s, 3, 5, 4).empty());          // begin past end of data
    CHECK(Decimate({}, 0, 0, 4).empty());         // no samples
}
