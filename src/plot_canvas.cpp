// Compass — Plot Workbench (Instrument #1)
// PlotCanvas implementation.

#include "plot_canvas.h"

#include <wx/dcbuffer.h>
#include <wx/dcmemory.h>
#include <wx/graphics.h>

#include <algorithm>
#include <cmath>
#include <memory>

#include "plot/expression.h"
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

// Smallest span we allow a view axis to reach (double-precision guard).
constexpr double kMinSpan = 1e-9;

}  // namespace

PlotCanvas::PlotCanvas(wxWindow* parent, plot::PlotDocument* doc)
    : wxWindow(parent, wxID_ANY, wxDefaultPosition, wxDefaultSize,
               wxFULL_REPAINT_ON_RESIZE),
      m_doc(doc) {
    SetBackgroundStyle(wxBG_STYLE_PAINT);  // required for wxAutoBufferedPaintDC
    Bind(wxEVT_PAINT, &PlotCanvas::OnPaint, this);
    Bind(wxEVT_LEFT_DOWN, &PlotCanvas::OnLeftDown, this);
    Bind(wxEVT_LEFT_UP, &PlotCanvas::OnLeftUp, this);
    Bind(wxEVT_MOTION, &PlotCanvas::OnMotion, this);
    Bind(wxEVT_MOUSEWHEEL, &PlotCanvas::OnWheel, this);
    Bind(wxEVT_MOUSE_CAPTURE_LOST, &PlotCanvas::OnCaptureLost, this);
}

plot::ViewRect PlotCanvas::EffectiveView() const {
    return m_hasPreview ? m_previewView : m_doc->view();
}

void PlotCanvas::OnPaint(wxPaintEvent&) {
    wxAutoBufferedPaintDC dc(this);
    std::unique_ptr<wxGraphicsContext> gc(wxGraphicsContext::Create(dc));
    if (!gc) return;
    const wxSize size = GetClientSize();
    Draw(*gc, size.GetWidth(), size.GetHeight());
}

wxBitmap PlotCanvas::RenderToBitmap(int width, int height) {
    wxBitmap bmp(std::max(width, 1), std::max(height, 1), 32);
    wxMemoryDC mdc(bmp);
    std::unique_ptr<wxGraphicsContext> gc(wxGraphicsContext::Create(mdc));
    if (gc) Draw(*gc, width, height);
    mdc.SelectObject(wxNullBitmap);
    return bmp;
}

void PlotCanvas::Draw(wxGraphicsContext& graphics, double w, double h) {
    wxGraphicsContext* gc = &graphics;
    if (w < 2 || h < 2) return;

    gc->SetBrush(*wxWHITE_BRUSH);
    gc->SetPen(*wxTRANSPARENT_PEN);
    gc->DrawRectangle(0, 0, w, h);

    const plot::ViewRect v = EffectiveView();
    if (!(v.xmin < v.xmax) || !(v.ymin < v.ymax)) return;

    auto mapX = [&](double x) { return (x - v.xmin) / (v.xmax - v.xmin) * w; };
    auto mapY = [&](double y) { return h - (y - v.ymin) / (v.ymax - v.ymin) * h; };

    if (v.grid) {
        gc->SetPen(wxPen(wxColour(230, 230, 230), 1));
        const double xstep = NiceStep(v.xmax - v.xmin, 10);
        for (double gx = std::ceil(v.xmin / xstep) * xstep; gx <= v.xmax; gx += xstep) {
            gc->StrokeLine(mapX(gx), 0, mapX(gx), h);
        }
        const double ystep = NiceStep(v.ymax - v.ymin, 8);
        for (double gy = std::ceil(v.ymin / ystep) * ystep; gy <= v.ymax; gy += ystep) {
            gc->StrokeLine(0, mapY(gy), w, mapY(gy));
        }
    }

    gc->SetPen(wxPen(wxColour(120, 120, 120), 1));
    if (v.ymin < 0 && v.ymax > 0) gc->StrokeLine(0, mapY(0), w, mapY(0));
    if (v.xmin < 0 && v.xmax > 0) gc->StrokeLine(mapX(0), 0, mapX(0), h);

    const int width_px = static_cast<int>(w);
    for (const plot::ExprEntry& e : m_doc->expressions()) {
        if (!e.style.visible) continue;
        plot::Expression expr = plot::Expression::Compile(e.text);
        if (expr.has_error()) continue;

        wxColour colour(e.style.color);
        if (!colour.IsOk()) colour = wxColour(47, 158, 68);  // #2F9E44 green
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

void PlotCanvas::OnLeftDown(wxMouseEvent& event) {
    m_dragging = true;
    m_dragStartPx = event.GetPosition();
    m_dragStartView = m_doc->view();
    if (!HasCapture()) CaptureMouse();
}

void PlotCanvas::OnMotion(wxMouseEvent& event) {
    const wxSize size = GetClientSize();
    const double w = size.GetWidth();
    const double h = size.GetHeight();
    if (w < 2 || h < 2) return;

    if (m_dragging && event.Dragging() && event.LeftIsDown()) {
        const plot::ViewRect& s = m_dragStartView;
        const double dpx = event.GetX() - m_dragStartPx.x;
        const double dpy = event.GetY() - m_dragStartPx.y;
        const double dx = dpx / w * (s.xmax - s.xmin);
        const double dy = dpy / h * (s.ymax - s.ymin);
        plot::ViewRect p = s;
        p.xmin = s.xmin - dx;
        p.xmax = s.xmax - dx;
        p.ymin = s.ymin + dy;  // screen y grows downward → plot y grows upward
        p.ymax = s.ymax + dy;
        m_previewView = p;
        m_hasPreview = true;
        Refresh();
        return;
    }

    // Hover: report cursor plot coordinates.
    if (m_onCursor) {
        const plot::ViewRect v = EffectiveView();
        const double x = v.xmin + event.GetX() / w * (v.xmax - v.xmin);
        const double y = v.ymin + (h - event.GetY()) / h * (v.ymax - v.ymin);
        m_onCursor(x, y);
    }
}

void PlotCanvas::OnLeftUp(wxMouseEvent&) {
    if (HasCapture()) ReleaseMouse();
    if (!m_dragging) return;
    m_dragging = false;
    if (m_hasPreview) {
        const plot::ViewRect committed = m_previewView;
        m_hasPreview = false;
        m_doc->SetView(committed);
        if (m_onChanged) m_onChanged();
    }
}

void PlotCanvas::OnCaptureLost(wxMouseCaptureLostEvent&) {
    m_dragging = false;
    m_hasPreview = false;
    Refresh();
}

void PlotCanvas::OnWheel(wxMouseEvent& event) {
    const wxSize size = GetClientSize();
    const double w = size.GetWidth();
    const double h = size.GetHeight();
    if (w < 2 || h < 2) return;

    const plot::ViewRect v = m_doc->view();
    // Zoom around the cursor: points under the cursor stay put.
    const double cx = v.xmin + event.GetX() / w * (v.xmax - v.xmin);
    const double cy = v.ymin + (h - event.GetY()) / h * (v.ymax - v.ymin);
    const double factor = (event.GetWheelRotation() > 0) ? 0.85 : 1.0 / 0.85;

    plot::ViewRect n;
    n.grid = v.grid;
    n.xmin = cx - (cx - v.xmin) * factor;
    n.xmax = cx + (v.xmax - cx) * factor;
    n.ymin = cy - (cy - v.ymin) * factor;
    n.ymax = cy + (v.ymax - cy) * factor;
    if ((n.xmax - n.xmin) < kMinSpan || (n.ymax - n.ymin) < kMinSpan) return;
    if (!std::isfinite(n.xmin) || !std::isfinite(n.xmax) ||
        !std::isfinite(n.ymin) || !std::isfinite(n.ymax)) return;

    m_doc->SetView(n);
    if (m_onChanged) m_onChanged();
}
