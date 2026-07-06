// Compass framework (libcompass) — App implementation.

#include "compass/app.h"

#include <wx/image.h>
#include <wx/persist/toplevel.h>

namespace compass {

bool App::OnInit() {
    if (!wxApp::OnInit()) return false;
    SetAppName(AppName());
    SetVendorName(VendorName());
    wxImage::AddHandler(new wxPNGHandler);  // instruments export PNG snapshots

    wxFrame* frame = CreateMainFrame();
    wxPersistentRegisterAndRestore(frame, "MainFrame");  // window geometry
    frame->Show(true);
    return true;
}

}  // namespace compass
