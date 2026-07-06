#include <wx/wx.h>
#include <wx/persist/toplevel.h>

#include "main_frame.h"

class CompassApp : public wxApp {
public:
    bool OnInit() override {
        if (!wxApp::OnInit())
            return false;
        SetAppName("Compass");
        SetVendorName("Compass");
        auto* frame = new MainFrame();
        wxPersistentRegisterAndRestore(frame, "MainFrame");
        frame->Show(true);
        return true;
    }
};

wxIMPLEMENT_APP(CompassApp);
