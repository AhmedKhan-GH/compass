// Compass — Plot Workbench (Instrument #1)
// PlotCanvas implementation.

#include "plot_canvas.h"

#include <wx/dcbuffer.h>
#include <wx/graphics.h>

#include <cmath>
#include <memory>

#include "plot/expression.h"
#include "plot/plot_document.h"
#include "plot/sampler.h"

namespace {

// A "nice" grid step (1/2/5 × 10^k) so gridlines land on round numbers.
double NiceStep(double range, int target_lines) {
    if (range <= 0.0 || target_lines <= 0) return 1.0;
    const double raw = range / target_lines;
    const double mag = std::pow(10.0, std::floor(std::log10(raw)));
    const double norm = raw / mag;
    const double nice = (norm < 1.5) ? 1.0 : (norm < 3.0) ? 2.0 : (norm < 7.0) ? 5.0 : 10.0;
    return nice * mag;
}

}  // namespace

PlotCanvas::PlotCanvas(wxWindow* parent, const plot::PlotDocument* doc)
    : wxWindow(parent, wxID_ANY, wxDefaultPosition, wxDefaultSize,
               wxFULL_REPAINT_ON_RESIZE),
      m_doc(doc) {
    SetBackgroundStyle(wxBG_STYLE_PAINT);  // required for wxAutoBufferedPaintDC
    Bind(wxEVT_PAINT, &PlotCanvas::OnPaint, this);
}

void PlotCanvas::OnPaint(wxPaintEvent&) {
    wxAutoBufferedPaintDC dc(this);
    std::unique_ptr<wxGraphicsContext> gc(wxGraphicsContext::Create(dc));
    if (!gc || !m_doc) return;

    const wxSize size = GetClientSize();
    const double w = size.GetWidth();
    const double h = size.GetHeight();
    if (w < 2 || h < 2) return;

    // Background.
    gc->SetBrush(*wxWHITE_BRUSH);
    gc->SetPen(*wxTRANSPARENT_PEN);
    gc->DrawRectangle(0, 0, w, h);

    const plot::ViewRect& v = m_doc->view();
    if (!(v.xmin < v.xmax) || !(v.ymin < v.ymax)) return;

    // Plot-coordinate → pixel mappers (y flipped: larger y is higher on screen).
    auto mapX = [&](double x) { return (x - v.xmin) / (v.xmax - v.xmin) * w; };
    auto mapY = [&](double y) { return h - (y - v.ymin) / (v.ymax - v.ymin) * h; };

    // Grid lines at nice intervals.
    if (v.grid) {
        gc->SetPen(wxPen(wxColour(230, 230, 230), 1));
        const double xstep = NiceStep(v.xmax - v.xmin, 10);
        for (double gx = std::ceil(v.xmin / xstep) * xstep; gx <= v.xmax; gx += xstep) {
            const double px = mapX(gx);
            gc->StrokeLine(px, 0, px, h);
        }
        const double ystep = NiceStep(v.ymax - v.ymin, 8);
        for (double gy = std::ceil(v.ymin / ystep) * ystep; gy <= v.ymax; gy += ystep) {
            const double py = mapY(gy);
            gc->StrokeLine(0, py, w, py);
        }
    }

    // Axes (x = 0, y = 0) drawn darker when in view.
    gc->SetPen(wxPen(wxColour(120, 120, 120), 1));
    if (v.ymin < 0 && v.ymax > 0) { const double py = mapY(0); gc->StrokeLine(0, py, w, py); }
    if (v.xmin < 0 && v.xmax > 0) { const double px = mapX(0); gc->StrokeLine(px, 0, px, h); }

    // Curves — one path per visible, parseable expression.
    const int width_px = static_cast<int>(w);
    for (const plot::ExprEntry& e : m_doc->expressions()) {
        if (!e.style.visible) continue;
        plot::Expression expr = plot::Expression::Compile(e.text);
        if (expr.has_error()) continue;

        wxColour colour(e.style.color);
        if (!colour.IsOk()) colour = wxColour(76, 110, 245);
        gc->SetPen(wxPen(colour, e.style.width));

        for (const plot::Polyline& poly : plot::Sample(expr, v.xmin, v.xmax, width_px)) {
            if (poly.size() < 2) continue;
            wxGraphicsPath path = gc->CreatePath();
            path.MoveToPoint(mapX(poly[0].x), mapY(poly[0].y));
            for (std::size_t i = 1; i < poly.size(); ++i) {
                path.AddLineToPoint(mapX(poly[i].x), mapY(poly[i].y));
            }
            gc->StrokePath(path);
        }
    }
}
