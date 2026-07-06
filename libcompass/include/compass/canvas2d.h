// Compass framework (libcompass) — Canvas2D.
//
// The OpenGL 3.3-core viewport widget (PLATFORM.md §6, CD12). Owns a 3.3-core
// forward-compatible context, loads GLAD once, and applies the pixel-space rule
// (§6.3: framebuffer in physical pixels, converted from logical via the content
// scale) in EXACTLY ONE place. Instruments subclass it and implement OnDrawGL().
//
// glad/gl.h MUST precede wx/glcanvas.h so GLAD's loader blocks the system GL
// header (which would otherwise pull deprecated 2.1 symbols).

#ifndef COMPASS_CANVAS2D_H
#define COMPASS_CANVAS2D_H

#include <glad/gl.h>       // first — blocks the system <OpenGL/gl.h>
#include <wx/glcanvas.h>

namespace compass {

class Canvas2D : public wxGLCanvas {
public:
    explicit Canvas2D(wxWindow* parent);
    ~Canvas2D() override;

protected:
    // One-time GL setup, called after the context + GLAD are ready.
    virtual void OnInitGL() {}
    // Draw one frame. fb_width/fb_height are PHYSICAL pixels (glViewport is set).
    virtual void OnDrawGL(int fb_width, int fb_height) = 0;

    bool gl_ready() const { return m_gladLoaded; }

private:
    void OnPaint(wxPaintEvent& event);
    bool EnsureContext();  // create the 3.3-core context + load GLAD, once

    wxGLContext* m_context = nullptr;
    bool m_gladLoaded = false;
};

}  // namespace compass

#endif  // COMPASS_CANVAS2D_H
