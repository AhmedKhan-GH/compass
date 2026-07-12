// Compass C1 — MetricsTable implementation.

#include "metrics_table.h"

#include <cstdint>
#include <cstdio>
#include <vector>

#include <caliper/arrow_c.h>

namespace compass {
namespace {

// One decoded column: its display name plus a per-row string renderer bound to
// the Arrow child array. Only the metrics types (int64/double/utf8) are handled;
// anything else renders as "<?>" rather than misreading bytes.
struct Column {
    std::string name;
    std::function<std::string(int64_t /*row*/)> cell;
};

bool bit_set(const uint8_t* validity, int64_t i) {
    return validity == nullptr || (validity[i >> 3] & (1u << (i & 7)));
}

Column make_column(const ArrowSchema* cs, const ArrowArray* ca) {
    Column col;
    col.name = cs->name ? cs->name : "";
    const char* fmt = cs->format ? cs->format : "";
    const int64_t off = ca->offset;
    const auto* validity =
        ca->n_buffers > 0 ? static_cast<const uint8_t*>(ca->buffers[0]) : nullptr;

    if (fmt[0] == 'l') {  // int64
        const auto* data = static_cast<const int64_t*>(ca->buffers[1]);
        col.cell = [=](int64_t r) -> std::string {
            if (!bit_set(validity, off + r)) return "NULL";
            return std::to_string(data[off + r]);
        };
    } else if (fmt[0] == 'g') {  // float64 / double
        const auto* data = static_cast<const double*>(ca->buffers[1]);
        col.cell = [=](int64_t r) -> std::string {
            if (!bit_set(validity, off + r)) return "NULL";
            char buf[32];
            std::snprintf(buf, sizeof buf, "%.6g", data[off + r]);
            return buf;
        };
    } else if (fmt[0] == 'u' || fmt[0] == 'z') {  // utf8 / binary (int32 offsets)
        const auto* offs = static_cast<const int32_t*>(ca->buffers[1]);
        const auto* chars = static_cast<const char*>(ca->buffers[2]);
        col.cell = [=](int64_t r) -> std::string {
            if (!bit_set(validity, off + r)) return "NULL";
            const int32_t a = offs[off + r], b = offs[off + r + 1];
            return std::string(chars + a, chars + b);
        };
    } else {
        col.cell = [](int64_t) -> std::string { return "<?>"; };
    }
    return col;
}

}  // namespace

MetricsTable::MetricsTable(wxWindow* parent,
                           std::function<void(const std::string&)> log)
    : wxDataViewListCtrl(parent, wxID_ANY),
      m_log(std::move(log)),
      m_sql("SELECT run, tag, step, value FROM scalars ORDER BY run, tag, step") {
    ShowBanner("metrics service not attached yet");
}

void MetricsTable::SetService(const CaliperMetricsV1_1* svc) {
    m_svc = svc;
    if (!m_svc) ShowBanner("caliper.metrics.v1_1 unavailable (pane degraded)");
}

void MetricsTable::ShowBanner(const std::string& text) {
    DeleteAllItems();
    ClearColumns();
    AppendTextColumn("metrics");
    wxVector<wxVariant> row;
    row.push_back(wxVariant(wxString::FromUTF8(text)));
    AppendItem(row);
    m_columnsBuilt = false;
}

void MetricsTable::Refresh() {
    if (!m_svc || !m_svc->query) return;

    ArrowArrayStream stream{};
    if (!m_svc->query(m_sql.c_str(), &stream)) {
        const char* err = m_svc->last_error ? m_svc->last_error() : "query failed";
        ShowBanner(std::string("query error: ") + (err ? err : "?"));
        return;
    }

    ArrowSchema schema{};
    if (stream.get_schema(&stream, &schema) != 0) {
        if (stream.release) stream.release(&stream);
        ShowBanner("stream get_schema failed");
        return;
    }

    // Collect column display names once (from the struct schema children).
    std::vector<std::string> colNames;
    for (int64_t c = 0; c < schema.n_children; ++c) {
        const ArrowSchema* cs = schema.children[c];
        colNames.emplace_back(cs->name ? cs->name : "");
    }

    // Drain every batch into strings BEFORE touching the control, so a mid-drain
    // failure never leaves a half-built table.
    std::vector<std::vector<std::string>> rows;
    for (;;) {
        ArrowArray batch{};
        if (stream.get_next(&stream, &batch) != 0) break;      // error → stop
        if (batch.release == nullptr) break;                   // end of stream

        std::vector<Column> cols;
        cols.reserve(batch.n_children);
        for (int64_t c = 0; c < batch.n_children; ++c)
            cols.push_back(make_column(schema.children[c], batch.children[c]));

        for (int64_t r = 0; r < batch.length; ++r) {
            std::vector<std::string> cells;
            cells.reserve(cols.size());
            for (auto& col : cols) cells.push_back(col.cell(r));
            rows.push_back(std::move(cells));
        }
        batch.release(&batch);
    }
    if (schema.release) schema.release(&schema);
    if (stream.release) stream.release(&stream);

    // Rebuild columns only when the header set changes (cheap steady state).
    if (!m_columnsBuilt || static_cast<size_t>(GetColumnCount()) != colNames.size()) {
        DeleteAllItems();
        ClearColumns();
        for (auto& n : colNames) AppendTextColumn(wxString::FromUTF8(n));
        m_columnsBuilt = true;
    } else {
        DeleteAllItems();
    }

    for (auto& r : rows) {
        wxVector<wxVariant> vr;
        for (auto& cell : r) vr.push_back(wxVariant(wxString::FromUTF8(cell)));
        // Guard against a row narrower/wider than the header (shouldn't happen).
        while (vr.size() < colNames.size()) vr.push_back(wxVariant(""));
        AppendItem(vr);
    }

    const int n = static_cast<int>(rows.size());
    if (n != m_lastRows) {
        if (m_log)
            m_log("metrics table: " + std::to_string(n) + " row(s) live");
        m_lastRows = n;
    }
}

}  // namespace compass
