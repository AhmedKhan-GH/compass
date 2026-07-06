// Compass — Plot Workbench (Instrument #1)
// Sampler: turns a compiled Expression into screen-ready polylines.
//
// Samples y = expr(x) uniformly across a visible x-range at ~2 samples per pixel,
// and splits the result into separate polylines wherever y is non-finite
// (NaN/±inf) — so 1/x, sqrt(x), tan(x) render as gaps, not spurious lines.
// Pure C++, headless, wx-free.

#ifndef COMPASS_PLOT_SAMPLER_H
#define COMPASS_PLOT_SAMPLER_H

#include <vector>

#include "plot/expression.h"

namespace plot {

struct Point {
    double x = 0.0;
    double y = 0.0;
};

// A run of consecutive finite samples. The canvas draws each polyline as one
// connected stroke; the gaps between polylines are where the function is undefined.
using Polyline = std::vector<Point>;

// Sample `expr` over [xmin, xmax] at ~2 samples per pixel for a `width_px`-wide
// viewport. Consecutive finite points form a polyline; a non-finite sample ends
// the current polyline (empty polylines are never emitted). Returns empty if the
// expression errored, width_px <= 0, or xmin >= xmax.
std::vector<Polyline> Sample(const Expression& expr, double xmin, double xmax,
                             int width_px);

}  // namespace plot

#endif  // COMPASS_PLOT_SAMPLER_H
