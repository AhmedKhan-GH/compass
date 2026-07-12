// Compass C2 — PlotSeriesCanvas.
//
// The native scalar plot (spec §3): step-vs-value lines, one series per run per
// selected tag, drawn with wxGraphicsContext (theme-derived palette, per the
// rescued Plot Workbench canvas techniques — NiceStep ticks, system colours) —
// NOT ImGui/ImPlot (chrome is native, D13). Minimal by design: axes, gridlines,
// series polylines, a legend, and annotation step-markers. Read-only viewer.

#ifndef COMPASS_C2_PLOT_SERIES_CANVAS_H
#define COMPASS_C2_PLOT_SERIES_CANVAS_H

#include <string>
#include <utility>
#include <vector>

#include <wx/colour.h>
#include <wx/window.h>

class wxGraphicsContext;

namespace compass {

struct PlotSeries {
    wxColour color;
    std::string label;
    std::vector<std::pair<double, double>> points;  // (step, value)
};

struct PlotMarker {
    double step = 0;
    wxColour color;
    std::string text;
};

class PlotSeriesCanvas : public wxWindow {
public:
    explicit PlotSeriesCanvas(wxWindow* parent);

    // Replace the drawn data; repaints. An empty series set shows a placeholder.
    void SetData(std::vector<PlotSeries> series, std::vector<PlotMarker> markers,
                 std::string title);

private:
    void OnPaint(wxPaintEvent&);
    void Draw(wxGraphicsContext& gc, double w, double h);

    std::vector<PlotSeries> m_series;
    std::vector<PlotMarker> m_markers;
    std::string m_title;
};

}  // namespace compass

#endif  // COMPASS_C2_PLOT_SERIES_CANVAS_H
