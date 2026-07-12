// Compass C2 — MetricsQuery + report assembly.

#include "report_builder.h"

#include <map>
#include <utility>

#include "compass/metrics_sql.h"

namespace compass {
namespace {

// A run's derived metadata from SqlRunList().
struct RunMeta {
    std::string experiment, name;
    bool done = false;
    int64_t last_step = -1, tag_count = 0;
};

std::string LabelFor(const RunDisplay& r, const std::map<int64_t, RunMeta>& meta) {
    if (!r.label.empty()) return r.label;
    auto it = meta.find(r.id);
    if (it != meta.end()) {
        std::string s = it->second.experiment;
        if (!it->second.name.empty()) s += "/" + it->second.name;
        if (!s.empty()) return s;
    }
    return "run " + std::to_string(r.id);
}

}  // namespace

bool MetricsQuery::Run(const std::string& sql, DecodedTable* out) {
    if (!ok()) {
        err_ = "metrics.v1_1 unavailable";
        return false;
    }
    ArrowArrayStream stream{};
    if (!svc_->query(sql.c_str(), &stream)) {
        const char* e = svc_->last_error ? svc_->last_error() : nullptr;
        err_ = e ? e : "query failed";
        return false;
    }
    return DecodeStream(&stream, out, &err_);
}

ReportData BuildReportData(const ComparisonDocument& doc, MetricsQuery& q,
                           const std::string& store_label, bool store_foreign,
                           const std::string& generated_at) {
    ReportData rd;
    rd.generated_at = generated_at;
    rd.store_root_label = store_label;
    rd.store_foreign = store_foreign;

    // 1) run metadata (from the full run list; cheap, filtered in memory).
    std::map<int64_t, RunMeta> meta;
    DecodedTable rl;
    if (q.Run(SqlRunList(), &rl)) {
        const int idc = rl.column("id"), ec = rl.column("experiment"),
                  nc = rl.column("name"), lc = rl.column("last_step"),
                  tc = rl.column("tag_count");
        for (auto& row : rl.rows) {
            if (idc < 0) break;
            RunMeta m;
            if (ec >= 0) m.experiment = row[ec].text();
            if (nc >= 0) m.name = row[nc].text();
            if (lc >= 0) m.last_step = row[lc].as_int();
            if (tc >= 0) m.tag_count = row[tc].as_int();
            meta[row[idc].as_int()] = std::move(m);
        }
    }

    // 2) runs (document order) + id list + index map.
    std::vector<int64_t> ids;
    std::map<int64_t, int> index;  // run id -> position in rd.runs
    for (const auto& r : doc.runs()) {
        ReportRun rr;
        rr.id = r.id;
        rr.color = r.color;
        rr.label = LabelFor(r, meta);
        if (auto it = meta.find(r.id); it != meta.end()) {
            rr.experiment = it->second.experiment;
            rr.name = it->second.name;
            rr.last_step = it->second.last_step;
            rr.tag_count = it->second.tag_count;
        }
        index[r.id] = static_cast<int>(rd.runs.size());
        rd.runs.push_back(std::move(rr));
        ids.push_back(r.id);
    }
    if (ids.empty()) return rd;

    // 3) distinct tags across the runs.
    std::vector<std::string> tags;
    DecodedTable tt;
    if (q.Run(SqlTagsForRuns(ids), &tt))
        for (auto& row : tt.rows)
            if (!row.empty()) tags.push_back(row[0].text());

    // 4) per-tag stats (one row per tag; a cell per run).
    DecodedTable st;
    std::map<std::pair<int64_t, std::string>, ReportStatCell> stat;
    if (q.Run(SqlRunStats(ids), &st)) {
        const int rc = st.column("run"), tg = st.column("tag"),
                  vl = st.column("vlast"), vmn = st.column("vmin"),
                  vmx = st.column("vmax"), ls = st.column("last_step");
        for (auto& row : st.rows) {
            if (rc < 0 || tg < 0) break;
            ReportStatCell c;
            c.present = true;
            if (vl >= 0) c.last = row[vl].as_double();
            if (vmn >= 0) c.vmin = row[vmn].as_double();
            if (vmx >= 0) c.vmax = row[vmx].as_double();
            if (ls >= 0) c.last_step = row[ls].as_int();
            stat[{row[rc].as_int(), row[tg].text()}] = c;
        }
    }
    for (const auto& tag : tags) {
        ReportStatRow row;
        row.tag = tag;
        row.cells.resize(rd.runs.size());
        for (int64_t id : ids) {
            auto it = stat.find({id, tag});
            if (it != stat.end()) row.cells[index[id]] = it->second;
        }
        rd.stats.push_back(std::move(row));
    }

    // 5) per-tag series (a line per run).
    for (const auto& tag : tags) {
        ReportSeriesGroup g;
        g.tag = tag;
        DecodedTable sd;
        if (q.Run(SqlSeries(ids, tag), &sd)) {
            const int rc = sd.column("run"), sc = sd.column("step"),
                      vc = sd.column("value");
            std::map<int64_t, ReportSeriesLine> lines;
            for (auto& row : sd.rows) {
                if (rc < 0) break;
                const int64_t id = row[rc].as_int();
                auto& ln = lines[id];
                ln.run_index = index.count(id) ? index[id] : 0;
                if (sc >= 0 && vc >= 0)
                    ln.points.emplace_back(row[sc].as_double(),
                                           row[vc].as_double());
            }
            for (int64_t id : ids)
                if (auto it = lines.find(id); it != lines.end())
                    g.lines.push_back(std::move(it->second));
        }
        rd.series.push_back(std::move(g));
    }

    // 6) annotations (map run id -> label).
    for (const auto& a : doc.annotations()) {
        ReportAnnotation ra;
        ra.step = a.step;
        ra.tag = a.tag;
        ra.text = a.text;
        if (a.run >= 0 && index.count(a.run))
            ra.run_label = rd.runs[index[a.run]].label;
        rd.annotations.push_back(std::move(ra));
    }
    return rd;
}

}  // namespace compass
