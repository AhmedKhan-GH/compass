// Compass framework (libcompass) — Canvas2D implementation.

#include "compass/canvas2d.h"

#include <wx/dcclient.h>

#if defined(__APPLE__)
#include <dlfcn.h>
#endif

namespace compass {
namespace {

// GLAD proc-address loader. macOS resolves GL entry points from the OpenGL
// framework via dlsym; the Windows port (I3) will use wglGetProcAddress here.
GLADapiproc GlLoader(const char* name) {
#if defined(__APPLE__)
    static void* lib = dlopen(
        "/System/Library/Frameworks/OpenGL.framework/OpenGL", RTLD_LAZY | RTLD_LOCAL);
    return lib ? reinterpret_cast<GLADapiproc>(dlsym(lib, name)) : nullptr;
#else
    (void)name;
    return nullptr;
#endif
}

wxGLAttributes DisplayAttrs() {
    wxGLAttributes a;
    a.PlatformDefaults().RGBA().DoubleBuffer().Depth(24).EndList();
    return a;
}

}  // namespace

Canvas2D::Canvas2D(wxWindow* parent)
    : wxGLCanvas(parent, DisplayAttrs()) {
    Bind(wxEVT_PAINT, &Canvas2D::OnPaint, this);
}

Canvas2D::~Canvas2D() { delete m_context; }

bool Canvas2D::EnsureContext() {
    if (m_context) {
        SetCurrent(*m_context);
        return true;
    }
    wxGLContextAttrs ctxAttrs;
    ctxAttrs.CoreProfile().OGLVersion(3, 3).ForwardCompatible().EndList();
    m_context = new wxGLContext(this, nullptr, &ctxAttrs);
    if (!m_context->IsOK()) {
        delete m_context;
        m_context = nullptr;
        return false;
    }
    SetCurrent(*m_context);
    if (!m_gladLoaded) {
        if (gladLoadGL(GlLoader) == 0) return false;
        m_gladLoaded = true;
        OnInitGL();
    }
    return true;
}

void Canvas2D::OnPaint(wxPaintEvent&) {
    wxPaintDC dc(this);  // required even though we draw with GL
    if (!IsShownOnScreen()) return;
    if (!EnsureContext()) return;

    // The one and only place the content scale is applied: logical widget size →
    // physical-pixel framebuffer (§6.3). Instruments never see the scale factor.
    const wxSize size = GetClientSize();
    const double scale = GetContentScaleFactor();
    const int fbw = static_cast<int>(size.GetWidth() * scale);
    const int fbh = static_cast<int>(size.GetHeight() * scale);
    glViewport(0, 0, fbw, fbh);

    OnDrawGL(fbw, fbh);
    SwapBuffers();
}

}  // namespace compass
