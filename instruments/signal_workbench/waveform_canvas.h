// Compass — Signal Workbench (Instrument #2, I3)
// WaveformCanvas: the first real consumer of compass::Canvas2D. Renders each EDF
// channel as a decimated min/max waveform (one lane per channel) on the GL 3.3
// viewport, with wheel-zoom and drag-pan over the recording's time axis.

#pragma once

#include "compass/canvas2d.h"

namespace sig {
class EdfReader;
}

class WaveformCanvas : public compass::Canvas2D {
public:
    explicit WaveformCanvas(wxWindow* parent);

    void SetReader(const sig::EdfReader* reader);  // nullptr clears the view
    void ResetView();                              // show the whole recording

protected:
    void OnInitGL() override;
    void OnDrawGL(int fb_width, int fb_height) override;

private:
    void OnWheel(wxMouseEvent& e);
    void OnLeftDown(wxMouseEvent& e);
    void OnLeftUp(wxMouseEvent& e);
    void OnMotion(wxMouseEvent& e);

    const sig::EdfReader* m_reader = nullptr;
    double m_winBegin = 0.0;  // visible window as a fraction [0,1] of the record
    double m_winEnd = 1.0;

    unsigned int m_prog = 0;
    unsigned int m_vao = 0;
    unsigned int m_vbo = 0;
    int m_uColor = -1;

    bool m_dragging = false;
    int m_dragStartX = 0;
    double m_dragBegin = 0.0;
    double m_dragEnd = 1.0;
};
