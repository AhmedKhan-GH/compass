#include <GL/glew.h>
#include <wx/wx.h>
#include <wx/glcanvas.h>
#include <wx/slider.h>
#include <wx/checkbox.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <glm/gtc/quaternion.hpp>
#define GLM_ENABLE_EXPERIMENTAL
#include <glm/gtx/quaternion.hpp>
#include <sstream>
#include <iomanip>
#include <vector>
#include <cmath>

#ifdef __WXMAC__
#include <OpenGL/gl.h>
#include <OpenGL/glu.h>
#else
#endif

class MyGLContext : public wxGLContext {
private:
    bool glewInitialized;
    glm::quat currentQuat;
    glm::quat targetQuat;
    glm::quat childQuat;         // Second object for hierarchy demo
    float slerpFactor;
    bool useEuler;
    bool autoRotate;
    bool autoSlerp;
    float animationTime;
    std::vector<glm::vec3> rotationTrail;
    std::vector<glm::vec3> childTrail;
    const size_t MAX_TRAIL_SIZE = 200;
    bool showTrail;
    bool showCube;
    bool showAxis;
    bool showChild;
    bool showSwingTwist;

    // Camera controls
    float cameraDistance;
    float cameraYaw;
    float cameraPitch;
    glm::vec3 cameraTarget;

    // Performance tracking
    int frameCount;
    float fpsTimer;
    float currentFPS;

    // Rotation axis visualization
    glm::vec3 rotationAxis;
    float rotationAngle;

public:
    MyGLContext(wxGLCanvas *canvas)
        : wxGLContext(canvas),
          glewInitialized(false),
          currentQuat(1.0f, 0.0f, 0.0f, 0.0f),
          targetQuat(1.0f, 0.0f, 0.0f, 0.0f),
          childQuat(glm::angleAxis(glm::radians(45.0f), glm::vec3(0, 0, 1))),
          slerpFactor(0.0f),
          useEuler(true),
          autoRotate(false),
          autoSlerp(false),
          animationTime(0.0f),
          showTrail(true),
          showCube(true),
          showAxis(true),
          showChild(true),
          showSwingTwist(false),
          cameraDistance(6.5f),
          cameraYaw(45.0f),
          cameraPitch(25.0f),
          cameraTarget(0, 0, 0),
          frameCount(0),
          fpsTimer(0.0f),
          currentFPS(60.0f),
          rotationAxis(0, 1, 0),
          rotationAngle(0.0f) {
    }

    void SetEulerAngles(float pitch, float yaw, float roll) {
        glm::vec3 eulerAngles(glm::radians(pitch), glm::radians(yaw), glm::radians(roll));
        currentQuat = glm::quat(eulerAngles);
        if (!autoRotate) AddToTrail();
    }

    void SetTargetQuat(const glm::quat& target) {
        targetQuat = target;
    }

    void SetSlerpFactor(float factor) {
        slerpFactor = factor;
    }

    void SetUseEuler(bool euler) {
        useEuler = euler;
    }

    void SetAutoRotate(bool rotate) { autoRotate = rotate; }
    void SetAutoSlerp(bool slerp) { autoSlerp = slerp; }
    void SetShowTrail(bool trail) { showTrail = trail; }
    void SetShowCube(bool cube) { showCube = cube; }
    void SetShowAxis(bool axis) { showAxis = axis; }
    void SetShowChild(bool child) { showChild = child; }
    void SetShowSwingTwist(bool st) { showSwingTwist = st; }
    void ClearTrail() {
        rotationTrail.clear();
        childTrail.clear();
    }

    bool IsAutoRotating() const { return autoRotate; }
    bool IsAutoSlerp() const { return autoSlerp; }
    float GetFPS() const { return currentFPS; }

    void RotateCamera(float deltaYaw, float deltaPitch) {
        cameraYaw += deltaYaw;
        cameraPitch += deltaPitch;
        cameraPitch = glm::clamp(cameraPitch, -89.0f, 89.0f);
    }

    void ZoomCamera(float delta) {
        cameraDistance -= delta;
        cameraDistance = glm::clamp(cameraDistance, 2.0f, 20.0f);
    }

    void AddToTrail() {
        glm::mat4 model = glm::mat4_cast(currentQuat);
        glm::vec3 xAxis = glm::vec3(model[0]) * 1.5f;
        rotationTrail.push_back(xAxis);
        if (rotationTrail.size() > MAX_TRAIL_SIZE) {
            rotationTrail.erase(rotationTrail.begin());
        }
    }

    glm::quat GetCurrentQuat() const { return currentQuat; }

    void InitializeGLEW() {
        GLenum err = glewInit();
        if (GLEW_OK != err) {
            wxLogError("GLEW Initialization failed: %s", glewGetErrorString(err));
            return;
        }
        if (!GLEW_VERSION_2_1) {
            wxLogError("OpenGL 2.1 not supported");
            return;
        }
        glewInitialized = true;
    }

    void DrawAxis(const glm::vec3& start, const glm::vec3& end, float r, float g, float b, float glow = 1.0f) {
        // Draw glow effect
        if (glow > 0.5f) {
            glLineWidth(8.0f);
            glBegin(GL_LINES);
            glColor4f(r * 0.3f, g * 0.3f, b * 0.3f, 0.3f);
            glVertex3f(start.x, start.y, start.z);
            glVertex3f(end.x, end.y, end.z);
            glEnd();
        }

        // Main axis line
        glLineWidth(4.0f);
        glBegin(GL_LINES);
        glColor3f(r * glow, g * glow, b * glow);
        glVertex3f(start.x, start.y, start.z);
        glVertex3f(end.x, end.y, end.z);
        glEnd();

        // Draw arrowhead
        glm::vec3 dir = glm::normalize(end - start);
        glm::vec3 arrowStart = end - dir * 0.15f;
        glm::vec3 perpendicular = glm::vec3(-dir.y, dir.x, 0.0f);
        if (glm::length(perpendicular) < 0.01f) {
            perpendicular = glm::vec3(0.0f, -dir.z, dir.y);
        }
        perpendicular = glm::normalize(perpendicular) * 0.1f;

        glBegin(GL_TRIANGLES);
        glColor3f(r * glow, g * glow, b * glow);
        glVertex3f(end.x, end.y, end.z);
        glVertex3f(arrowStart.x + perpendicular.x, arrowStart.y + perpendicular.y, arrowStart.z + perpendicular.z);
        glVertex3f(arrowStart.x - perpendicular.x, arrowStart.y - perpendicular.y, arrowStart.z - perpendicular.z);
        glEnd();
    }

    void DrawCube(float size) {
        float s = size * 0.5f;
        glLineWidth(2.0f);
        glColor4f(0.4f, 0.7f, 1.0f, 0.6f);

        // Draw cube wireframe
        glBegin(GL_LINE_LOOP); // Front
        glVertex3f(-s, -s, s); glVertex3f(s, -s, s);
        glVertex3f(s, s, s); glVertex3f(-s, s, s);
        glEnd();

        glBegin(GL_LINE_LOOP); // Back
        glVertex3f(-s, -s, -s); glVertex3f(s, -s, -s);
        glVertex3f(s, s, -s); glVertex3f(-s, s, -s);
        glEnd();

        glBegin(GL_LINES); // Connecting edges
        glVertex3f(-s, -s, s); glVertex3f(-s, -s, -s);
        glVertex3f(s, -s, s); glVertex3f(s, -s, -s);
        glVertex3f(s, s, s); glVertex3f(s, s, -s);
        glVertex3f(-s, s, s); glVertex3f(-s, s, -s);
        glEnd();
    }

    void Update() {
        animationTime += 0.016f; // ~60fps

        if (autoRotate) {
            float pitch = std::sin(animationTime * 0.7f) * 45.0f;
            float yaw = animationTime * 20.0f;
            float roll = std::cos(animationTime * 0.5f) * 30.0f;
            SetEulerAngles(pitch, yaw, roll);
            AddToTrail();
        }

        if (autoSlerp && !useEuler) {
            slerpFactor = (std::sin(animationTime) + 1.0f) * 0.5f;
        }
    }

    void Render(wxGLCanvas *canvas) {
        if (!glewInitialized) {
            SetCurrent(*canvas);
            InitializeGLEW();
            glClearColor(0.05f, 0.05f, 0.1f, 1.0f);
            glEnable(GL_DEPTH_TEST);
            glEnable(GL_BLEND);
            glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
            glEnable(GL_LINE_SMOOTH);
            glHint(GL_LINE_SMOOTH_HINT, GL_NICEST);
        }

        Update();

        SetCurrent(*canvas);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        wxSize size = canvas->GetSize();
        double scale = canvas->GetContentScaleFactor();
        int width = size.x * scale;
        int height = size.y * scale;

        glViewport(0, 0, width, height);

        glMatrixMode(GL_PROJECTION);
        glLoadIdentity();
        float aspect = (float)width / (float)height;
        glm::mat4 projection = glm::perspective(glm::radians(45.0f), aspect, 0.1f, 100.0f);
        glLoadMatrixf(glm::value_ptr(projection));

        glMatrixMode(GL_MODELVIEW);
        glLoadIdentity();

        glm::mat4 view = glm::lookAt(
            glm::vec3(3.5f, 2.8f, 4.5f),
            glm::vec3(0.0f, 0.0f, 0.0f),
            glm::vec3(0.0f, 1.0f, 0.0f)
        );
        glLoadMatrixf(glm::value_ptr(view));

        // Draw reference grid with fade
        glLineWidth(1.0f);
        glBegin(GL_LINES);
        for (int i = -5; i <= 5; i++) {
            float fade = 1.0f - std::abs(i) / 5.0f * 0.5f;
            glColor4f(0.2f, 0.3f, 0.4f, 0.3f * fade);
            glVertex3f(i * 0.5f, -0.01f, -2.5f);
            glVertex3f(i * 0.5f, -0.01f, 2.5f);
            glVertex3f(-2.5f, -0.01f, i * 0.5f);
            glVertex3f(2.5f, -0.01f, i * 0.5f);
        }
        glEnd();

        // Draw rotation trail
        if (showTrail && rotationTrail.size() > 1) {
            glLineWidth(2.0f);
            glBegin(GL_LINE_STRIP);
            for (size_t i = 0; i < rotationTrail.size(); i++) {
                float alpha = (float)i / (float)rotationTrail.size();
                glColor4f(1.0f, 0.5f, 0.2f, alpha * 0.6f);
                glVertex3f(rotationTrail[i].x, rotationTrail[i].y, rotationTrail[i].z);
            }
            glEnd();

            // Draw trail points
            glPointSize(4.0f);
            glBegin(GL_POINTS);
            for (size_t i = 0; i < rotationTrail.size(); i++) {
                float alpha = (float)i / (float)rotationTrail.size();
                glColor4f(1.0f, 0.7f, 0.3f, alpha * 0.8f);
                glVertex3f(rotationTrail[i].x, rotationTrail[i].y, rotationTrail[i].z);
            }
            glEnd();
        }

        // Calculate current quaternion
        glm::quat renderQuat = useEuler ? currentQuat : glm::slerp(currentQuat, targetQuat, slerpFactor);
        glm::mat4 model = glm::mat4_cast(renderQuat);
        glLoadMatrixf(glm::value_ptr(view));
        glMultMatrixf(glm::value_ptr(model));

        // Draw cube if enabled
        if (showCube) {
            DrawCube(1.2f);
        }

        // Draw coordinate axes
        glm::vec3 origin(0.0f, 0.0f, 0.0f);
        float pulse = (std::sin(animationTime * 3.0f) + 1.0f) * 0.15f + 0.85f;
        DrawAxis(origin, glm::vec3(1.8f, 0.0f, 0.0f), 1.0f, 0.2f, 0.2f, pulse); // X red
        DrawAxis(origin, glm::vec3(0.0f, 1.8f, 0.0f), 0.2f, 1.0f, 0.2f, pulse); // Y green
        DrawAxis(origin, glm::vec3(0.0f, 0.0f, 1.8f), 0.2f, 0.5f, 1.0f, pulse); // Z blue

        glFlush();
        canvas->SwapBuffers();
    }
};

class MyGLCanvas : public wxGLCanvas {
    MyGLContext* m_context;
    wxTimer* m_timer;
public:
    MyGLCanvas(wxFrame* parent)
    : wxGLCanvas(parent, wxID_ANY, nullptr, wxDefaultPosition, wxDefaultSize, 0, wxT("GLCanvas")),
      m_context(new MyGLContext(this)),
      m_timer(new wxTimer(this))
    {
        SetMinSize(wxSize(400, 300));
        Bind(wxEVT_PAINT, &MyGLCanvas::OnPaint, this);
        Bind(wxEVT_SIZE, &MyGLCanvas::OnSize, this);
        Bind(wxEVT_TIMER, &MyGLCanvas::OnTimer, this);
        m_timer->Start(16); // ~60 FPS
    }

    ~MyGLCanvas() {
        m_timer->Stop();
        delete m_timer;
        delete m_context;
    }

    void OnPaint(wxPaintEvent& event) {
        wxPaintDC dc(this);
        m_context->Render(this);
    }

    void OnSize(wxSizeEvent& event) {
        Refresh();
        event.Skip();
    }

    void OnTimer(wxTimerEvent& event) {
        Refresh();
    }

    MyGLContext* GetContext() { return m_context; }
};

class MyFrame : public wxFrame {
public:
    MyGLCanvas* canvas;
    wxSlider* pitchSlider;
    wxSlider* yawSlider;
    wxSlider* rollSlider;
    wxSlider* slerpSlider;
    wxStaticText* quatDisplay;
    wxRadioButton* eulerRadio;
    wxRadioButton* slerpRadio;
    wxCheckBox* trailCheck;
    wxCheckBox* cubeCheck;
    wxButton* autoRotateBtn;
    wxButton* autoSlerpBtn;

    MyFrame(const wxString& title, const wxPoint& pos, const wxSize& size)
    : wxFrame(NULL, wxID_ANY, title, pos, size) {
        // Dark mode colors
        SetBackgroundColour(wxColour(30, 30, 35));

        wxBoxSizer* mainSizer = new wxBoxSizer(wxVERTICAL);

        canvas = new MyGLCanvas(this);
        mainSizer->Add(canvas, 1, wxEXPAND | wxALL, 5);

        wxPanel* controlPanel = new wxPanel(this);
        controlPanel->SetBackgroundColour(wxColour(30, 30, 35));
        controlPanel->SetForegroundColour(wxColour(220, 220, 220));
        wxBoxSizer* controlSizer = new wxBoxSizer(wxVERTICAL);

        // Animation controls
        wxStaticBoxSizer* animSizer = new wxStaticBoxSizer(wxHORIZONTAL, controlPanel, "Animation");
        autoRotateBtn = new wxButton(animSizer->GetStaticBox(), wxID_ANY, "Auto-Rotate", wxDefaultPosition, wxSize(120, -1), wxBORDER_SIMPLE);
        autoSlerpBtn = new wxButton(animSizer->GetStaticBox(), wxID_ANY, "Auto-SLERP", wxDefaultPosition, wxSize(120, -1), wxBORDER_SIMPLE);
        wxButton* clearTrailBtn = new wxButton(animSizer->GetStaticBox(), wxID_ANY, "Clear Trail", wxDefaultPosition, wxSize(100, -1), wxBORDER_SIMPLE);
        autoRotateBtn->SetBackgroundColour(wxColour(45, 45, 50));
        autoRotateBtn->SetForegroundColour(wxColour(220, 220, 220));
        autoSlerpBtn->SetBackgroundColour(wxColour(45, 45, 50));
        autoSlerpBtn->SetForegroundColour(wxColour(220, 220, 220));
        clearTrailBtn->SetBackgroundColour(wxColour(45, 45, 50));
        clearTrailBtn->SetForegroundColour(wxColour(220, 220, 220));
        animSizer->Add(autoRotateBtn, 0, wxALL, 5);
        animSizer->Add(autoSlerpBtn, 0, wxALL, 5);
        animSizer->Add(clearTrailBtn, 0, wxALL, 5);
        controlSizer->Add(animSizer, 0, wxEXPAND | wxALL, 5);

        // Visual options
        wxStaticBoxSizer* visSizer = new wxStaticBoxSizer(wxHORIZONTAL, controlPanel, "Visual Options");
        trailCheck = new wxCheckBox(visSizer->GetStaticBox(), wxID_ANY, "Show Trail");
        cubeCheck = new wxCheckBox(visSizer->GetStaticBox(), wxID_ANY, "Show Cube");
        trailCheck->SetValue(true);
        cubeCheck->SetValue(true);
        trailCheck->SetBackgroundColour(wxColour(30, 30, 35));
        trailCheck->SetForegroundColour(wxColour(220, 220, 220));
        cubeCheck->SetBackgroundColour(wxColour(30, 30, 35));
        cubeCheck->SetForegroundColour(wxColour(220, 220, 220));
        visSizer->Add(trailCheck, 0, wxALL, 5);
        visSizer->Add(cubeCheck, 0, wxALL, 5);
        controlSizer->Add(visSizer, 0, wxEXPAND | wxALL, 5);

        // Presets
        wxStaticBoxSizer* presetSizer = new wxStaticBoxSizer(wxHORIZONTAL, controlPanel, "Quick Presets");
        wxButton* gimbalBtn = new wxButton(presetSizer->GetStaticBox(), wxID_ANY, "Gimbal Lock Demo", wxDefaultPosition, wxDefaultSize, wxBORDER_SIMPLE);
        wxButton* spinBtn = new wxButton(presetSizer->GetStaticBox(), wxID_ANY, "360° Spin", wxDefaultPosition, wxDefaultSize, wxBORDER_SIMPLE);
        wxButton* flipBtn = new wxButton(presetSizer->GetStaticBox(), wxID_ANY, "Flip", wxDefaultPosition, wxDefaultSize, wxBORDER_SIMPLE);
        gimbalBtn->SetBackgroundColour(wxColour(45, 45, 50));
        gimbalBtn->SetForegroundColour(wxColour(220, 220, 220));
        spinBtn->SetBackgroundColour(wxColour(45, 45, 50));
        spinBtn->SetForegroundColour(wxColour(220, 220, 220));
        flipBtn->SetBackgroundColour(wxColour(45, 45, 50));
        flipBtn->SetForegroundColour(wxColour(220, 220, 220));
        presetSizer->Add(gimbalBtn, 1, wxALL, 5);
        presetSizer->Add(spinBtn, 1, wxALL, 5);
        presetSizer->Add(flipBtn, 1, wxALL, 5);
        controlSizer->Add(presetSizer, 0, wxEXPAND | wxALL, 5);

        // Mode selection
        wxStaticBoxSizer* modeSizer = new wxStaticBoxSizer(wxHORIZONTAL, controlPanel, "Mode");
        eulerRadio = new wxRadioButton(modeSizer->GetStaticBox(), wxID_ANY, "Euler Angles", wxDefaultPosition, wxDefaultSize, wxRB_GROUP);
        slerpRadio = new wxRadioButton(modeSizer->GetStaticBox(), wxID_ANY, "SLERP Interpolation");
        eulerRadio->SetValue(true);
        eulerRadio->SetBackgroundColour(wxColour(30, 30, 35));
        eulerRadio->SetForegroundColour(wxColour(220, 220, 220));
        slerpRadio->SetBackgroundColour(wxColour(30, 30, 35));
        slerpRadio->SetForegroundColour(wxColour(220, 220, 220));
        modeSizer->Add(eulerRadio, 0, wxALL, 5);
        modeSizer->Add(slerpRadio, 0, wxALL, 5);
        controlSizer->Add(modeSizer, 0, wxEXPAND | wxALL, 5);

        // Euler angle controls
        wxStaticBoxSizer* eulerSizer = new wxStaticBoxSizer(wxVERTICAL, controlPanel, "Euler Angles");

        wxBoxSizer* pitchSizer = new wxBoxSizer(wxHORIZONTAL);
        wxStaticText* pitchLabel = new wxStaticText(eulerSizer->GetStaticBox(), wxID_ANY, "Pitch (X):", wxDefaultPosition, wxSize(70, -1));
        pitchLabel->SetForegroundColour(wxColour(220, 220, 220));
        pitchSizer->Add(pitchLabel, 0, wxALIGN_CENTER_VERTICAL);
        pitchSlider = new wxSlider(eulerSizer->GetStaticBox(), wxID_ANY, 0, -180, 180, wxDefaultPosition, wxSize(250, -1));
        pitchSlider->SetBackgroundColour(wxColour(40, 40, 45));
        pitchSlider->SetForegroundColour(wxColour(100, 150, 255));
        pitchSizer->Add(pitchSlider, 1, wxEXPAND);
        wxStaticText* pitchVal = new wxStaticText(eulerSizer->GetStaticBox(), wxID_ANY, " 0°", wxDefaultPosition, wxSize(50, -1));
        pitchVal->SetForegroundColour(wxColour(220, 220, 220));
        pitchSizer->Add(pitchVal, 0, wxALIGN_CENTER_VERTICAL);
        eulerSizer->Add(pitchSizer, 0, wxEXPAND | wxALL, 3);

        wxBoxSizer* yawSizer = new wxBoxSizer(wxHORIZONTAL);
        wxStaticText* yawLabel = new wxStaticText(eulerSizer->GetStaticBox(), wxID_ANY, "Yaw (Y):", wxDefaultPosition, wxSize(70, -1));
        yawLabel->SetForegroundColour(wxColour(220, 220, 220));
        yawSizer->Add(yawLabel, 0, wxALIGN_CENTER_VERTICAL);
        yawSlider = new wxSlider(eulerSizer->GetStaticBox(), wxID_ANY, 0, -180, 180, wxDefaultPosition, wxSize(250, -1));
        yawSlider->SetBackgroundColour(wxColour(40, 40, 45));
        yawSlider->SetForegroundColour(wxColour(100, 255, 150));
        yawSizer->Add(yawSlider, 1, wxEXPAND);
        wxStaticText* yawVal = new wxStaticText(eulerSizer->GetStaticBox(), wxID_ANY, " 0°", wxDefaultPosition, wxSize(50, -1));
        yawVal->SetForegroundColour(wxColour(220, 220, 220));
        yawSizer->Add(yawVal, 0, wxALIGN_CENTER_VERTICAL);
        eulerSizer->Add(yawSizer, 0, wxEXPAND | wxALL, 3);

        wxBoxSizer* rollSizer = new wxBoxSizer(wxHORIZONTAL);
        wxStaticText* rollLabel = new wxStaticText(eulerSizer->GetStaticBox(), wxID_ANY, "Roll (Z):", wxDefaultPosition, wxSize(70, -1));
        rollLabel->SetForegroundColour(wxColour(220, 220, 220));
        rollSizer->Add(rollLabel, 0, wxALIGN_CENTER_VERTICAL);
        rollSlider = new wxSlider(eulerSizer->GetStaticBox(), wxID_ANY, 0, -180, 180, wxDefaultPosition, wxSize(250, -1));
        rollSlider->SetBackgroundColour(wxColour(40, 40, 45));
        rollSlider->SetForegroundColour(wxColour(255, 150, 100));
        rollSizer->Add(rollSlider, 1, wxEXPAND);
        wxStaticText* rollVal = new wxStaticText(eulerSizer->GetStaticBox(), wxID_ANY, " 0°", wxDefaultPosition, wxSize(50, -1));
        rollVal->SetForegroundColour(wxColour(220, 220, 220));
        rollSizer->Add(rollVal, 0, wxALIGN_CENTER_VERTICAL);
        eulerSizer->Add(rollSizer, 0, wxEXPAND | wxALL, 3);

        controlSizer->Add(eulerSizer, 0, wxEXPAND | wxALL, 5);

        // SLERP control
        wxStaticBoxSizer* slerpSizer = new wxStaticBoxSizer(wxVERTICAL, controlPanel, "SLERP Interpolation");
        wxBoxSizer* slerpHSizer = new wxBoxSizer(wxHORIZONTAL);
        wxStaticText* slerpLabel = new wxStaticText(slerpSizer->GetStaticBox(), wxID_ANY, "Factor:", wxDefaultPosition, wxSize(70, -1));
        slerpLabel->SetForegroundColour(wxColour(220, 220, 220));
        slerpHSizer->Add(slerpLabel, 0, wxALIGN_CENTER_VERTICAL);
        slerpSlider = new wxSlider(slerpSizer->GetStaticBox(), wxID_ANY, 0, 0, 100, wxDefaultPosition, wxSize(250, -1));
        slerpSlider->SetBackgroundColour(wxColour(40, 40, 45));
        slerpSlider->SetForegroundColour(wxColour(255, 200, 100));
        slerpSlider->Enable(false);
        slerpHSizer->Add(slerpSlider, 1, wxEXPAND);
        wxStaticText* slerpVal = new wxStaticText(slerpSizer->GetStaticBox(), wxID_ANY, " 0.00", wxDefaultPosition, wxSize(50, -1));
        slerpVal->SetForegroundColour(wxColour(220, 220, 220));
        slerpHSizer->Add(slerpVal, 0, wxALIGN_CENTER_VERTICAL);
        slerpSizer->Add(slerpHSizer, 0, wxEXPAND | wxALL, 3);

        wxBoxSizer* slerpButtonSizer = new wxBoxSizer(wxHORIZONTAL);
        wxButton* setStartBtn = new wxButton(slerpSizer->GetStaticBox(), wxID_ANY, "Set Start", wxDefaultPosition, wxDefaultSize, wxBORDER_SIMPLE);
        wxButton* setEndBtn = new wxButton(slerpSizer->GetStaticBox(), wxID_ANY, "Set End", wxDefaultPosition, wxDefaultSize, wxBORDER_SIMPLE);
        setStartBtn->SetBackgroundColour(wxColour(45, 45, 50));
        setStartBtn->SetForegroundColour(wxColour(220, 220, 220));
        setEndBtn->SetBackgroundColour(wxColour(45, 45, 50));
        setEndBtn->SetForegroundColour(wxColour(220, 220, 220));
        slerpButtonSizer->Add(setStartBtn, 1, wxALL, 3);
        slerpButtonSizer->Add(setEndBtn, 1, wxALL, 3);
        slerpSizer->Add(slerpButtonSizer, 0, wxEXPAND);

        controlSizer->Add(slerpSizer, 0, wxEXPAND | wxALL, 5);

        // Quaternion display
        wxStaticBoxSizer* displaySizer = new wxStaticBoxSizer(wxVERTICAL, controlPanel, "Current Quaternion");
        quatDisplay = new wxStaticText(displaySizer->GetStaticBox(), wxID_ANY, "w: 1.000, x: 0.000, y: 0.000, z: 0.000");
        quatDisplay->SetForegroundColour(wxColour(220, 220, 220));
        displaySizer->Add(quatDisplay, 0, wxALL, 8);
        controlSizer->Add(displaySizer, 0, wxEXPAND | wxALL, 5);

        wxButton* resetBtn = new wxButton(controlPanel, wxID_ANY, "Reset to Identity", wxDefaultPosition, wxDefaultSize, wxBORDER_SIMPLE);
        resetBtn->SetBackgroundColour(wxColour(45, 45, 50));
        resetBtn->SetForegroundColour(wxColour(220, 220, 220));
        controlSizer->Add(resetBtn, 0, wxALIGN_CENTER | wxALL, 5);

        controlPanel->SetSizer(controlSizer);
        mainSizer->Add(controlPanel, 0, wxEXPAND | wxALL, 5);

        this->SetSizerAndFit(mainSizer);
        this->SetClientSize(wxSize(1000, 750));

        // Event bindings
        eulerRadio->Bind(wxEVT_RADIOBUTTON, &MyFrame::OnModeChange, this);
        slerpRadio->Bind(wxEVT_RADIOBUTTON, &MyFrame::OnModeChange, this);
        pitchSlider->Bind(wxEVT_SLIDER, &MyFrame::OnSliderChange, this);
        yawSlider->Bind(wxEVT_SLIDER, &MyFrame::OnSliderChange, this);
        rollSlider->Bind(wxEVT_SLIDER, &MyFrame::OnSliderChange, this);
        slerpSlider->Bind(wxEVT_SLIDER, &MyFrame::OnSlerpChange, this);
        setStartBtn->Bind(wxEVT_BUTTON, &MyFrame::OnSetStart, this);
        setEndBtn->Bind(wxEVT_BUTTON, &MyFrame::OnSetEnd, this);
        resetBtn->Bind(wxEVT_BUTTON, &MyFrame::OnReset, this);
        autoRotateBtn->Bind(wxEVT_BUTTON, &MyFrame::OnAutoRotate, this);
        autoSlerpBtn->Bind(wxEVT_BUTTON, &MyFrame::OnAutoSlerp, this);
        clearTrailBtn->Bind(wxEVT_BUTTON, &MyFrame::OnClearTrail, this);
        trailCheck->Bind(wxEVT_CHECKBOX, &MyFrame::OnTrailToggle, this);
        cubeCheck->Bind(wxEVT_CHECKBOX, &MyFrame::OnCubeToggle, this);
        gimbalBtn->Bind(wxEVT_BUTTON, &MyFrame::OnGimbalLock, this);
        spinBtn->Bind(wxEVT_BUTTON, &MyFrame::OnSpin, this);
        flipBtn->Bind(wxEVT_BUTTON, &MyFrame::OnFlip, this);
    }

    void OnModeChange(wxCommandEvent& event) {
        bool useEuler = eulerRadio->GetValue();
        canvas->GetContext()->SetUseEuler(useEuler);
        pitchSlider->Enable(useEuler);
        yawSlider->Enable(useEuler);
        rollSlider->Enable(useEuler);
        slerpSlider->Enable(!useEuler);
        UpdateDisplay();
    }

    void OnSliderChange(wxCommandEvent& event) {
        float pitch = pitchSlider->GetValue();
        float yaw = yawSlider->GetValue();
        float roll = rollSlider->GetValue();
        canvas->GetContext()->SetEulerAngles(pitch, yaw, roll);

        pitchSlider->GetContainingSizer()->GetItem(2)->GetWindow()->SetLabel(wxString::Format(" %.0f°", pitch));
        yawSlider->GetContainingSizer()->GetItem(2)->GetWindow()->SetLabel(wxString::Format(" %.0f°", yaw));
        rollSlider->GetContainingSizer()->GetItem(2)->GetWindow()->SetLabel(wxString::Format(" %.0f°", roll));

        UpdateDisplay();
    }

    void OnSlerpChange(wxCommandEvent& event) {
        float factor = slerpSlider->GetValue() / 100.0f;
        canvas->GetContext()->SetSlerpFactor(factor);
        slerpSlider->GetContainingSizer()->GetItem(2)->GetWindow()->SetLabel(wxString::Format(" %.2f", factor));
        UpdateDisplay();
    }

    void OnSetStart(wxCommandEvent& event) {
        canvas->GetContext()->SetEulerAngles(
            pitchSlider->GetValue(),
            yawSlider->GetValue(),
            rollSlider->GetValue()
        );
        wxMessageBox("Start quaternion set!", "SLERP", wxOK | wxICON_INFORMATION);
    }

    void OnSetEnd(wxCommandEvent& event) {
        float pitch = pitchSlider->GetValue();
        float yaw = yawSlider->GetValue();
        float roll = rollSlider->GetValue();
        glm::vec3 eulerAngles(glm::radians(pitch), glm::radians(yaw), glm::radians(roll));
        glm::quat targetQuat = glm::quat(eulerAngles);
        canvas->GetContext()->SetTargetQuat(targetQuat);
        wxMessageBox("End quaternion set!", "SLERP", wxOK | wxICON_INFORMATION);
    }

    void OnReset(wxCommandEvent& event) {
        pitchSlider->SetValue(0);
        yawSlider->SetValue(0);
        rollSlider->SetValue(0);
        slerpSlider->SetValue(0);
        canvas->GetContext()->SetEulerAngles(0, 0, 0);
        canvas->GetContext()->ClearTrail();
        UpdateDisplay();
    }

    void OnAutoRotate(wxCommandEvent& event) {
        bool isActive = canvas->GetContext()->IsAutoRotating();
        canvas->GetContext()->SetAutoRotate(!isActive);
        autoRotateBtn->SetLabel(isActive ? "Auto-Rotate" : "Stop Rotate");
    }

    void OnAutoSlerp(wxCommandEvent& event) {
        bool isActive = canvas->GetContext()->IsAutoSlerp();
        canvas->GetContext()->SetAutoSlerp(!isActive);
        autoSlerpBtn->SetLabel(isActive ? "Auto-SLERP" : "Stop SLERP");
    }

    void OnClearTrail(wxCommandEvent& event) {
        canvas->GetContext()->ClearTrail();
    }

    void OnTrailToggle(wxCommandEvent& event) {
        canvas->GetContext()->SetShowTrail(trailCheck->GetValue());
    }

    void OnCubeToggle(wxCommandEvent& event) {
        canvas->GetContext()->SetShowCube(cubeCheck->GetValue());
    }

    void OnGimbalLock(wxCommandEvent& event) {
        pitchSlider->SetValue(90);
        yawSlider->SetValue(45);
        rollSlider->SetValue(0);
        OnSliderChange(event);
    }

    void OnSpin(wxCommandEvent& event) {
        yawSlider->SetValue(180);
        pitchSlider->SetValue(0);
        rollSlider->SetValue(0);
        OnSliderChange(event);
    }

    void OnFlip(wxCommandEvent& event) {
        pitchSlider->SetValue(180);
        yawSlider->SetValue(0);
        rollSlider->SetValue(0);
        OnSliderChange(event);
    }

    void UpdateDisplay() {
        glm::quat q = canvas->GetContext()->GetCurrentQuat();
        wxString display = wxString::Format(
            "w: %.3f, x: %.3f, y: %.3f, z: %.3f",
            q.w, q.x, q.y, q.z
        );
        quatDisplay->SetLabel(display);
    }
};

class MyApp : public wxApp {
public:
    virtual bool OnInit() {
        MyFrame* frame = new MyFrame(wxT("✨ Quaternion Visualizer - GLM Demo"), wxDefaultPosition, wxSize(1000, 750));
        frame->Centre();
        frame->Show(true);
        return true;
    }
};

wxIMPLEMENT_APP(MyApp);
