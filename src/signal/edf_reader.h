// Compass — Signal Workbench (Instrument #2, I3)
// EdfReader: parse the European Data Format (EDF) — the standard container for
// EEG/ECG/PSG recordings. 256-byte ASCII header + per-signal headers + int16
// data records. Implemented in-repo (EDF is simple; no external library admitted
// — §5.2 catalog notes this). Pure C++, headless, wx-free; never throws.
//
// Reference: Kemp et al., "A simple format for exchange of digitized polygraphic
// recordings" (EDF), 1992.

#ifndef COMPASS_SIGNAL_EDF_READER_H
#define COMPASS_SIGNAL_EDF_READER_H

#include <string>
#include <vector>

namespace sig {

struct EdfChannel {
    std::string label;
    int samples_per_record = 0;
    double phys_min = 0.0;
    double phys_max = 0.0;
    double digital_min = 0.0;
    double digital_max = 0.0;
};

class EdfReader {
public:
    // Parse EDF from raw file bytes. Never throws: on any malformation ok() is
    // false and error() explains. Reads bytes from disk are the caller's job.
    static EdfReader Parse(const std::string& bytes);

    bool ok() const { return ok_; }
    const std::string& error() const { return error_; }

    double record_duration() const { return record_duration_; }  // seconds
    int record_count() const { return record_count_; }
    int channel_count() const { return static_cast<int>(channels_.size()); }
    const EdfChannel& channel(int i) const { return channels_[i]; }

    // samples_per_record / record_duration.
    double sample_rate(int channel) const;

    // Calibrated physical samples for a channel, concatenated across all records.
    const std::vector<double>& samples(int channel) const { return data_[channel]; }

private:
    bool ok_ = false;
    std::string error_;
    double record_duration_ = 0.0;
    int record_count_ = 0;
    std::vector<EdfChannel> channels_;
    std::vector<std::vector<double>> data_;  // [channel][sample], physical units
};

}  // namespace sig

#endif  // COMPASS_SIGNAL_EDF_READER_H
