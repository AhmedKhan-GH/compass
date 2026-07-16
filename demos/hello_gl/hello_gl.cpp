// GL hello — window + buttons + an OpenGL 3.3 animated sine wave, on compass::Canvas2D.
// The 'first app' tutorial walks this file (docs/wiki/tutorials/first-app.md). The
// wave's y is computed in the vertex shader (GPU-resident); a wxTimer advances the
// phase uniform each frame.

#include "compass/canvas2d.h"

#include <cmath>
#include <cstdio>

#include <wx/wx.h>
#include <wx/timer.h>
#include <wx/sizer.h>
#include <wx/button.h>

namespace {

const int kNumVerts = 256;  // sample count along the strip

const char* const kVertSrc = R"(#version 330 core
layout(location = 0) in float aX;
uniform float uAmp;
uniform float uFreq;
uniform float uPhase;
void main() {
    float y = uAmp * sin(uFreq * aX * 3.14159265 + uPhase);
    gl_Position = vec4(aX, y, 0.0, 1.0);
}
)";

const char* const kFragSrc = R"(#version 330 core
out vec4 FragColor;
void main() { FragColor = vec4(0.30, 0.43, 0.96, 1.0); }
)";

GLuint Compile(GLenum type, const char* src) {
    GLuint s = glCreateShader(type);
    glShaderSource(s, 1, &src, nullptr);
    glCompileShader(s);
    GLint ok = 0;
    glGetShaderiv(s, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        char log[512];
        glGetShaderInfoLog(s, sizeof(log), nullptr, log);
        std::fprintf(stderr, "shader compile error: %s\n", log);
    }
    return s;
}

}  // namespace

class SineCanvas : public compass::Canvas2D {
public:
    explicit SineCanvas(wxWindow* parent) : compass::Canvas2D(parent) {}

    void AddPhase(float d) { m_phase += d; }  // the timer scrolls the wave

protected:
    void OnInitGL() override {
        GLuint vs = Compile(GL_VERTEX_SHADER, kVertSrc);
        GLuint fs = Compile(GL_FRAGMENT_SHADER, kFragSrc);
        m_prog = glCreateProgram();
        glAttachShader(m_prog, vs);
        glAttachShader(m_prog, fs);
        glLinkProgram(m_prog);
        glDeleteShader(vs);
        glDeleteShader(fs);

        m_uAmp = glGetUniformLocation(m_prog, "uAmp");
        m_uFreq = glGetUniformLocation(m_prog, "uFreq");
        m_uPhase = glGetUniformLocation(m_prog, "uPhase");

        // N x-positions evenly spaced in [-1, 1]; y is computed in the shader.
        float xs[kNumVerts];
        for (int i = 0; i < kNumVerts; ++i)
            xs[i] = -1.0f + 2.0f * static_cast<float>(i) / (kNumVerts - 1);

        glGenVertexArrays(1, &m_vao);
        glGenBuffers(1, &m_vbo);
        glBindVertexArray(m_vao);
        glBindBuffer(GL_ARRAY_BUFFER, m_vbo);
        glBufferData(GL_ARRAY_BUFFER, sizeof(xs), xs, GL_STATIC_DRAW);
        glVertexAttribPointer(0, 1, GL_FLOAT, GL_FALSE, sizeof(float),
                              reinterpret_cast<void*>(0));
        glEnableVertexAttribArray(0);
        glBindVertexArray(0);
    }

    void OnDrawGL(int, int) override {
        glClearColor(0.12f, 0.12f, 0.14f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        glUseProgram(m_prog);
        glUniform1f(m_uAmp, m_amp);
        glUniform1f(m_uFreq, m_freq);
        glUniform1f(m_uPhase, m_phase);
        glLineWidth(2.0f);
        glBindVertexArray(m_vao);
        glDrawArrays(GL_LINE_STRIP, 0, kNumVerts);
        glBindVertexArray(0);
    }

private:
    GLuint m_prog = 0;
    GLuint m_vao = 0;
    GLuint m_vbo = 0;
    GLint m_uAmp = -1;
    GLint m_uFreq = -1;
    GLint m_uPhase = -1;
    float m_amp = 0.8f;
    float m_freq = 3.0f;
    float m_phase = 0.0f;
};

class HelloGlFrame : public wxFrame {
public:
    HelloGlFrame()
        : wxFrame(nullptr, wxID_ANY, L"compass::Canvas2D — GL hello (animated sine)",
                  wxDefaultPosition, wxSize(640, 480)) {
        auto* canvas = new SineCanvas(this);

        auto* bar = new wxBoxSizer(wxHORIZONTAL);
        auto* playBtn = new wxButton(this, wxID_ANY, "Pause");
        bar->Add(playBtn, 0, wxALL, 2);

        auto* sizer = new wxBoxSizer(wxVERTICAL);
        sizer->Add(canvas, 1, wxEXPAND);
        sizer->Add(bar, 0, wxEXPAND);
        SetSizer(sizer);

        // ~16 ms ≈ 60fps; advance the phase and repaint each tick.
        m_timer.Bind(wxEVT_TIMER, [canvas](wxTimerEvent&) {
            canvas->AddPhase(0.08f);
            canvas->Refresh();
        });
        m_timer.Start(16);  // playing by default

        playBtn->Bind(wxEVT_BUTTON, [this, playBtn](wxCommandEvent&) {
            if (m_timer.IsRunning()) {
                m_timer.Stop();
                playBtn->SetLabel("Play");
            } else {
                m_timer.Start(16);
                playBtn->SetLabel("Pause");
            }
        });
    }

private:
    wxTimer m_timer;
};

class HelloGlApp : public wxApp {
public:
    bool OnInit() override {
        auto* frame = new HelloGlFrame();
        frame->Show(true);
        return true;
    }
};

wxIMPLEMENT_APP(HelloGlApp);
