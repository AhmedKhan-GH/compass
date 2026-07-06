// Compass — Plot Workbench (Instrument #1)
// Sampler implementation.

#include "plot/sampler.h"

#include <cmath>

namespace plot {

std::vector<Polyline> Sample(const Expression& expr, double xmin, double xmax,
                             int width_px) {
    std::vector<Polyline> out;
    if (expr.has_error() || width_px <= 0 || !(xmin < xmax)) return out;

    // ~2 samples per pixel; at least 2 so the step is well-defined.
    const int count = width_px * 2;
    const int n = count < 2 ? 2 : count;
    const double step = (xmax - xmin) / (n - 1);

    Polyline current;
    for (int i = 0; i < n; ++i) {
        const double x = (i == n - 1) ? xmax : xmin + i * step;
        const double y = expr.Eval(x);
        if (std::isfinite(y)) {
            current.push_back({x, y});
        } else if (!current.empty()) {
            out.push_back(std::move(current));
            current.clear();
        }
    }
    if (!current.empty()) out.push_back(std::move(current));
    return out;
}

}  // namespace plot
