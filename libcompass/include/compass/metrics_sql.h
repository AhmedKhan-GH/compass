// Compass C2 — metrics.v1_1 SQL builders (spec §2/§3).
//
// The run picker and the run-filtered comparison views (scalar stats table,
// scalar series) are single read-only SELECTs against the metrics store, run
// through caliper.metrics.v1_1.query(). These builders are pure string factories
// (wx-free, no DuckDB linkage) so they are unit-tested for value-correctness
// against a temp store seeded via metrics.v1 writes, and so every query stays
// SELECT-only (the service refuses anything else).
//
// The run set is filtered WHERE run IN (...) — this SUPERSEDES C1's flat all-runs
// dump (carried review item C1-#3) and bounds every result to the document's runs.

#ifndef COMPASS_METRICS_SQL_H
#define COMPASS_METRICS_SQL_H

#include <cstdint>
#include <string>
#include <vector>

namespace compass {

// All runs with derived index columns for the picker: id, experiment, name,
// done, last_step (MAX scalar step, -1 if none), tag_count (DISTINCT scalar tags).
// (No wall-clock "started" column exists in the metrics schema — runs.id is a
// monotonic creation-order counter; the picker shows it as the run # / order.)
std::string SqlRunList();

// Per (run, tag) aggregate over the given runs: n, min, max, last (value at the
// greatest step, via arg_max), last_step. Empty run set -> a query returning no
// rows. Ordered by run, tag for stable table/report output.
std::string SqlRunStats(const std::vector<int64_t>& runs);

// Distinct scalar tags present across the given runs (ordered), for tag pickers.
std::string SqlTagsForRuns(const std::vector<int64_t>& runs);

// step-vs-value series for one tag across the given runs, ordered run, step —
// one polyline per run for the plot. tag is escaped (single quotes doubled).
std::string SqlSeries(const std::vector<int64_t>& runs, const std::string& tag);

// --- exposed for testing / reuse -----------------------------------------
// Render "IN (a, b, c)"; an empty set yields "IN (NULL)" (matches nothing).
std::string InClause(const std::vector<int64_t>& runs);
// Double any single quote so a tag becomes a safe SQL string literal body.
std::string EscapeSqlLiteral(const std::string& s);

}  // namespace compass

#endif  // COMPASS_METRICS_SQL_H
