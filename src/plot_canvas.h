// Compass — Plot Workbench (Instrument #1)
// PlotCanvas: draws the worksheet's curves with native 2D (wxGraphicsContext,
// PLATFORM.md §6.1 — no GL at I1). Reads a PlotDocument; redraws on Refresh().

#pragma once

#include <wx/window.h>

namespace plot {
class PlotDocument;
}

class PlotCanvas : public wxWindow {
public:
    PlotCanvas(wxWindow* parent, const plot::PlotDocument* doc);

private:
    void OnPaint(wxPaintEvent& event);

    const plot::PlotDocument* m_doc;  // not owned
};
