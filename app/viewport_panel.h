// Compass C1 — ViewportPanel.
//
// The P1 pane: a DEDICATED leaf wxWindow whose native handle (GetHandle() ->
// NSView* on wxOSX/Cocoa) is handed to caliper_core_attach_canvas. The core
// replaces the view's backing layer with its CAMetalLayer and paints it every
// caliper_core_frame(); wx must therefore leave this view's pixels alone (no
// EVT_PAINT, background style = paint, erase suppressed — the survey's "two
// painters on one NSView" mitigation).
//
// It owns NOTHING of the core's lifetime — WorkspaceFrame creates/attaches/pumps.
// This panel only: (1) exposes its NSView + physical size + content scale, and
// (2) translates wx mouse/wheel/key/size input into CaliperInputEvent and hands
// it to a sink (mirroring examples/embed_host/main.mm STEP 4).

#ifndef COMPASS_C1_VIEWPORT_PANEL_H
#define COMPASS_C1_VIEWPORT_PANEL_H

#include <wx/window.h>

#include <functional>

#include <caliper/embed.h>

namespace compass {

class ViewportPanel : public wxWindow {
public:
    // sink receives already-filled CaliperInputEvents (struct_size set by us).
    using EventSink = std::function<void(const CaliperInputEvent&)>;

    ViewportPanel(wxWindow* parent, EventSink sink);

    // The NSView* the core attaches to. Valid once the window is realized.
    void* NativeView() const { return GetHandle(); }

    // Physical-pixel client size (logical points * content scale). The embed ABI
    // makes px-space part of the contract — feeding logical points is the exact
    // Retina bug that stranded old Compass (D13 / survey Q4).
    void PhysicalSize(int* w, int* h) const;
    float ContentScale() const { return static_cast<float>(GetContentScaleFactor()); }

    // Push a fresh CONTENT_SCALE + RESIZE pair (embed_host pushResizeAndScale).
    void PushResizeAndScale();

private:
    void Emit(CaliperInputEvent ev);
    void OnMouse(wxMouseEvent& e);
    void OnSize(wxSizeEvent& e);
    void OnChar(wxKeyEvent& e);
    void OnSetFocus(wxFocusEvent& e);
    void OnKillFocus(wxFocusEvent& e);

    EventSink m_sink;
};

}  // namespace compass

#endif  // COMPASS_C1_VIEWPORT_PANEL_H
