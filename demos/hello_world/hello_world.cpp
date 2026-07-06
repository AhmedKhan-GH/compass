// The minimal Compass instrument shape (PLATFORM.md §1): one static binary,
// native UI only. No GL, no third-party libs — just wx and system frameworks.
#include <wx/wx.h>

class HelloFrame : public wxFrame {
public:
    HelloFrame()
        : wxFrame(nullptr, wxID_ANY, "Hello Compass",
                  wxDefaultPosition, wxSize(480, 320)) {
        auto* fileMenu = new wxMenu;
        fileMenu->Append(wxID_EXIT);
        auto* helpMenu = new wxMenu;
        helpMenu->Append(wxID_ABOUT);
        auto* menuBar = new wxMenuBar;
        menuBar->Append(fileMenu, "&File");
        menuBar->Append(helpMenu, "&Help");
        SetMenuBar(menuBar);

        CreateStatusBar();
        SetStatusText("Ready");

        auto* text = new wxStaticText(this, wxID_ANY, "Hello, Compass");
        text->SetFont(text->GetFont().Scaled(2.0f));

        auto* sizer = new wxBoxSizer(wxVERTICAL);
        sizer->AddStretchSpacer();
        sizer->Add(text, 0, wxALIGN_CENTER);
        sizer->AddStretchSpacer();
        SetSizer(sizer);

        Bind(wxEVT_MENU, [this](wxCommandEvent&) { Close(true); }, wxID_EXIT);
        Bind(wxEVT_MENU, [this](wxCommandEvent&) {
            wxMessageBox("The minimal Compass instrument shape:\n"
                         "one static binary, native UI, nothing else.",
                         "Hello Compass", wxOK | wxICON_INFORMATION, this);
        }, wxID_ABOUT);
    }
};

class HelloApp : public wxApp {
public:
    bool OnInit() override {
        if (!wxApp::OnInit())
            return false;
        SetAppName("HelloCompass");
        (new HelloFrame())->Show(true);
        return true;
    }
};

wxIMPLEMENT_APP(HelloApp);
