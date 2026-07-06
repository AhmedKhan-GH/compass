#include <wx/wx.h>

#include "main_frame.h"

class CompassApp : public wxApp {
public:
    bool OnInit() override {
        if (!wxApp::OnInit())
            return false;
        SetAppName("Compass");
        SetVendorName("Compass");
        (new MainFrame())->Show(true);
        return true;
    }
};

wxIMPLEMENT_APP(CompassApp);
