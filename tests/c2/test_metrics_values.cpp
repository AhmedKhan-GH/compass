// C2 — value-correctness of the metrics SQL builders + Arrow decoder against a
// REAL store seeded via metrics.v1 writes. Creates a headless libcaliper core
// (no canvas), begins two runs, streams scalars, then reads them back through
// caliper.metrics.v1_1.query() exactly as the app does. SELECT-only is enforced
// by the service; this proves the numbers the tables/report show are correct.
#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include <cstdio>
#include <cstdlib>
#include <string>

#include <caliper/embed.h>
#include <caliper/services/metrics_v1_1.h>

#include "compass/arrow_decode.h"
#include "compass/metrics_sql.h"

using namespace compass;

namespace {
std::string TempDir() {
    std::string base = "/tmp/compass-c2-metrics-XXXXXX";
    char buf[256];
    std::snprintf(buf, sizeof buf, "%s", base.c_str());
    return ::mkdtemp(buf) ? std::string(buf) : std::string("/tmp/compass-c2-metrics");
}

// Query via the service and decode, or fail the test with the store's last_error.
DecodedTable Query(const CaliperMetricsV1_1* m, const std::string& sql) {
    ArrowArrayStream stream{};
    REQUIRE_MESSAGE(m->query(sql.c_str(), &stream),
                    "query refused: " << (m->last_error ? m->last_error() : "?"));
    DecodedTable t;
    std::string err;
    REQUIRE_MESSAGE(DecodeStream(&stream, &t, &err), err);
    return t;
}
}  // namespace

TEST_CASE("SQL builders return correct values against a seeded store") {
    const std::string dir = TempDir();

    CaliperCoreDesc desc{};
    desc.struct_size = sizeof desc;
    desc.renderer = CALIPER_RENDERER_DEFAULT;
    desc.data_dir = dir.c_str();
    CaliperCore* core = caliper_core_create(&desc);
    REQUIRE_MESSAGE(core, "core create failed (headless metrics core)");

    const auto* m = static_cast<const CaliperMetricsV1_1*>(
        caliper_core_get_service(core, CALIPER_METRICS_V1_1));
    REQUIRE(m);
    REQUIRE(m->begin_run);
    REQUIRE(m->query);

    // Seed: run A (loss over steps 0..2), run B (loss + accuracy).
    const uint64_t a = m->begin_run("exp", "baseline");
    const uint64_t b = m->begin_run("exp", "tweak");
    REQUIRE(a != 0);
    REQUIRE(b != 0);
    m->scalar(a, "loss", 0, 1.0);
    m->scalar(a, "loss", 1, 0.5);
    m->scalar(a, "loss", 2, 0.25);
    m->scalar(b, "loss", 0, 0.9);
    m->scalar(b, "loss", 1, 0.4);
    m->scalar(b, "accuracy", 5, 0.8);
    m->end_run(a);
    m->end_run(b);

    SUBCASE("run list reports last_step and tag_count") {
        DecodedTable t = Query(m, SqlRunList());
        const int idc = t.column("id"), lc = t.column("last_step"),
                  tc = t.column("tag_count");
        REQUIRE(idc >= 0);
        REQUIRE(t.nrows() == 2);
        // ordered by id: row0 = a, row1 = b
        CHECK(t.rows[0][idc].as_int() == (int64_t)a);
        CHECK(t.rows[0][lc].as_int() == 2);   // a's max step
        CHECK(t.rows[0][tc].as_int() == 1);   // a has 1 tag
        CHECK(t.rows[1][lc].as_int() == 5);   // b's max step (accuracy@5)
        CHECK(t.rows[1][tc].as_int() == 2);   // b has 2 tags
    }

    SUBCASE("per-tag stats: last (arg_max), min, max") {
        DecodedTable t = Query(m, SqlRunStats({(int64_t)a, (int64_t)b}));
        const int rc = t.column("run"), tg = t.column("tag"),
                  vl = t.column("vlast"), vmin = t.column("vmin"),
                  vmax = t.column("vmax");
        REQUIRE(t.nrows() == 3);  // a/loss, b/accuracy, b/loss
        // a/loss
        CHECK(t.rows[0][rc].as_int() == (int64_t)a);
        CHECK(t.rows[0][tg].text() == "loss");
        CHECK(t.rows[0][vl].as_double() == doctest::Approx(0.25));  // value at step 2
        CHECK(t.rows[0][vmin].as_double() == doctest::Approx(0.25));
        CHECK(t.rows[0][vmax].as_double() == doctest::Approx(1.0));
    }

    SUBCASE("series fetch returns ordered step/value per run") {
        DecodedTable t = Query(m, SqlSeries({(int64_t)a, (int64_t)b}, "loss"));
        const int rc = t.column("run"), sc = t.column("step"),
                  vc = t.column("value");
        REQUIRE(t.nrows() == 5);  // 3 (a) + 2 (b)
        CHECK(t.rows[0][rc].as_int() == (int64_t)a);
        CHECK(t.rows[0][sc].as_int() == 0);
        CHECK(t.rows[0][vc].as_double() == doctest::Approx(1.0));
        CHECK(t.rows[2][vc].as_double() == doctest::Approx(0.25));
    }

    SUBCASE("tags-for-runs is distinct + ordered") {
        DecodedTable t = Query(m, SqlTagsForRuns({(int64_t)b}));
        REQUIRE(t.nrows() == 2);
        CHECK(t.rows[0][0].text() == "accuracy");
        CHECK(t.rows[1][0].text() == "loss");
    }

    SUBCASE("non-SELECT is refused by the service (SELECT-only)") {
        ArrowArrayStream s{};
        CHECK_FALSE(m->query("DROP TABLE runs", &s));
    }

    caliper_core_shutdown(core);
}
