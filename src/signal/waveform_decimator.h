// Compass — Signal Workbench (Instrument #2, I3)
// WaveformDecimator: the flagship's core rendering math. A long recording has far
// more samples than the canvas has pixels, so each pixel column is drawn as a
// vertical line from the min to the max sample it covers (min/max decimation).
// Pure C++, headless, wx-free.

#ifndef COMPASS_SIGNAL_WAVEFORM_DECIMATOR_H
#define COMPASS_SIGNAL_WAVEFORM_DECIMATOR_H

#include <cstddef>
#include <vector>

namespace sig {

struct MinMax {
    double min = 0.0;
    double max = 0.0;
};

// For `columns` pixel columns spanning samples[begin, end), return the min and
// max sample in each column's contiguous slice. Returns empty if columns <= 0 or
// the range is empty/invalid. When there are fewer samples than columns, columns
// that fall on no sample repeat the nearest covered value (never NaN).
std::vector<MinMax> Decimate(const std::vector<double>& samples, std::size_t begin,
                             std::size_t end, int columns);

}  // namespace sig

#endif  // COMPASS_SIGNAL_WAVEFORM_DECIMATOR_H
