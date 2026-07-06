// Compass — Signal Workbench (Instrument #2, I3)
// EdfReader implementation.

#include "signal/edf_reader.h"

#include <cstdint>
#include <cstdlib>
#include <cstring>

namespace sig {
namespace {

// EDF header field offsets/widths (bytes) in the fixed 256-byte header.
constexpr std::size_t kHeaderBytes = 256;
constexpr std::size_t kOffNumRecords = 236;
constexpr std::size_t kOffRecordDur = 244;
constexpr std::size_t kOffNumSignals = 252;

std::string Field(const std::string& b, std::size_t off, std::size_t len) {
    if (off + len > b.size()) return {};
    std::string s = b.substr(off, len);
    // Trim trailing/leading ASCII spaces (EDF pads with spaces).
    std::size_t a = s.find_first_not_of(' ');
    std::size_t z = s.find_last_not_of(' ');
    if (a == std::string::npos) return {};
    return s.substr(a, z - a + 1);
}

bool ParseInt(const std::string& s, long& out) {
    if (s.empty()) return false;
    char* end = nullptr;
    errno = 0;
    long v = std::strtol(s.c_str(), &end, 10);
    if (errno != 0 || end != s.c_str() + s.size()) return false;
    out = v;
    return true;
}

bool ParseDouble(const std::string& s, double& out) {
    if (s.empty()) return false;
    char* end = nullptr;
    errno = 0;
    double v = std::strtod(s.c_str(), &end);
    if (end != s.c_str() + s.size()) return false;
    out = v;
    return true;
}

int16_t ReadInt16LE(const std::string& b, std::size_t off) {
    const auto lo = static_cast<uint8_t>(b[off]);
    const auto hi = static_cast<uint8_t>(b[off + 1]);
    return static_cast<int16_t>(static_cast<uint16_t>(lo) | (static_cast<uint16_t>(hi) << 8));
}

}  // namespace

double EdfReader::sample_rate(int channel) const {
    if (record_duration_ <= 0.0) return 0.0;
    return channels_[channel].samples_per_record / record_duration_;
}

EdfReader EdfReader::Parse(const std::string& bytes) {
    EdfReader r;
    auto fail = [&](const char* msg) { r.ok_ = false; r.error_ = msg; return r; };

    if (bytes.size() < kHeaderBytes) return fail("truncated header");

    long num_signals = 0;
    if (!ParseInt(Field(bytes, kOffNumSignals, 4), num_signals) || num_signals <= 0)
        return fail("bad signal count");
    const std::size_t ns = static_cast<std::size_t>(num_signals);

    if (!ParseDouble(Field(bytes, kOffRecordDur, 8), r.record_duration_) ||
        r.record_duration_ <= 0.0)
        return fail("bad record duration");

    long num_records = 0;
    if (!ParseInt(Field(bytes, kOffNumRecords, 8), num_records))
        return fail("bad record count");

    const std::size_t full_header = kHeaderBytes + ns * kHeaderBytes;
    if (bytes.size() < full_header) return fail("truncated signal headers");

    // Per-signal header field bases (each field is ns * width, channel-major).
    const std::size_t base = kHeaderBytes;
    const std::size_t offLabel = base + 0 * ns;
    const std::size_t offPhysMin = base + 104 * ns;
    const std::size_t offPhysMax = base + 112 * ns;
    const std::size_t offDigMin = base + 120 * ns;
    const std::size_t offDigMax = base + 128 * ns;
    const std::size_t offSamples = base + 216 * ns;

    r.channels_.resize(ns);
    std::size_t record_samples = 0;
    for (std::size_t i = 0; i < ns; ++i) {
        EdfChannel& c = r.channels_[i];
        c.label = Field(bytes, offLabel + i * 16, 16);
        long spr = 0;
        if (!ParseInt(Field(bytes, offSamples + i * 8, 8), spr) || spr <= 0)
            return fail("bad samples-per-record");
        c.samples_per_record = static_cast<int>(spr);
        if (!ParseDouble(Field(bytes, offPhysMin + i * 8, 8), c.phys_min) ||
            !ParseDouble(Field(bytes, offPhysMax + i * 8, 8), c.phys_max) ||
            !ParseDouble(Field(bytes, offDigMin + i * 8, 8), c.digital_min) ||
            !ParseDouble(Field(bytes, offDigMax + i * 8, 8), c.digital_max))
            return fail("bad calibration field");
        record_samples += static_cast<std::size_t>(spr);
    }

    const std::size_t record_bytes = record_samples * 2;
    if (record_bytes == 0) return fail("empty data record");
    const std::size_t data_avail = bytes.size() - full_header;
    // num_records == -1 means "unknown": derive it from the file length.
    if (num_records < 0) num_records = static_cast<long>(data_avail / record_bytes);
    r.record_count_ = static_cast<int>(num_records);
    if (data_avail < static_cast<std::size_t>(num_records) * record_bytes)
        return fail("truncated data records");

    // Decode: each record holds, per channel in order, spr int16 LE samples.
    r.data_.assign(ns, {});
    for (std::size_t i = 0; i < ns; ++i)
        r.data_[i].reserve(static_cast<std::size_t>(num_records) * r.channels_[i].samples_per_record);

    std::size_t pos = full_header;
    for (long rec = 0; rec < num_records; ++rec) {
        for (std::size_t i = 0; i < ns; ++i) {
            const EdfChannel& c = r.channels_[i];
            const double drange = c.digital_max - c.digital_min;
            const double prange = c.phys_max - c.phys_min;
            const double scale = (drange != 0.0) ? prange / drange : 0.0;
            for (int s = 0; s < c.samples_per_record; ++s) {
                const int16_t d = ReadInt16LE(bytes, pos);
                pos += 2;
                r.data_[i].push_back(c.phys_min + (d - c.digital_min) * scale);
            }
        }
    }

    r.ok_ = true;
    return r;
}

}  // namespace sig
