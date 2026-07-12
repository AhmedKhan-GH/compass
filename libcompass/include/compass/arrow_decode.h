// Compass C2 — a minimal Arrow C stream decoder (shared).
//
// caliper.metrics.v1_1.query() streams results as an Arrow C ArrowArrayStream.
// The metrics scalar schema yields only int64 / double / utf8 columns; this
// decoder drains the whole stream into typed cells (int / double / string / null),
// releasing the stream + batches as it goes. It is the ONE decode path for the
// live metrics table, the comparison stats/series fetches, and the tests (C1's
// per-widget inline decoder is retired onto this).
//
// Wx-free; needs only the Arrow C struct layout (caliper/arrow_c.h, header-only).

#ifndef COMPASS_ARROW_DECODE_H
#define COMPASS_ARROW_DECODE_H

#include <cstdint>
#include <string>
#include <vector>

struct ArrowArrayStream;  // caliper/arrow_c.h

namespace compass {

struct Cell {
    enum Kind { kNull, kInt, kDouble, kString } kind = kNull;
    int64_t i = 0;
    double d = 0.0;
    std::string s;

    bool is_null() const { return kind == kNull; }
    double as_double() const {
        return kind == kInt ? static_cast<double>(i) : d;
    }
    int64_t as_int() const {
        return kind == kDouble ? static_cast<int64_t>(d) : i;
    }
    // Human rendering for a table cell.
    std::string text() const;
};

struct DecodedTable {
    std::vector<std::string> columns;
    std::vector<std::vector<Cell>> rows;  // row-major; rows[r][c]

    size_t nrows() const { return rows.size(); }
    size_t ncols() const { return columns.size(); }
    // Index of a named column, or -1.
    int column(const std::string& name) const;
};

// Drain `stream` fully into `out` (also RELEASES the stream and every batch).
// Returns false on a decode error with a reason in *err; on success *err is
// untouched. Unhandled column types render as "<?>" rather than misread bytes.
bool DecodeStream(ArrowArrayStream* stream, DecodedTable* out, std::string* err);

}  // namespace compass

#endif  // COMPASS_ARROW_DECODE_H
