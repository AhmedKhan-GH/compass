// Compass — Plot Workbench (Instrument #1)
// PlotCanvas: draws the worksheet's curves with native 2D (wxGraphicsContext,
// PLATFORM.md §6.1 — no GL at I1) and handles drag-pan / wheel-zoom, each
// committing one SetView command. Reports the cursor's plot coordinates.

#pragma once

#include <functional>

#include <wx/bitmap.h>
#include <wx/window.h>

#include "plot/plot_document.h"

class wxGraphicsContext;

class PlotCanvas : public wxWindow {
public:
    PlotCanvas(wxWindow* parent, plot::PlotDocument* doc);

    // Called after a pan/zoom commits a SetView (so the frame re-syncs panels).
    void SetOnChanged(std::function<void()> cb) { m_onChanged = std::move(cb); }
    // Called on mouse-move with the cursor's plot coordinates (x, y).
    void SetOnCursor(std::function<void(double, double)> cb) {
        m_onCursor = std::move(cb);
    }

    // Render the current plot into an offscreen bitmap (for PNG export).
    wxBitmap RenderToBitmap(int width, int height);

private:
    void OnPaint(wxPaintEvent& event);
    void Draw(wxGraphicsContext& gc, double w, double h);
    void OnLeftDown(wxMouseEvent& event);
    void OnLeftUp(wxMouseEvent& event);
    void OnMotion(wxMouseEvent& event);
    void OnWheel(wxMouseEvent& event);
    void OnCaptureLost(wxMouseCaptureLostEvent& event);

    // The view currently drawn: the live drag preview if active, else the doc's.
    plot::ViewRect EffectiveView() const;

    plot::PlotDocument* m_doc;  // not owned
    std::function<void()> m_onChanged;
    std::function<void(double, double)> m_onCursor;

    bool m_dragging = false;
    wxPoint m_dragStartPx;
    plot::ViewRect m_dragStartView;
    bool m_hasPreview = false;
    plot::ViewRect m_previewView;
};
