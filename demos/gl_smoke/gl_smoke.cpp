// GL smoke test — the first real consumer of compass::Canvas2D (§6.2, CD12).
// Draws a gradient triangle via a GL 3.3-core VAO/VBO/shader pipeline, proving
// GLAD loading, the 3.3 forward-compatible context, and the pixel-space rule end
// to end. Replaces the deleted quaternion demo as the GL exemplar.

#include "compass/canvas2d.h"

#include <cstdio>

#include <wx/wx.h>

namespace {

const char* const kVertSrc = R"(#version 330 core
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec3 aCol;
out vec3 vCol;
void main() { vCol = aCol; gl_Position = vec4(aPos, 0.0, 1.0); }
)";

const char* const kFragSrc = R"(#version 330 core
in vec3 vCol;
out vec4 FragColor;
void main() { FragColor = vec4(vCol, 1.0); }
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

class TriangleCanvas : public compass::Canvas2D {
public:
    explicit TriangleCanvas(wxWindow* parent) : compass::Canvas2D(parent) {}

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

        const float verts[] = {
            //  x      y      r     g     b
             0.0f,  0.6f,  1.0f, 0.2f, 0.2f,
            -0.6f, -0.6f,  0.2f, 1.0f, 0.2f,
             0.6f, -0.6f,  0.2f, 0.4f, 1.0f,
        };
        glGenVertexArrays(1, &m_vao);
        glGenBuffers(1, &m_vbo);
        glBindVertexArray(m_vao);
        glBindBuffer(GL_ARRAY_BUFFER, m_vbo);
        glBufferData(GL_ARRAY_BUFFER, sizeof(verts), verts, GL_STATIC_DRAW);
        glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float),
                              reinterpret_cast<void*>(0));
        glEnableVertexAttribArray(0);
        glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float),
                              reinterpret_cast<void*>(2 * sizeof(float)));
        glEnableVertexAttribArray(1);
        glBindVertexArray(0);
    }

    void OnDrawGL(int, int) override {
        glClearColor(0.10f, 0.10f, 0.12f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        glUseProgram(m_prog);
        glBindVertexArray(m_vao);
        glDrawArrays(GL_TRIANGLES, 0, 3);
        glBindVertexArray(0);
    }

private:
    GLuint m_prog = 0;
    GLuint m_vao = 0;
    GLuint m_vbo = 0;
};

class GlSmokeApp : public wxApp {
public:
    bool OnInit() override {
        auto* frame = new wxFrame(nullptr, wxID_ANY, "compass::Canvas2D — GL 3.3 smoke",
                                  wxDefaultPosition, wxSize(480, 360));
        new TriangleCanvas(frame);
        frame->Show(true);
        return true;
    }
};

wxIMPLEMENT_APP(GlSmokeApp);
