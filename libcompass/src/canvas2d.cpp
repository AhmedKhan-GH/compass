// Compass framework (libcompass) — Canvas2D implementation.

#include "compass/canvas2d.h"

#include <wx/dcclient.h>

#if defined(__APPLE__) || defined(__linux__)
#include <dlfcn.h>
#elif defined(_WIN32)
#include <windows.h>
#endif

namespace compass {
namespace {

// GLAD proc-address loader, per platform. NOTE: the Windows branch below is
// written but UNVERIFIED — it needs a Windows CI run to prove (the port is
// code-complete-pending-CI, I3).
GLADapiproc GlLoader(const char* name) {
#if defined(__APPLE__)
    // macOS ships GL in a framework; resolve entry points with dlsym.
    static void* lib = dlopen(
        "/System/Library/Frameworks/OpenGL.framework/OpenGL", RTLD_LAZY | RTLD_LOCAL);
    return lib ? reinterpret_cast<GLADapiproc>(dlsym(lib, name)) : nullptr;
#elif defined(_WIN32)
    // wglGetProcAddress returns the modern (>1.1) entry points; the fixed 1.1
    // core lives in opengl32.dll, so fall back there when wgl returns null.
    auto p = reinterpret_cast<GLADapiproc>(wglGetProcAddress(name));
    if (p == nullptr || p == reinterpret_cast<GLADapiproc>(1) ||
        p == reinterpret_cast<GLADapiproc>(2) || p == reinterpret_cast<GLADapiproc>(3) ||
        p == reinterpret_cast<GLADapiproc>(-1)) {
        static HMODULE gl = LoadLibraryA("opengl32.dll");
        p = gl ? reinterpret_cast<GLADapiproc>(GetProcAddress(gl, name)) : nullptr;
    }
    return p;
#else  // Linux (dev platform)
    static void* lib = dlopen("libGL.so.1", RTLD_LAZY | RTLD_LOCAL);
    return lib ? reinterpret_cast<GLADapiproc>(dlsym(lib, name)) : nullptr;
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
