// C2 — metrics SQL builders: shape, IN-clause, and literal escaping.
// (Value-correctness against a live seeded store is test_metrics_values.cpp.)
#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include "compass/metrics_sql.h"

using namespace compass;

static bool Contains(const std::string& h, const std::string& n) {
    return h.find(n) != std::string::npos;
}

TEST_CASE("InClause renders ids and matches nothing when empty") {
    CHECK(InClause({1, 2, 5}) == "IN (1, 2, 5)");
    CHECK(InClause({}) == "IN (NULL)");
}

TEST_CASE("string literals are single-quote escaped") {
    CHECK(EscapeSqlLiteral("a'b") == "a''b");
    CHECK(EscapeSqlLiteral("plain") == "plain");
    // A malicious tag cannot break out of the literal.
    const std::string sql = SqlSeries({1}, "x'; DROP TABLE runs;--");
    CHECK(Contains(sql, "'x''; DROP TABLE runs;--'"));
}

TEST_CASE("builders are SELECT-only and run-filtered") {
    for (const std::string& sql :
         {SqlRunList(), SqlRunStats({1, 2}), SqlTagsForRuns({3}),
          SqlSeries({4}, "loss")}) {
        CHECK(sql.rfind("SELECT", 0) == 0);          // starts with SELECT
        CHECK_FALSE(Contains(sql, ";"));             // single statement
    }
    CHECK(Contains(SqlRunStats({1, 2}), "run IN (1, 2)"));
    CHECK(Contains(SqlSeries({4}, "loss"), "run IN (4)"));
    // arg_max gives the latest value; MIN/MAX the extremes.
    CHECK(Contains(SqlRunStats({1}), "arg_max(value, step)"));
    CHECK(Contains(SqlRunStats({1}), "MIN(value)"));
    CHECK(Contains(SqlRunStats({1}), "MAX(value)"));
}
