// Compass — Signal Workbench (Instrument #2, I3)
// WaveformDecimator implementation.

#include "signal/waveform_decimator.h"

#include <algorithm>

namespace sig {

std::vector<MinMax> Decimate(const std::vector<double>& samples, std::size_t begin,
                             std::size_t end, int columns) {
    std::vector<MinMax> out;
    if (columns <= 0 || end <= begin || begin >= samples.size()) return out;
    end = std::min(end, samples.size());
    const std::size_t span = end - begin;

    out.reserve(static_cast<std::size_t>(columns));
    for (int c = 0; c < columns; ++c) {
        // Column c covers samples [begin + c*span/columns, begin + (c+1)*span/columns).
        std::size_t lo = begin + (span * static_cast<std::size_t>(c)) / static_cast<std::size_t>(columns);
        std::size_t hi = begin + (span * static_cast<std::size_t>(c + 1)) / static_cast<std::size_t>(columns);
        if (hi <= lo) hi = lo + 1;             // sub-pixel zoom: at least one sample
        if (hi > end) hi = end;
        double mn = samples[lo];
        double mx = samples[lo];
        for (std::size_t i = lo + 1; i < hi; ++i) {
            mn = std::min(mn, samples[i]);
            mx = std::max(mx, samples[i]);
        }
        out.push_back({mn, mx});
    }
    return out;
}

}  // namespace sig
