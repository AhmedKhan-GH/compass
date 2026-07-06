#include <wx/wx.h>

class CompassApp : public wxApp {
public:
    bool OnInit() override {
        if (!wxApp::OnInit())
            return false;
        SetAppName("Compass");
        SetVendorName("Compass");
        auto* frame = new wxFrame(nullptr, wxID_ANY, "Compass",
                                  wxDefaultPosition, wxSize(1000, 700));
        frame->Show(true);
        return true;
    }
};

wxIMPLEMENT_APP(CompassApp);
