#include <GL/glew.h> // Include GLEW header
#include <wx/wx.h>
#include <wx/glcanvas.h>

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

public:
    MyGLContext(wxGLCanvas *canvas) : wxGLContext(canvas), glewInitialized(false) {
        // Note: GLEW initialization is removed from here
    }

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

        // Rendering code remains unchanged
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
public:
    MyGLCanvas(wxFrame* parent)
    : wxGLCanvas(parent, wxID_ANY, nullptr, wxDefaultPosition, wxSize(400, 300), 0, wxT("GLCanvas")),
      m_context(new MyGLContext(this))
    {
        Bind(wxEVT_PAINT, &MyGLCanvas::OnPaint, this);
    }

    void OnPaint(wxPaintEvent& event) {
        m_context->Render(this); // Use the context to render
    }
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

        wxButton* upButton = new wxButton(panel, wxID_ANY, wxT("Up"));
        wxButton* downButton = new wxButton(panel, wxID_ANY, wxT("Down"));
        wxButton* leftButton = new wxButton(panel, wxID_ANY, wxT("Left"));
        wxButton* rightButton = new wxButton(panel, wxID_ANY, wxT("Right"));

        buttonSizer->Add(upButton, 1, wxALL, 5);
        buttonSizer->Add(downButton, 1, wxALL, 5);
        buttonSizer->Add(leftButton, 1, wxALL, 5);
        buttonSizer->Add(rightButton, 1, wxALL, 5);

        panel->SetSizer(buttonSizer);
        sizer->Add(panel, 0, wxEXPAND | wxALL, 5);

        this->SetSizer(sizer);
        this->Layout();

        // Example bindings for button events
        upButton->Bind(wxEVT_BUTTON, [this](wxCommandEvent& event) { /* Handle Up */ });
        downButton->Bind(wxEVT_BUTTON, [this](wxCommandEvent& event) { /* Handle Down */ });
        leftButton->Bind(wxEVT_BUTTON, [this](wxCommandEvent& event) { /* Handle Left */ });
        rightButton->Bind(wxEVT_BUTTON, [this](wxCommandEvent& event) { /* Handle Right */ });
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
