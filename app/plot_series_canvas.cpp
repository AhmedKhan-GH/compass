// Compass C2 — PlotSeriesCanvas implementation.

#include "plot_series_canvas.h"

#include <algorithm>
#include <cmath>
#include <memory>

#include <wx/dcbuffer.h>
#include <wx/graphics.h>
#include <wx/settings.h>

namespace compass {
namespace {

double NiceStep(double range, int target) {
    if (range <= 0 || target <= 0) return 1.0;
    const double raw = range / target;
    const double mag = std::pow(10.0, std::floor(std::log10(raw)));
    const double n = raw / mag;
    const double nice = (n < 1.5) ? 1 : (n < 3) ? 2 : (n < 7) ? 5 : 10;
    return nice * mag;
}

wxColour Blend(const wxColour& a, const wxColour& b, double t) {
    auto mix = [&](unsigned char x, unsigned char y) {
        return static_cast<unsigned char>(x + (y - x) * t);
    };
    return wxColour(mix(a.Red(), b.Red()), mix(a.Green(), b.Green()),
                    mix(a.Blue(), b.Blue()));
}

wxString Fmt(double v) { return wxString::Format("%.4g", v); }

}  // namespace

PlotSeriesCanvas::PlotSeriesCanvas(wxWindow* parent)
    : wxWindow(parent, wxID_ANY, wxDefaultPosition, wxDefaultSize,
               wxFULL_REPAINT_ON_RESIZE) {
    SetBackgroundStyle(wxBG_STYLE_PAINT);
    Bind(wxEVT_PAINT, &PlotSeriesCanvas::OnPaint, this);
}

void PlotSeriesCanvas::SetData(std::vector<PlotSeries> series,
                               std::vector<PlotMarker> markers,
                               std::string title) {
    m_series = std::move(series);
    m_markers = std::move(markers);
    m_title = std::move(title);
    Refresh();
}

void PlotSeriesCanvas::OnPaint(wxPaintEvent&) {
    wxAutoBufferedPaintDC dc(this);
    std::unique_ptr<wxGraphicsContext> gc(wxGraphicsContext::Create(dc));
    if (!gc) return;
    const wxSize sz = GetClientSize();
    Draw(*gc, sz.GetWidth(), sz.GetHeight());
}

void PlotSeriesCanvas::Draw(wxGraphicsContext& gc, double w, double h) {
    const wxColour bg = wxSystemSettings::GetColour(wxSYS_COLOUR_WINDOW);
    const wxColour fg = wxSystemSettings::GetColour(wxSYS_COLOUR_WINDOWTEXT);
    gc.SetBrush(wxBrush(bg));
    gc.SetPen(*wxTRANSPARENT_PEN);
    gc.DrawRectangle(0, 0, w, h);
    if (w < 40 || h < 40) return;

    // Placeholder when there is nothing to draw (honest, never a blank pane).
    bool any = false;
    for (const auto& s : m_series)
        if (!s.points.empty()) { any = true; break; }
    if (!any) {
        gc.SetFont(gc.CreateFont(wxSystemSettings::GetFont(wxSYS_DEFAULT_GUI_FONT),
                                 Blend(bg, fg, 0.5)));
        gc.DrawText(m_title.empty() ? "Select a tag to plot"
                                    : wxString::FromUTF8(m_title) + ": no data",
                    12, 12);
        return;
    }

    const double ml = 54, mr = 130, mt = 22, mb = 30;
    const double pw = w - ml - mr, ph = h - mt - mb;
    if (pw < 10 || ph < 10) return;

    double xmin = 0, xmax = 1, ymin = 0, ymax = 1;
    bool init = false;
    for (const auto& s : m_series)
        for (auto& p : s.points) {
            if (!init) { xmin = xmax = p.first; ymin = ymax = p.second; init = true; }
            xmin = std::min(xmin, p.first); xmax = std::max(xmax, p.first);
            ymin = std::min(ymin, p.second); ymax = std::max(ymax, p.second);
        }
    if (xmax <= xmin) xmax = xmin + 1;
    if (ymax <= ymin) { ymax = ymin + 1; ymin -= 1; }
    const double vpad = (ymax - ymin) * 0.05;
    ymin -= vpad; ymax += vpad;

    auto X = [&](double x) { return ml + (x - xmin) / (xmax - xmin) * pw; };
    auto Y = [&](double y) { return mt + ph - (y - ymin) / (ymax - ymin) * ph; };

    // Title.
    gc.SetFont(gc.CreateFont(wxSystemSettings::GetFont(wxSYS_DEFAULT_GUI_FONT), fg));
    if (!m_title.empty()) gc.DrawText(wxString::FromUTF8(m_title), ml, 4);

    // Gridlines + ticks.
    gc.SetPen(wxPen(Blend(bg, fg, 0.12), 1));
    const wxColour tickCol = Blend(bg, fg, 0.6);
    gc.SetFont(gc.CreateFont(wxSystemSettings::GetFont(wxSYS_DEFAULT_GUI_FONT)
                                 .Smaller(),
                             tickCol));
    const double xs = NiceStep(xmax - xmin, 8), ys = NiceStep(ymax - ymin, 6);
    for (double gx = std::ceil(xmin / xs) * xs; gx <= xmax; gx += xs) {
        gc.StrokeLine(X(gx), mt, X(gx), mt + ph);
        gc.DrawText(Fmt(gx), X(gx) - 10, mt + ph + 4);
    }
    for (double gy = std::ceil(ymin / ys) * ys; gy <= ymax; gy += ys) {
        gc.StrokeLine(ml, Y(gy), ml + pw, Y(gy));
        gc.DrawText(Fmt(gy), 4, Y(gy) - 7);
    }
    // Frame.
    gc.SetPen(wxPen(Blend(bg, fg, 0.4), 1));
    gc.StrokeLine(ml, mt, ml, mt + ph);
    gc.StrokeLine(ml, mt + ph, ml + pw, mt + ph);

    // Annotation step-markers.
    for (const auto& m : m_markers) {
        if (m.step < xmin || m.step > xmax) continue;
        gc.SetPen(wxPen(m.color, 1, wxPENSTYLE_SHORT_DASH));
        gc.StrokeLine(X(m.step), mt, X(m.step), mt + ph);
    }

    // Series polylines.
    for (const auto& s : m_series) {
        if (s.points.size() < 1) continue;
        gc.SetPen(wxPen(s.color, 2));
        wxGraphicsPath path = gc.CreatePath();
        path.MoveToPoint(X(s.points[0].first), Y(s.points[0].second));
        for (size_t i = 1; i < s.points.size(); ++i)
            path.AddLineToPoint(X(s.points[i].first), Y(s.points[i].second));
        gc.StrokePath(path);
    }

    // Legend.
    double ly = mt + 2;
    gc.SetFont(gc.CreateFont(wxSystemSettings::GetFont(wxSYS_DEFAULT_GUI_FONT), fg));
    for (const auto& s : m_series) {
        gc.SetPen(wxPen(s.color, 3));
        gc.StrokeLine(ml + pw + 10, ly + 6, ml + pw + 28, ly + 6);
        gc.DrawText(wxString::FromUTF8(s.label), ml + pw + 34, ly);
        ly += 18;
    }
}

}  // namespace compass
