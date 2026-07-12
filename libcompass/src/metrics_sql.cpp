// Compass C2 — metrics.v1_1 SQL builders.

#include "compass/metrics_sql.h"

namespace compass {

std::string InClause(const std::vector<int64_t>& runs) {
    if (runs.empty()) return "IN (NULL)";  // matches no rows
    std::string s = "IN (";
    for (size_t i = 0; i < runs.size(); ++i) {
        if (i) s += ", ";
        s += std::to_string(runs[i]);
    }
    s += ")";
    return s;
}

std::string EscapeSqlLiteral(const std::string& s) {
    std::string out;
    out.reserve(s.size());
    for (char c : s) {
        if (c == '\'') out += '\'';  // double it
        out += c;
    }
    return out;
}

std::string SqlRunList() {
    return
        "SELECT r.id AS id, r.experiment AS experiment, r.name AS name, "
        "r.done AS done, "
        "COALESCE(MAX(s.step), -1) AS last_step, "
        "COUNT(DISTINCT s.tag) AS tag_count "
        "FROM runs r LEFT JOIN scalars s ON s.run = r.id "
        "GROUP BY r.id, r.experiment, r.name, r.done "
        "ORDER BY r.id";
}

std::string SqlRunStats(const std::vector<int64_t>& runs) {
    return
        "SELECT run, tag, COUNT(*) AS n, MIN(value) AS vmin, MAX(value) AS vmax, "
        "arg_max(value, step) AS vlast, MAX(step) AS last_step "
        "FROM scalars WHERE run " + InClause(runs) +
        " GROUP BY run, tag ORDER BY run, tag";
}

std::string SqlTagsForRuns(const std::vector<int64_t>& runs) {
    return "SELECT DISTINCT tag FROM scalars WHERE run " + InClause(runs) +
           " ORDER BY tag";
}

std::string SqlSeries(const std::vector<int64_t>& runs, const std::string& tag) {
    return "SELECT run, step, value FROM scalars WHERE run " + InClause(runs) +
           " AND tag = '" + EscapeSqlLiteral(tag) + "' ORDER BY run, step";
}

}  // namespace compass
