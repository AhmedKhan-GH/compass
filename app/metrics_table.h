// Compass C1 — MetricsTable.
//
// The P2 load-bearing pane: a native table (wxDataViewListCtrl -> NSTableView on
// macOS) over the caliper.metrics.v1_1 READ surface. It holds a borrowed
// CaliperMetricsV1_1* (obtained by WorkspaceFrame via caliper_core_get_service)
// and, on a UI-thread wxTimer, runs a single read-only SELECT, drains the Arrow C
// stream, and rebuilds its rows — showing LIVE rows as the metrics writer streams
// in (metrics is an ANY-THREAD service: a host UI-thread read racing an applet/
// job worker write serializes on the store's one mutex — embed.h §3.2).
//
// Arrow decode is deliberately minimal: the metrics schema (scalars: run BIGINT,
// tag VARCHAR, step BIGINT, value DOUBLE) yields only int64/double/utf8 columns.

#ifndef COMPASS_C1_METRICS_TABLE_H
#define COMPASS_C1_METRICS_TABLE_H

#include <wx/dataview.h>

#include <functional>
#include <string>

#include <caliper/services/metrics_v1_1.h>

namespace compass {

class MetricsTable : public wxDataViewListCtrl {
public:
    // log is called with a human line describing each refresh (row-count
    // progression) — WorkspaceFrame routes it to the Log pane.
    MetricsTable(wxWindow* parent, std::function<void(const std::string&)> log);

    // Called once the core is up. NULL means the service is unavailable — the
    // pane degrades honestly (a banner row).
    void SetService(const CaliperMetricsV1_1* svc);

    // The SELECT the pane polls. Default lists the live scalar stream.
    void SetQuery(std::string sql) { m_sql = std::move(sql); }

    // Run the query, drain Arrow, rebuild rows. Safe to call repeatedly.
    void Refresh();

private:
    void ShowBanner(const std::string& text);

    const CaliperMetricsV1_1* m_svc = nullptr;
    std::function<void(const std::string&)> m_log;
    std::string m_sql;
    int m_lastRows = -1;
    bool m_columnsBuilt = false;
};

}  // namespace compass

#endif  // COMPASS_C1_METRICS_TABLE_H
