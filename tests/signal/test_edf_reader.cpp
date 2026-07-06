// Unit tests for sig::EdfReader — synthesize valid EDF bytes, parse them back.
#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include <cstdint>
#include <string>
#include <vector>

#include "signal/edf_reader.h"

using sig::EdfReader;

namespace {

std::string Pad(const std::string& s, std::size_t w) {
    std::string r = s;
    r.resize(w, ' ');  // EDF fields are left-justified, space-padded
    return r;
}

void Put16(std::string& b, int v) {
    auto u = static_cast<uint16_t>(static_cast<int16_t>(v));
    b.push_back(static_cast<char>(u & 0xff));
    b.push_back(static_cast<char>((u >> 8) & 0xff));
}

struct Chan {
    std::string label;
    int spr;                     // samples per record
    std::vector<int> digital;    // nrec*spr digital samples, record-major
};

// Calibration chosen so physical == digital (dig 0..100 → phys 0..100).
std::string MakeEdf(double dur, int nrec, const std::vector<Chan>& chans) {
    const std::size_t ns = chans.size();
    std::string h;
    h += Pad("0", 8);
    h += Pad("patient", 80);
    h += Pad("recording", 80);
    h += Pad("01.01.24", 8);
    h += Pad("00.00.00", 8);
    h += Pad(std::to_string(256 + ns * 256), 8);
    h += Pad("EDF", 44);
    h += Pad(std::to_string(nrec), 8);
    h += Pad(std::to_string(dur), 8);
    h += Pad(std::to_string(ns), 4);
    // h is now the 256-byte main header.
    for (const auto& c : chans) h += Pad(c.label, 16);
    for (std::size_t i = 0; i < ns; ++i) h += Pad("", 80);      // transducer
    for (std::size_t i = 0; i < ns; ++i) h += Pad("uV", 8);     // phys dim
    for (std::size_t i = 0; i < ns; ++i) h += Pad("0", 8);      // phys min
    for (std::size_t i = 0; i < ns; ++i) h += Pad("100", 8);    // phys max
    for (std::size_t i = 0; i < ns; ++i) h += Pad("0", 8);      // dig min
    for (std::size_t i = 0; i < ns; ++i) h += Pad("100", 8);    // dig max
    for (std::size_t i = 0; i < ns; ++i) h += Pad("", 80);      // prefilter
    for (const auto& c : chans) h += Pad(std::to_string(c.spr), 8);
    for (std::size_t i = 0; i < ns; ++i) h += Pad("", 32);      // reserved
    // Data records, record-major, channel order within each record.
    for (int rec = 0; rec < nrec; ++rec) {
        for (const auto& c : chans) {
            for (int s = 0; s < c.spr; ++s) Put16(h, c.digital[rec * c.spr + s]);
        }
    }
    return h;
}

}  // namespace

TEST_CASE("single-channel EDF: labels, rate, and calibrated samples") {
    std::string edf = MakeEdf(1.0, 3, {{"ECG", 2, {10, 20, 30, 40, 50, 60}}});
    EdfReader r = EdfReader::Parse(edf);
    REQUIRE(r.ok());
    CHECK(r.channel_count() == 1);
    CHECK(r.channel(0).label == "ECG");
    CHECK(r.record_count() == 3);
    CHECK(r.record_duration() == doctest::Approx(1.0));
    CHECK(r.sample_rate(0) == doctest::Approx(2.0));  // 2 spr / 1 s
    REQUIRE(r.samples(0).size() == 6);
    CHECK(r.samples(0)[0] == doctest::Approx(10));
    CHECK(r.samples(0)[5] == doctest::Approx(60));
}

TEST_CASE("multi-channel records are de-interleaved per channel") {
    // ch0: 1 sample/record; ch1: 2 samples/record; 2 records.
    std::string edf = MakeEdf(0.5, 2,
                              {{"A", 1, {1, 2}}, {"B", 2, {3, 4, 5, 6}}});
    EdfReader r = EdfReader::Parse(edf);
    REQUIRE(r.ok());
    CHECK(r.channel_count() == 2);
    CHECK(r.sample_rate(1) == doctest::Approx(4.0));  // 2 spr / 0.5 s
    REQUIRE(r.samples(0).size() == 2);
    REQUIRE(r.samples(1).size() == 4);
    CHECK(r.samples(0)[1] == doctest::Approx(2));
    CHECK(r.samples(1)[3] == doctest::Approx(6));
}

TEST_CASE("unknown record count (-1) is derived from the file length") {
    std::string edf = MakeEdf(1.0, 3, {{"X", 2, {1, 2, 3, 4, 5, 6}}});
    // Overwrite the num-records field (offset 236, width 8) with "-1".
    edf.replace(236, 8, std::string("-1").append(6, ' '));
    EdfReader r = EdfReader::Parse(edf);
    REQUIRE(r.ok());
    CHECK(r.record_count() == 3);
}

TEST_CASE("malformed input is rejected, never thrown") {
    CHECK_FALSE(EdfReader::Parse("").ok());                        // empty
    CHECK_FALSE(EdfReader::Parse(std::string(100, ' ')).ok());     // too short
    CHECK_FALSE(EdfReader::Parse(std::string(256, ' ')).ok());     // no signal count
}
