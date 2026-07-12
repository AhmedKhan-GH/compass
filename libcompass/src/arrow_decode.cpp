// Compass C2 — Arrow C stream decoder (int64 / double / utf8, else "<?>").

#include "compass/arrow_decode.h"

#include <cstdio>

#include <caliper/arrow_c.h>

namespace compass {
namespace {

bool BitSet(const uint8_t* validity, int64_t i) {
    return validity == nullptr || (validity[i >> 3] & (1u << (i & 7)));
}

// Decode one child array's row `r` into a Cell using its Arrow format code.
Cell DecodeCell(const char* fmt, const ArrowArray* ca, int64_t r) {
    Cell cell;
    const int64_t off = ca->offset;
    const auto* validity =
        ca->n_buffers > 0 ? static_cast<const uint8_t*>(ca->buffers[0]) : nullptr;
    if (!BitSet(validity, off + r)) return cell;  // kNull

    const char f = fmt ? fmt[0] : '\0';
    if (f == 'l' || f == 'i' || f == 's' || f == 'c') {  // int64/32/16/8
        // metrics ints are int64 ('l'); narrower widths handled defensively.
        if (f == 'l') {
            cell.kind = Cell::kInt;
            cell.i = static_cast<const int64_t*>(ca->buffers[1])[off + r];
        } else if (f == 'i') {
            cell.kind = Cell::kInt;
            cell.i = static_cast<const int32_t*>(ca->buffers[1])[off + r];
        } else if (f == 's') {
            cell.kind = Cell::kInt;
            cell.i = static_cast<const int16_t*>(ca->buffers[1])[off + r];
        } else {
            cell.kind = Cell::kInt;
            cell.i = static_cast<const int8_t*>(ca->buffers[1])[off + r];
        }
    } else if (f == 'g' || f == 'f') {  // float64 / float32
        cell.kind = Cell::kDouble;
        cell.d = (f == 'g')
                     ? static_cast<const double*>(ca->buffers[1])[off + r]
                     : static_cast<const float*>(ca->buffers[1])[off + r];
    } else if (f == 'b') {  // boolean (bit-packed)
        const auto* bits = static_cast<const uint8_t*>(ca->buffers[1]);
        cell.kind = Cell::kInt;
        cell.i = BitSet(bits, off + r) ? 1 : 0;
    } else if (f == 'u' || f == 'z') {  // utf8 / binary (int32 offsets)
        const auto* offs = static_cast<const int32_t*>(ca->buffers[1]);
        const auto* chars = static_cast<const char*>(ca->buffers[2]);
        cell.kind = Cell::kString;
        cell.s.assign(chars + offs[off + r], chars + offs[off + r + 1]);
    } else {
        cell.kind = Cell::kString;
        cell.s = "<?>";
    }
    return cell;
}

}  // namespace

std::string Cell::text() const {
    switch (kind) {
        case kNull:
            return "NULL";
        case kInt:
            return std::to_string(i);
        case kDouble: {
            char buf[32];
            std::snprintf(buf, sizeof buf, "%.6g", d);
            return buf;
        }
        case kString:
            return s;
    }
    return "";
}

int DecodedTable::column(const std::string& name) const {
    for (size_t c = 0; c < columns.size(); ++c)
        if (columns[c] == name) return static_cast<int>(c);
    return -1;
}

bool DecodeStream(ArrowArrayStream* stream, DecodedTable* out, std::string* err) {
    *out = DecodedTable{};

    ArrowSchema schema{};
    if (stream->get_schema(stream, &schema) != 0) {
        if (err) *err = "get_schema failed";
        if (stream->release) stream->release(stream);
        return false;
    }
    std::vector<std::string> formats;
    for (int64_t c = 0; c < schema.n_children; ++c) {
        const ArrowSchema* cs = schema.children[c];
        out->columns.emplace_back(cs->name ? cs->name : "");
        formats.emplace_back(cs->format ? cs->format : "");
    }

    for (;;) {
        ArrowArray batch{};
        if (stream->get_next(stream, &batch) != 0) {
            if (err) *err = "get_next failed";
            if (schema.release) schema.release(&schema);
            if (stream->release) stream->release(stream);
            return false;
        }
        if (batch.release == nullptr) break;  // end of stream

        for (int64_t r = 0; r < batch.length; ++r) {
            std::vector<Cell> row;
            row.reserve(batch.n_children);
            for (int64_t c = 0; c < batch.n_children; ++c)
                row.push_back(DecodeCell(formats[c].c_str(), batch.children[c], r));
            out->rows.push_back(std::move(row));
        }
        batch.release(&batch);
    }

    if (schema.release) schema.release(&schema);
    if (stream->release) stream->release(stream);
    return true;
}

}  // namespace compass
