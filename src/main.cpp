#include <GL/glew.h> // Include GLEW header
#include <wx/wx.h>
#include <wx/glcanvas.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>

#ifdef __WXMAC__
#include <OpenGL/gl.h>
#include <OpenGL/glu.h>
#else
// These includes are now redundant, as GLEW provides necessary OpenGL headers
// #include <GL/gl.h>
// #include <GL/glu.h>
#endif

class MyGLContext : public wxGLContext {
private:
    bool glewInitialized; // Flag to check if GLEW has been initialized
    float rotationAngle; // Current rotation angle
    bool isRotating; // Flag to control rotation

public:
    MyGLContext(wxGLCanvas *canvas) : wxGLContext(canvas), glewInitialized(false), rotationAngle(0.0f), isRotating(false) {
        // Note: GLEW initialization is removed from here
    }

    void StartRotation() { isRotating = true; }
    void StopRotation() { isRotating = false; }
    bool IsRotating() const { return isRotating; }

    void InitializeGLEW() {
        GLenum err = glewInit();
        if (GLEW_OK != err) {
            // GLEW initialization failed, handle the error
            wxLogError("GLEW Initialization failed: %s", glewGetErrorString(err));
            return;
        }

        // Check if OpenGL 2.1 is supported (as an example)
        if (!GLEW_VERSION_2_1) {
            wxLogError("OpenGL 2.1 not supported");
            return;
        }

        glewInitialized = true;
    }

    void Render(wxGLCanvas *canvas, bool resetViewport = false) {
        if (!glewInitialized) {
            SetCurrent(*canvas); // Ensure the context is current before initializing GLEW
            InitializeGLEW();
            glClearColor(0.0f, 0.0f, 0.0f, 1.0f); // Set background color to black
        }

        SetCurrent(*canvas);
        glClear(GL_COLOR_BUFFER_BIT); // Clear the background

        // Update rotation angle if rotating
        if (isRotating) {
            rotationAngle += 2.0f; // Increment rotation angle
            if (rotationAngle >= 360.0f) {
                rotationAngle -= 360.0f;
            }
        }

        // Apply rotation using GLM
        glMatrixMode(GL_MODELVIEW);
        glLoadIdentity();
        glm::mat4 model = glm::rotate(glm::mat4(1.0f), glm::radians(rotationAngle), glm::vec3(0.0f, 0.0f, 1.0f));
        glLoadMatrixf(glm::value_ptr(model));

        // Rendering code
        glBegin(GL_TRIANGLES);
        glColor3f(1.0f, 0.0f, 0.0f); // Red
        glVertex2f(0.0f, 1.0f); // Top
        glColor3f(0.0f, 1.0f, 0.0f); // Green
        glVertex2f(-1.0f, -1.0f); // Bottom Left
        glColor3f(0.0f, 0.0f, 1.0f); // Blue
        glVertex2f(1.0f, -1.0f); // Bottom Right
        glEnd();

        glFlush(); // Finish rendering
        canvas->SwapBuffers(); // Swap the front and back buffers
    }
};
class MyGLCanvas : public wxGLCanvas {
    MyGLContext* m_context;
    wxTimer* m_timer;
public:
    MyGLCanvas(wxFrame* parent)
    : wxGLCanvas(parent, wxID_ANY, nullptr, wxDefaultPosition, wxSize(400, 300), 0, wxT("GLCanvas")),
      m_context(new MyGLContext(this)),
      m_timer(new wxTimer(this))
    {
        Bind(wxEVT_PAINT, &MyGLCanvas::OnPaint, this);
        Bind(wxEVT_TIMER, &MyGLCanvas::OnTimer, this);
        m_timer->Start(16); // ~60 FPS
    }

    ~MyGLCanvas() {
        m_timer->Stop();
        delete m_timer;
        delete m_context;
    }

    void OnPaint(wxPaintEvent& event) {
        m_context->Render(this); // Use the context to render
    }

    void OnTimer(wxTimerEvent& event) {
        Refresh(); // Trigger a repaint
    }

    MyGLContext* GetContext() { return m_context; }
};

class MyFrame : public wxFrame {
public:
    MyGLCanvas* canvas;
    MyFrame(const wxString& title, const wxPoint& pos, const wxSize& size)
    : wxFrame(NULL, wxID_ANY, title, pos, size) {
        SetSize(wxSize(600, 400)); // Make the window larger

        canvas = new MyGLCanvas(this);
        wxBoxSizer* sizer = new wxBoxSizer(wxVERTICAL);
        sizer->Add(canvas, 1, wxEXPAND | wxALL, 5);

        wxPanel* panel = new wxPanel(this, wxID_ANY, wxDefaultPosition, wxSize(600, 100));
        wxBoxSizer* buttonSizer = new wxBoxSizer(wxHORIZONTAL);

        wxButton* startButton = new wxButton(panel, wxID_ANY, wxT("Start"));
        wxButton* stopButton = new wxButton(panel, wxID_ANY, wxT("Stop"));

        buttonSizer->Add(startButton, 1, wxALL, 5);
        buttonSizer->Add(stopButton, 1, wxALL, 5);

        panel->SetSizer(buttonSizer);
        sizer->Add(panel, 0, wxEXPAND | wxALL, 5);

        this->SetSizer(sizer);
        this->Layout();

        // Button bindings for rotation control
        startButton->Bind(wxEVT_BUTTON, [this](wxCommandEvent& event) {
            canvas->GetContext()->StartRotation();
        });
        stopButton->Bind(wxEVT_BUTTON, [this](wxCommandEvent& event) {
            canvas->GetContext()->StopRotation();
        });
    }
};

class MyApp : public wxApp {
public:
    virtual bool OnInit() {
        MyFrame* frame = new MyFrame(wxT("OpenGL with Controls"), wxDefaultPosition, wxSize(600, 400));
        frame->Show(true);
        return true;
    }
};

wxIMPLEMENT_APP(MyApp);
