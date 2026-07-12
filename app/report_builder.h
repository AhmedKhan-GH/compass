// Compass C2 — the metrics query layer + report assembly.
//
// MetricsQuery is the thin bridge the comparison views and the exporter share:
// SQL builder -> caliper.metrics.v1_1.query() -> Arrow decode -> DecodedTable.
// BuildReportData turns the document's run set into a ReportData by querying the
// store (run metadata, per-tag stats, per-tag series) — the exact same numbers
// the on-screen tables/plots show, so the exported report matches the screen.

#ifndef COMPASS_C2_REPORT_BUILDER_H
#define COMPASS_C2_REPORT_BUILDER_H

#include <string>

#include <caliper/services/metrics_v1_1.h>

#include "compass/arrow_decode.h"
#include "compass/comparison_document.h"
#include "compass/report.h"

namespace compass {

class MetricsQuery {
public:
    explicit MetricsQuery(const CaliperMetricsV1_1* svc) : svc_(svc) {}

    bool ok() const { return svc_ && svc_->query; }

    // Run the SQL and decode the whole stream into *out. false -> error() set.
    bool Run(const std::string& sql, DecodedTable* out);
    const std::string& error() const { return err_; }

private:
    const CaliperMetricsV1_1* svc_;
    std::string err_;
};

// Assemble a full ReportData for the document's runs. `store_label`/`store_foreign`
// carry the store identity + the checkpoint-visibility caveat; `generated_at` is
// supplied by the caller (a timestamp). Missing services degrade to empty tables.
ReportData BuildReportData(const ComparisonDocument& doc, MetricsQuery& q,
                           const std::string& store_label, bool store_foreign,
                           const std::string& generated_at);

}  // namespace compass

#endif  // COMPASS_C2_REPORT_BUILDER_H
