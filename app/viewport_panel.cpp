// Compass C1 — ViewportPanel implementation.

#include "viewport_panel.h"

#include <wx/event.h>

namespace compass {

ViewportPanel::ViewportPanel(wxWindow* parent, EventSink sink)
    : wxWindow(parent, wxID_ANY, wxDefaultPosition, wxDefaultSize,
               wxWANTS_CHARS | wxFULL_REPAINT_ON_RESIZE),
      m_sink(std::move(sink)) {
    // Leave the pixels to the core's CAMetalLayer: declare that we own painting
    // (wxBG_STYLE_PAINT) but bind no EVT_PAINT, and swallow erase — so wx never
    // clears the Metal-backed view (survey Q4 risk #1).
    SetBackgroundStyle(wxBG_STYLE_PAINT);
    Bind(wxEVT_ERASE_BACKGROUND, [](wxEraseEvent&) { /* no-op: core paints */ });

    Bind(wxEVT_MOTION, &ViewportPanel::OnMouse, this);
    Bind(wxEVT_LEFT_DOWN, &ViewportPanel::OnMouse, this);
    Bind(wxEVT_LEFT_UP, &ViewportPanel::OnMouse, this);
    Bind(wxEVT_RIGHT_DOWN, &ViewportPanel::OnMouse, this);
    Bind(wxEVT_RIGHT_UP, &ViewportPanel::OnMouse, this);
    Bind(wxEVT_MIDDLE_DOWN, &ViewportPanel::OnMouse, this);
    Bind(wxEVT_MIDDLE_UP, &ViewportPanel::OnMouse, this);
    Bind(wxEVT_MOUSEWHEEL, &ViewportPanel::OnMouse, this);
    Bind(wxEVT_SIZE, &ViewportPanel::OnSize, this);
    Bind(wxEVT_CHAR, &ViewportPanel::OnChar, this);
    Bind(wxEVT_SET_FOCUS, &ViewportPanel::OnSetFocus, this);
    Bind(wxEVT_KILL_FOCUS, &ViewportPanel::OnKillFocus, this);
}

void ViewportPanel::PhysicalSize(int* w, int* h) const {
    const wxSize sz = GetClientSize();
    const double s = GetContentScaleFactor();
    *w = static_cast<int>(sz.x * s);
    *h = static_cast<int>(sz.y * s);
}

void ViewportPanel::Emit(CaliperInputEvent ev) {
    ev.struct_size = sizeof ev;
    if (m_sink) m_sink(ev);
}

void ViewportPanel::PushResizeAndScale() {
    const float s = ContentScale();
    CaliperInputEvent sc{};
    sc.type = CALIPER_EVENT_CONTENT_SCALE;
    sc.scale = s;
    Emit(sc);
    int w = 0, h = 0;
    PhysicalSize(&w, &h);
    CaliperInputEvent rz{};
    rz.type = CALIPER_EVENT_RESIZE;
    rz.width = w;
    rz.height = h;
    Emit(rz);
}

void ViewportPanel::OnMouse(wxMouseEvent& e) {
    e.Skip();
    const double s = GetContentScaleFactor();
    const float px = static_cast<float>(e.GetX() * s);
    const float py = static_cast<float>(e.GetY() * s);

    if (e.GetEventType() == wxEVT_MOUSEWHEEL) {
        CaliperInputEvent ev{};
        ev.type = CALIPER_EVENT_MOUSE_SCROLL;
        const float ticks =
            static_cast<float>(e.GetWheelRotation()) / e.GetWheelDelta();
        if (e.GetWheelAxis() == wxMOUSE_WHEEL_HORIZONTAL)
            ev.dx = ticks;
        else
            ev.dy = ticks;
        Emit(ev);
        return;
    }

    // ImGui wants a fresh position paired with every button transition.
    CaliperInputEvent move{};
    move.type = CALIPER_EVENT_MOUSE_MOVE;
    move.x = px;
    move.y = py;
    Emit(move);

    int button = -1, down = 0;
    const wxEventType t = e.GetEventType();
    if (t == wxEVT_LEFT_DOWN) { button = 0; down = 1; }
    else if (t == wxEVT_LEFT_UP) { button = 0; down = 0; }
    else if (t == wxEVT_RIGHT_DOWN) { button = 1; down = 1; }
    else if (t == wxEVT_RIGHT_UP) { button = 1; down = 0; }
    else if (t == wxEVT_MIDDLE_DOWN) { button = 2; down = 1; }
    else if (t == wxEVT_MIDDLE_UP) { button = 2; down = 0; }
    if (button < 0) return;  // plain motion

    if (down && !HasCapture()) CaptureMouse();
    if (!down && HasCapture()) ReleaseMouse();
    if (down) SetFocus();

    CaliperInputEvent btn{};
    btn.type = CALIPER_EVENT_MOUSE_BUTTON;
    btn.button = button;
    btn.down = down;
    Emit(btn);
}

void ViewportPanel::OnSize(wxSizeEvent& e) {
    e.Skip();
    PushResizeAndScale();
}

void ViewportPanel::OnChar(wxKeyEvent& e) {
    e.Skip();
    const wxChar c = e.GetUnicodeKey();
    if (c == WXK_NONE || c < 0x20) return;  // control keys → text is meaningless
    CaliperInputEvent ev{};
    ev.type = CALIPER_EVENT_TEXT;
    ev.codepoint = static_cast<unsigned int>(c);
    Emit(ev);
}

void ViewportPanel::OnSetFocus(wxFocusEvent& e) {
    e.Skip();
    CaliperInputEvent ev{};
    ev.type = CALIPER_EVENT_FOCUS;
    ev.focused = 1;
    Emit(ev);
}

void ViewportPanel::OnKillFocus(wxFocusEvent& e) {
    e.Skip();
    CaliperInputEvent ev{};
    ev.type = CALIPER_EVENT_FOCUS;
    ev.focused = 0;
    Emit(ev);
}

}  // namespace compass
