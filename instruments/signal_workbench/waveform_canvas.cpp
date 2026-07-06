// Compass — Signal Workbench (Instrument #2, I3)
// WaveformCanvas implementation.

#include "waveform_canvas.h"

#include <algorithm>
#include <vector>

#include "signal/edf_reader.h"
#include "signal/waveform_decimator.h"

namespace {

const char* const kVert = R"(#version 330 core
layout(location = 0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
)";
const char* const kFrag = R"(#version 330 core
uniform vec3 uColor;
out vec4 FragColor;
void main() { FragColor = vec4(uColor, 1.0); }
)";

GLuint Compile(GLenum type, const char* src) {
    GLuint s = glCreateShader(type);
    glShaderSource(s, 1, &src, nullptr);
    glCompileShader(s);
    return s;
}

// A per-channel color cycle (RGB in 0..1).
struct RGB { float r, g, b; };
const RGB kPalette[] = {{0.40f, 0.68f, 1.0f}, {1.0f, 0.42f, 0.42f},
                        {0.40f, 0.85f, 0.45f}, {1.0f, 0.70f, 0.20f},
                        {0.72f, 0.45f, 0.90f}, {0.20f, 0.80f, 0.85f}};

double MapValue(double v, double lo, double hi, double bot, double top) {
    if (hi <= lo) return (bot + top) * 0.5;
    return bot + (v - lo) / (hi - lo) * (top - bot);
}

}  // namespace

WaveformCanvas::WaveformCanvas(wxWindow* parent) : compass::Canvas2D(parent) {
    Bind(wxEVT_MOUSEWHEEL, &WaveformCanvas::OnWheel, this);
    Bind(wxEVT_LEFT_DOWN, &WaveformCanvas::OnLeftDown, this);
    Bind(wxEVT_LEFT_UP, &WaveformCanvas::OnLeftUp, this);
    Bind(wxEVT_MOTION, &WaveformCanvas::OnMotion, this);
}

void WaveformCanvas::SetReader(const sig::EdfReader* reader) {
    m_reader = reader;
    ResetView();
    Refresh();
}

void WaveformCanvas::ResetView() {
    m_winBegin = 0.0;
    m_winEnd = 1.0;
}

void WaveformCanvas::OnInitGL() {
    GLuint vs = Compile(GL_VERTEX_SHADER, kVert);
    GLuint fs = Compile(GL_FRAGMENT_SHADER, kFrag);
    m_prog = glCreateProgram();
    glAttachShader(m_prog, vs);
    glAttachShader(m_prog, fs);
    glLinkProgram(m_prog);
    glDeleteShader(vs);
    glDeleteShader(fs);
    m_uColor = glGetUniformLocation(m_prog, "uColor");
    glGenVertexArrays(1, &m_vao);
    glGenBuffers(1, &m_vbo);
    glBindVertexArray(m_vao);
    glBindBuffer(GL_ARRAY_BUFFER, m_vbo);
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float),
                          reinterpret_cast<void*>(0));
    glEnableVertexAttribArray(0);
    glBindVertexArray(0);
}

void WaveformCanvas::OnDrawGL(int fb_width, int) {
    glClearColor(0.08f, 0.08f, 0.10f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);
    if (!m_reader || !m_reader->ok() || m_prog == 0) return;
    const int nch = m_reader->channel_count();
    if (nch == 0) return;

    const int cols = std::max(16, fb_width);  // ~one column per physical pixel
    glUseProgram(m_prog);
    glBindVertexArray(m_vao);
    glBindBuffer(GL_ARRAY_BUFFER, m_vbo);

    std::vector<float> verts;
    for (int k = 0; k < nch; ++k) {
        const std::vector<double>& s = m_reader->samples(k);
        if (s.size() < 2) continue;
        const std::size_t begin = static_cast<std::size_t>(m_winBegin * s.size());
        const std::size_t end = static_cast<std::size_t>(m_winEnd * s.size());
        std::vector<sig::MinMax> mm = sig::Decimate(s, begin, end, cols);
        if (mm.empty()) continue;

        double lo = mm[0].min, hi = mm[0].max;
        for (const auto& m : mm) { lo = std::min(lo, m.min); hi = std::max(hi, m.max); }

        // Lane band in NDC (top channel first), with a small gap between lanes.
        const double top = 1.0 - 2.0 * k / nch - 0.03;
        const double bot = 1.0 - 2.0 * (k + 1) / nch + 0.03;

        verts.clear();
        verts.reserve(mm.size() * 4);
        for (std::size_t c = 0; c < mm.size(); ++c) {
            const float x = static_cast<float>(-1.0 + 2.0 * (c + 0.5) / mm.size());
            verts.push_back(x);
            verts.push_back(static_cast<float>(MapValue(mm[c].min, lo, hi, bot, top)));
            verts.push_back(x);
            verts.push_back(static_cast<float>(MapValue(mm[c].max, lo, hi, bot, top)));
        }
        glBufferData(GL_ARRAY_BUFFER, verts.size() * sizeof(float), verts.data(),
                     GL_DYNAMIC_DRAW);
        const RGB& col = kPalette[k % (sizeof(kPalette) / sizeof(kPalette[0]))];
        glUniform3f(m_uColor, col.r, col.g, col.b);
        glDrawArrays(GL_LINES, 0, static_cast<GLsizei>(mm.size() * 2));
    }
    glBindVertexArray(0);
}

void WaveformCanvas::OnWheel(wxMouseEvent& e) {
    if (!m_reader) return;
    const double w = std::max(1, GetClientSize().GetWidth());
    const double fx = m_winBegin + (e.GetX() / w) * (m_winEnd - m_winBegin);
    const double factor = (e.GetWheelRotation() > 0) ? 0.85 : 1.0 / 0.85;
    double nb = fx - (fx - m_winBegin) * factor;
    double ne = fx + (m_winEnd - fx) * factor;
    nb = std::max(0.0, nb);
    ne = std::min(1.0, ne);
    if (ne - nb < 1e-4) return;
    m_winBegin = nb;
    m_winEnd = ne;
    Refresh();
}

void WaveformCanvas::OnLeftDown(wxMouseEvent& e) {
    m_dragging = true;
    m_dragStartX = e.GetX();
    m_dragBegin = m_winBegin;
    m_dragEnd = m_winEnd;
    if (!HasCapture()) CaptureMouse();
}

void WaveformCanvas::OnMotion(wxMouseEvent& e) {
    if (!m_dragging || !e.Dragging() || !e.LeftIsDown() || !m_reader) return;
    const double w = std::max(1, GetClientSize().GetWidth());
    const double span = m_dragEnd - m_dragBegin;
    double df = -(e.GetX() - m_dragStartX) / w * span;
    double nb = m_dragBegin + df, ne = m_dragEnd + df;
    if (nb < 0.0) { ne -= nb; nb = 0.0; }
    if (ne > 1.0) { nb -= (ne - 1.0); ne = 1.0; }
    m_winBegin = std::max(0.0, nb);
    m_winEnd = std::min(1.0, ne);
    Refresh();
}

void WaveformCanvas::OnLeftUp(wxMouseEvent&) {
    if (HasCapture()) ReleaseMouse();
    m_dragging = false;
}
